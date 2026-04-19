/**
 * Purpose:
 * This file sends the rendered digest through an email provider.
 * This implementation uses the official Resend SDK so the project matches the
 * provider's recommended integration style.
 */

import { Resend } from "resend";

export interface SendDigestEmailInput {
  subject: string;
  html: string;
  text: string;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function sendDigestEmail(input: SendDigestEmailInput): Promise<void> {
  const apiKey = requiredEnv("RESEND_API_KEY");
  const to = requiredEnv("DIGEST_TO_EMAIL");
  const from = requiredEnv("DIGEST_FROM_EMAIL");
  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) {
    throw new Error(`Resend API error: ${JSON.stringify(error)}`);
  }

  console.log("Resend accepted email:", {
    id: data?.id,
    from,
    to,
    subject: input.subject,
  });
}
