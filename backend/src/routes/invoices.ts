import { Router } from "express";
import { todayISO } from "../domain/dates";
import { emailRequestSchema, invoiceInputSchema } from "../domain/invoice-schema";
import { calculateTotals } from "../domain/totals";
import { EmailNotConfiguredError, sendEmail } from "../email/mailer";
import { renderInvoiceEmail } from "../email/render-invoice-email";
import { sendError, validate } from "../http";
import {
  createInvoice,
  DuplicateInvoiceNumberError,
  getInvoice,
  latestBusinessDetails,
  listInvoices,
  markInvoiceSent,
  suggestInvoiceNumber,
  updateInvoice,
  type StoredInvoice,
} from "../invoices";

export const invoicesRouter = Router();

const withTotals = (invoice: StoredInvoice) => ({ invoice, totals: calculateTotals(invoice) });

invoicesRouter.get("/", async (_req, res) => {
  res.json({ invoices: await listInvoices() });
});

/** Suggested number, dates and sender details for a new invoice. */
invoicesRouter.get("/defaults", async (_req, res) => {
  const [number, business] = await Promise.all([suggestInvoiceNumber(), latestBusinessDetails()]);
  res.json({ number, business, issueDate: todayISO(), dueDate: todayISO(30) });
});

invoicesRouter.post("/", async (req, res) => {
  const input = validate(res, invoiceInputSchema, req.body);
  if (!input) return;
  try {
    res.status(201).json(withTotals(await createInvoice(input)));
  } catch (error) {
    if (error instanceof DuplicateInvoiceNumberError) return sendError(res, 409, error.message, { number: error.message });
    throw error;
  }
});

invoicesRouter.get("/:id", async (req, res) => {
  const invoice = await getInvoice(req.params.id);
  if (!invoice) return sendError(res, 404, "Invoice not found");
  res.json(withTotals(invoice));
});

invoicesRouter.put("/:id", async (req, res) => {
  const input = validate(res, invoiceInputSchema, req.body);
  if (!input) return;
  try {
    const invoice = await updateInvoice(req.params.id, input);
    if (!invoice) return sendError(res, 404, "Invoice not found");
    res.json(withTotals(invoice));
  } catch (error) {
    if (error instanceof DuplicateInvoiceNumberError) return sendError(res, 409, error.message, { number: error.message });
    throw error;
  }
});

/** Emails the saved invoice. The body only chooses recipient, subject and message. */
invoicesRouter.post("/:id/email", async (req, res) => {
  const request = validate(res, emailRequestSchema, req.body);
  if (!request) return;

  const invoice = await getInvoice(req.params.id);
  if (!invoice) return sendError(res, 404, "Invoice not found");

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const { html, text } = renderInvoiceEmail(invoice, {
    message: request.message,
    viewUrl: `${appUrl}/invoices/${invoice.id}`,
  });

  try {
    await sendEmail({ to: request.to, subject: request.subject, html, text });
  } catch (error) {
    if (error instanceof EmailNotConfiguredError) return sendError(res, 503, error.message);
    console.error("Email delivery failed", error);
    return sendError(res, 502, "The email provider rejected the message. Check the SMTP settings and try again.");
  }

  res.json({ sentAt: await markInvoiceSent(invoice.id) });
});
