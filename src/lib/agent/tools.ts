import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { siteConfig } from "@/config/site";
import { Prisma } from "@/generated/prisma/client";

/**
 * Who the agent is acting for. Built by the server, never by the model.
 * - CHAT: the signed-in customer; tools may only touch that user's orders.
 * - WEBHOOK: one order named by a verified courier webhook; tools may only touch that order.
 */
export type AgentScope =
  | { trigger: "CHAT"; userId: string }
  | { trigger: "WEBHOOK"; orderId: string; idempotencyKey: string };

export class ToolAccessError extends Error {}

// ---------- Input schemas (also sent to Claude as JSON Schema) ----------

const orderIdInput = z.object({ order_id: z.string().min(1).describe("The order ID") });

const sendUpdateInput = z.object({
  order_id: z.string().min(1),
  channel: z.enum(["email", "sms", "both"]),
  subject: z.string().max(120).describe("Email subject line"),
  message: z.string().min(1).max(1200).describe("The personalised update for the customer"),
});

const escalateInput = z.object({
  order_id: z.string().min(1),
  type: z.enum(["REFUND", "CANCELLATION", "ADDRESS_CHANGE", "OTHER"]),
  reason: z.string().min(1).max(1000).describe("What the customer asked for or what went wrong"),
});

const inputSchemas = {
  get_order: orderIdInput,
  get_tracking: orderIdInput,
  list_user_orders: z.object({}),
  send_update: sendUpdateInput,
  escalate_to_admin: escalateInput,
} as const;

export type ToolName = keyof typeof inputSchemas;

const descriptions: Record<ToolName, string> = {
  get_order: "Get one order's status, items, totals (in paise) and shipping city.",
  get_tracking: "Get the latest courier tracking status and recent scan events for an order.",
  list_user_orders: "List the signed-in customer's recent orders (chat only).",
  send_update: "Send the customer an order update by email and/or SMS (courier updates only).",
  escalate_to_admin:
    "Create an admin approval request. Required for refunds, cancellations and address changes, and for delivery problems.",
};

function toInputSchema(schema: z.ZodType): Anthropic.Tool.InputSchema {
  const { $schema: _ignored, ...json } = z.toJSONSchema(schema) as Record<string, unknown>;
  return { ...json, type: "object" } as Anthropic.Tool.InputSchema;
}

export const toolDefinitions: Anthropic.Tool[] = (Object.keys(inputSchemas) as ToolName[]).map(
  (name) => ({
    name,
    description: descriptions[name],
    input_schema: toInputSchema(inputSchemas[name]),
  }),
);

// ---------- Ownership check ----------

/** Loads an order only if the scope may see it. Throws ToolAccessError otherwise. */
async function loadOwnedOrder(scope: AgentScope, orderId: string) {
  if (scope.trigger === "WEBHOOK" && orderId !== scope.orderId) {
    throw new ToolAccessError("This update may only act on the order from the webhook.");
  }
  const order = await db.order.findFirst({
    where: scope.trigger === "CHAT" ? { id: orderId, userId: scope.userId } : { id: orderId },
    include: { user: true, items: true },
  });
  // Same message for "missing" and "not yours", so order IDs can't be probed.
  if (!order) throw new ToolAccessError("Order not found.");
  return order;
}

// ---------- Tool implementations ----------

