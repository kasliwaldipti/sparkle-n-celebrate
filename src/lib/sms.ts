import "server-only";
import twilio from "twilio";
import { siteConfig } from "@/config/site";
import { requireEnv } from "@/lib/env";

let client: ReturnType<typeof twilio> | undefined;

/** Sends an SMS. Messages end with the brand name so customers know who it's from. */
export async function sendSms(to: string, body: string) {
  client ??= twilio(requireEnv("TWILIO_ACCOUNT_SID"), requireEnv("TWILIO_AUTH_TOKEN"));
  // TODO: Indian numbers need DLT-registered templates/sender IDs for transactional SMS.
  return client.messages.create({
    to,
    from: requireEnv("TWILIO_FROM_NUMBER"),
    body: `${body}\n- ${siteConfig.name}`,
  });
}
