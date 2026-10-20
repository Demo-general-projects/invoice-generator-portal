import { apiError, parseBody } from "@/lib/api";
import { renderInvoiceEmail } from "@/lib/email/render-invoice-email";
import { EmailNotConfiguredError, sendEmail } from "@/lib/email/mailer";
import { emailRequestSchema } from "@/lib/invoice-schema";
import { getInvoice, markInvoiceSent } from "@/lib/invoices";

/** Emails the saved invoice. The body only chooses recipient, subject and message. */
export async function POST(request: Request, ctx: RouteContext<"/api/invoices/[id]/email">) {
  const { id } = await ctx.params;
  const parsed = await parseBody(request, emailRequestSchema);
  if ("response" in parsed) return parsed.response;

  const invoice = await getInvoice(id);
  if (!invoice) return apiError(404, "Invoice not found");

  const appUrl = process.env.APP_URL ?? new URL(request.url).origin;
  const { html, text } = renderInvoiceEmail(invoice, {
    message: parsed.data.message,
    viewUrl: `${appUrl}/invoices/${invoice.id}`,
  });

  try {
    await sendEmail({ to: parsed.data.to, subject: parsed.data.subject, html, text });
  } catch (error) {
    if (error instanceof EmailNotConfiguredError) return apiError(503, error.message);
    console.error("Email delivery failed", error);
    return apiError(502, "The email provider rejected the message. Check the SMTP settings and try again.");
  }

  const sentAt = await markInvoiceSent(invoice.id);
  return Response.json({ sentAt });
}
