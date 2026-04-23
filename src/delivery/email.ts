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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BLOCKED_SENDER_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
]);

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function extractEmailAddress(input: string): string {
  const trimmed = input.trim();
  const angleBracketMatch = trimmed.match(/<([^>]+)>/);
  const email = (angleBracketMatch?.[1] ?? trimmed).trim().toLowerCase();

  if (!EMAIL_REGEX.test(email)) {
    throw new Error(`Invalid email address format: ${input}`);
  }

  return email;
}

export function parseRecipientList(rawRecipients: string): string[] {
  const recipients = rawRecipients
    .split(",")
    .map((recipient) => recipient.trim())
    .filter(Boolean)
    .map(extractEmailAddress);

  if (recipients.length === 0) {
    throw new Error("DIGEST_TO_EMAIL must contain at least one recipient email address.");
  }

  return [...new Set(recipients)];
}

export function validateSender(rawSender: string): string {
  const email = extractEmailAddress(rawSender);
  const [, domain = ""] = email.split("@");

  if (BLOCKED_SENDER_DOMAINS.has(domain)) {
    throw new Error(
      `DIGEST_FROM_EMAIL uses ${domain}, which email providers like Resend do not allow as an unverified sender. Use onboarding@resend.dev for testing or a verified custom domain instead.`,
    );
  }

  return email;
}

export async function sendDigestEmail(input: SendDigestEmailInput): Promise<void> {
  const apiKey = requiredEnv("RESEND_API_KEY");
  const to = parseRecipientList(requiredEnv("DIGEST_TO_EMAIL"));
  const from = requiredEnv("DIGEST_FROM_EMAIL");
  const validatedSender = validateSender(from);
  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) {
    throw new Error(
      `Resend API error${error.statusCode ? ` (${error.statusCode})` : ""}: ${error.message}`,
    );
  }

  console.log("Resend accepted email:", {
    id: data?.id,
    fromDomain: validatedSender.split("@")[1],
    recipientCount: to.length,
    subject: input.subject,
  });
}
