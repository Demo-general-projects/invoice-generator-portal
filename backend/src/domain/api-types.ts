// Backend copy. The frontend keeps its own copy in frontend/src/lib/api-types.ts; keep them in sync.
import type { InvoiceInput } from "./invoice-schema";
import type { Totals } from "./totals";

// JSON shapes returned by this API; dates travel as ISO strings.

export type InvoiceSummary = {
  id: string;
  number: string;
  customerName: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  totalCents: number;
  itemCount: number;
  lastSentAt: string | null;
  updatedAt: string;
};

export type InvoiceDTO = InvoiceInput & { id: string; lastSentAt: string | null; createdAt: string; updatedAt: string };

export type InvoiceResponse = { invoice: InvoiceDTO; totals: Totals };

export type InvoiceDefaults = {
  number: string;
  issueDate: string;
  dueDate: string;
  business: { businessName: string; businessEmail: string; businessAddress: string } | null;
};

export type ApiErrorBody = { error: { message: string; fieldErrors?: Record<string, string> } };