const handlers: { [K in ToolName]: (scope: AgentScope, input: z.infer<(typeof inputSchemas)[K]>) => Promise<unknown> } = {
  async get_order(scope, { order_id }) {
    const order = await loadOwnedOrder(scope, order_id);
    const address = order.shippingAddress as { city?: string } | null;
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      placedAt: order.createdAt.toISOString(),
      totalPaise: order.totalPaise,
      customerFirstName: order.user.name?.split(" ")[0] ?? null,
      shipToCity: address?.city ?? null,
      items: order.items.map((i) => ({ name: i.productName, quantity: i.quantity })),
    };
  },

  async get_tracking(scope, { order_id }) {
    await loadOwnedOrder(scope, order_id);
    const shipments = await db.shipment.findMany({
      where: { orderId: order_id },
      include: { events: { orderBy: { occurredAt: "desc" }, take: 5 } },
    });
    return shipments.map((s) => ({
      courier: s.courier,
      trackingNumber: s.trackingNumber,
      status: s.status,
      estimatedDelivery: s.estimatedDelivery?.toISOString() ?? null,
      recentEvents: s.events.map((e) => ({
        status: e.status,
        message: e.message,
        location: e.location,
        at: e.occurredAt.toISOString(),
      })),
    }));
  },

  async list_user_orders(scope) {
    if (scope.trigger !== "CHAT") {
      throw new ToolAccessError("list_user_orders is only available in chat.");
    }
    const orders = await db.order.findMany({
      where: { userId: scope.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, orderNumber: true, status: true, totalPaise: true, createdAt: true },
    });
    return orders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() }));
  },

  async send_update(scope, { order_id, channel, subject, message }) {
    if (scope.trigger !== "WEBHOOK") {
      throw new ToolAccessError("send_update is only used for courier updates.");
    }
    const order = await loadOwnedOrder(scope, order_id);
    const sent: string[] = [];
    const key = `${scope.idempotencyKey}:${order.id}`;

    if (channel !== "sms") {
      await sendEmail({
        to: order.user.email,
        subject: subject || `Update on your ${siteConfig.name} order ${order.orderNumber}`,
        text: message,
        idempotencyKey: `${key}:email`,
      });
      sent.push("email");
    }
    if (channel !== "email") {
      if (order.user.phone) {
        await sendSms(order.user.phone, message);
        sent.push("sms");
      }
    }
    return { sent };
  },

  async escalate_to_admin(scope, { order_id, type, reason }) {
    const order = await loadOwnedOrder(scope, order_id);
    const request = await db.approvalRequest.create({
      data: { orderId: order.id, userId: order.userId, type, reason, payload: { source: scope.trigger } },
    });
    // TODO: notify admins (email) about the new approval request.
    return { approvalRequestId: request.id, status: request.status };
  },
};

// ---------- Entry point: validate, check, run, and always log ----------

export interface ToolResult {
  ok: boolean;
  content: string;
}

export async function executeTool(
  scope: AgentScope,
  name: string,
  rawInput: unknown,
): Promise<ToolResult> {
  const orderIdForLog =
    scope.trigger === "WEBHOOK"
      ? scope.orderId
      : typeof (rawInput as { order_id?: unknown })?.order_id === "string"
        ? (rawInput as { order_id: string }).order_id
        : null;

  let output: unknown = null;
  let error: string | null = null;

  try {
    if (!(name in inputSchemas)) throw new ToolAccessError(`Unknown tool: ${name}`);
    const toolName = name as ToolName;
    const parsed = inputSchemas[toolName].safeParse(rawInput);
    if (!parsed.success) throw new ToolAccessError(`Invalid input: ${parsed.error.message}`);
    const handler = handlers[toolName] as (s: AgentScope, i: unknown) => Promise<unknown>;
    output = await handler(scope, parsed.data);
    return { ok: true, content: JSON.stringify(output) };
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    // Access errors are safe to show the model; anything else gets a generic message.
    const shown = e instanceof ToolAccessError ? error : "The tool failed. Try again later.";
    return { ok: false, content: shown };
  } finally {
    await logAgentAction(scope, name, rawInput, output, error, orderIdForLog);
  }
}

async function logAgentAction(
  scope: AgentScope,
  tool: string,
  input: unknown,
  output: unknown,
  error: string | null,
  orderId: string | null,
) {
  try {
    // Only link the order if it exists and the scope may see it; otherwise keep the attempted ID in input.
    const linkable =
      orderId &&
      (await db.order.count({
        where: scope.trigger === "CHAT" ? { id: orderId, userId: scope.userId } : { id: orderId },
      }));
    await db.agentAction.create({
      data: {
        trigger: scope.trigger,
        tool,
        input: (input ?? {}) as Prisma.InputJsonValue,
        output: output === null ? Prisma.JsonNull : (output as Prisma.InputJsonValue),
        success: error === null,
        error,
        orderId: linkable ? orderId : null,
        userId: scope.trigger === "CHAT" ? scope.userId : null,
      },
    });
  } catch (e) {
    // Logging must never break the agent, but we want to know about it.
    console.error("Failed to write AgentAction", e);
  }
}
