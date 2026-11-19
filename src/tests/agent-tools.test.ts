import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  order: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  shipment: { findMany: vi.fn() },
  approvalRequest: { create: vi.fn() },
  agentAction: { create: vi.fn() },
}));
const sendEmail = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/email", () => ({ sendEmail }));
vi.mock("@/lib/sms", () => ({ sendSms: vi.fn() }));

const { executeTool } = await import("@/lib/agent/tools");

const ORDER = {
  id: "order_1",
  orderNumber: "SNC-1",
  userId: "user_a",
  status: "SHIPPED",
  createdAt: new Date("2026-11-01"),
  totalPaise: 149900,
  shippingAddress: { city: "Jaipur" },
  user: { email: "a@example.com", name: "Asha Rao", phone: null },
  items: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  db.order.count.mockResolvedValue(1);
});

describe("agent tools: ownership", () => {
  it("chat scope queries the order filtered by the signed-in user", async () => {
    db.order.findFirst.mockResolvedValue(ORDER);
    const r = await executeTool({ trigger: "CHAT", userId: "user_a" }, "get_order", { order_id: "order_1" });
    expect(r.ok).toBe(true);
    expect(db.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "order_1", userId: "user_a" } }),
    );
  });

  it("chat scope cannot read another user's order", async () => {
    db.order.findFirst.mockResolvedValue(null); // the userId filter excludes it
    const r = await executeTool({ trigger: "CHAT", userId: "user_b" }, "get_order", { order_id: "order_1" });
    expect(r).toEqual({ ok: false, content: "Order not found." });
  });

  it("webhook scope cannot touch a different order", async () => {
    const r = await executeTool(
      { trigger: "WEBHOOK", orderId: "order_1", idempotencyKey: "evt" },
      "get_order",
      { order_id: "order_2" },
    );
    expect(r.ok).toBe(false);
    expect(db.order.findFirst).not.toHaveBeenCalled();
  });

  it("send_update is not available from chat", async () => {
    const r = await executeTool({ trigger: "CHAT", userId: "user_a" }, "send_update", {
      order_id: "order_1",
      channel: "email",
      subject: "Hi",
      message: "Hello",
    });
    expect(r.ok).toBe(false);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("refund requests become ApprovalRequests, never automatic", async () => {
    db.order.findFirst.mockResolvedValue(ORDER);
    db.approvalRequest.create.mockResolvedValue({ id: "apr_1", status: "PENDING" });
    const r = await executeTool({ trigger: "CHAT", userId: "user_a" }, "escalate_to_admin", {
      order_id: "order_1",
      type: "REFUND",
      reason: "Item arrived damaged",
    });
    expect(r.ok).toBe(true);
    expect(db.approvalRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: "REFUND", orderId: "order_1", userId: "user_a" }),
    });
  });
});

describe("agent tools: audit log", () => {
  it("logs successful calls", async () => {
    db.order.findMany.mockResolvedValue([]);
    await executeTool({ trigger: "CHAT", userId: "user_a" }, "list_user_orders", {});
    expect(db.agentAction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tool: "list_user_orders", success: true, trigger: "CHAT" }),
    });
  });

  it("logs failed and unknown calls too", async () => {
    await executeTool({ trigger: "CHAT", userId: "user_a" }, "issue_refund", { order_id: "order_1" });
    expect(db.agentAction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tool: "issue_refund", success: false }),
    });
  });
});
