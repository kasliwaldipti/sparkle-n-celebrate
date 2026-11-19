import { z } from "zod";

// Only the fields we use; AfterShip sends more. TODO: confirm against your AfterShip webhook version.
export const aftershipCheckpointSchema = z.object({
  id: z.string().optional(),
  checkpoint_time: z.string(),
  message: z.string().default(""),
  location: z.string().nullish(),
  tag: z.string(),
});

export const aftershipWebhookSchema = z.object({
  event: z.string(),
  msg: z.object({
    id: z.string(),
    tracking_number: z.string(),
    slug: z.string(),
    tag: z.string(),
    expected_delivery: z.string().nullish(),
    checkpoints: z.array(aftershipCheckpointSchema).default([]),
  }),
});

export type AftershipWebhook = z.infer<typeof aftershipWebhookSchema>;
