import nodemailer, { type Transporter } from "nodemailer";
import { z } from "zod";

// Credentials are read server-side only and never prefixed with NEXT_PUBLIC_.
const smtpEnvSchema = z.object({
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
});

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email isn't configured on the server. Add SMTP settings to .env (see README).");
  }
}

let transporter: Transporter | undefined;

function getConfig() {
  const env = smtpEnvSchema.safeParse(process.env);
  if (!env.success) throw new EmailNotConfiguredError();
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
