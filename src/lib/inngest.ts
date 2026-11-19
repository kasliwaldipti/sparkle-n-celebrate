import { Inngest, eventType } from "inngest";
import { z } from "zod";

// Inngest calls our app over HTTPS at /api/inngest; there are no in-process workers or timers.
export const inngest = new Inngest({ id: "sparkle-n-celebrate" });

export const shipmentUpdated = eventType("shipment.updated", {
  schema: z.object({
    shipmentId: z.string(),
    trackingEventId: z.string(),
  }),
});
