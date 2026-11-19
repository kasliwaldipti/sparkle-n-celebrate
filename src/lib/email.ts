import "server-only";
import { Resend } from "resend";
import { siteConfig } from "@/config/site";
import { requireEnv } from "@/lib/env";

let resend: Resend | undefined;

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  /** Prevents duplicate sends when an Inngest step retries. */
  idempotencyKey?: string;
}

export async function sendEmail({ to, subject, text, html, idempotencyKey }: SendEmailInput) {
  resend ??= new Resend(requireEnv("RESEND_API_KEY"));
  const from = `${siteConfig.name} <${requireEnv("EMAIL_FROM")}>`;
  // TODO: replace plain text with a branded React Email template.
  const { data, error } = await resend.emails.send(
    { from, to, subject, text, html },
    idempotencyKey ? { idempotencyKey } : undefined,
  );
  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
}
