import nodemailer, { type Transporter } from "nodemailer";
import { z } from "zod";

// Credentials are read server-side only and never prefixed with NEXT_PUBLIC_.
const smtpEnvSchema = z.object({
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  // Providers reject a bare name, so require `you@example.com` or `Name <you@example.com>`.
  EMAIL_FROM: z.string().regex(/^(?:[^<>]+<[^\s<>]+@[^\s<>]+>|[^\s<>]+@[^\s<>]+)$/, "EMAIL_FROM"),
});

export class EmailNotConfiguredError extends Error {
  constructor(detail = "Add SMTP settings to .env (see README).") {
    super(`Email isn't configured on the server. ${detail}`);
  }
}

let transporter: Transporter | undefined;

function getConfig() {
  const env = smtpEnvSchema.safeParse(process.env);
  if (!env.success) {
    const badFrom = env.error.issues.some((i) => i.path[0] === "EMAIL_FROM" && process.env.EMAIL_FROM);
    throw new EmailNotConfiguredError(
      badFrom ? 'EMAIL_FROM must look like "Name <you@example.com>".' : undefined,
    );
  }
  return env.data;
}

export async function sendEmail(message: { to: string; subject: string; html: string; text: string }) {
  const config = getConfig();
  transporter ??= nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
  });
  await transporter.sendMail({ from: config.EMAIL_FROM, ...message });
}
