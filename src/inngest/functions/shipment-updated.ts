import { inngest, shipmentUpdated } from "@/lib/inngest";
import { db } from "@/lib/db";
import { runAgent } from "@/lib/agent/agent";
import { webhookUserMessage } from "@/lib/agent/prompts";

/**
 * Courier webhook -> this job -> agent -> personalised email/SMS.
 * The agent run is one step, so Inngest retries it as a unit; send_update passes an
 * idempotency key (the event ID) so a retry doesn't email the customer twice.
 */
export const shipmentUpdatedFn = inngest.createFunction(
  {
    id: "shipment-updated",
    triggers: [shipmentUpdated],
    retries: 3,
    // Many scans for one shipment in quick succession -> one update.
    debounce: { key: "event.data.shipmentId", period: "2m" },
  },
  async ({ event, step }) => {
    const context = await step.run("load-shipment", async () => {
      const shipment = await db.shipment.findUnique({
        where: { id: event.data.shipmentId },
        include: { events: { where: { id: event.data.trackingEventId } } },
      });
      if (!shipment) return null;
      const latest = shipment.events[0];
      return {
        orderId: shipment.orderId,
        summary: `Courier: ${shipment.courier}\nTracking: ${shipment.trackingNumber}\nStatus: ${shipment.status}\nLatest scan: ${latest?.message ?? "n/a"} ${latest?.location ?? ""}`,
      };
    });

    if (!context) return { skipped: "shipment not found" };

    const result = await step.run("run-agent", () =>
      runAgent({
        scope: { trigger: "WEBHOOK", orderId: context.orderId, idempotencyKey: event.id ?? event.data.trackingEventId },
        messages: [{ role: "user", content: webhookUserMessage(context.orderId, context.summary) }],
      }),
    );

    return { orderId: context.orderId, summary: result.text, iterations: result.iterations };
  },
);

export const functions = [shipmentUpdatedFn];
