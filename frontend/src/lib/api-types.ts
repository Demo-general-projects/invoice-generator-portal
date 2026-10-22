// JSON shapes of the Laravel API (backend/app/Http/Resources/ and InvoiceController); keep them in sync.
import type { InvoiceInput } from "./invoice-schema";
import type { TemplateId } from "./templates";
import type { Totals } from "./totals";

// JSON shapes returned by the backend API; dates travel as ISO strings.

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
  business: { businessName: string; businessEmail: string; businessPhone: string; businessAddress: string } | null;
  template: TemplateId;
  taxRateBps: number;
  notes: string;
};

export type BusinessSettingsDTO = {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  defaultTemplate: TemplateId;
  defaultTaxRateBps: number;
  defaultNotes: string;
};

export type ApiErrorBody = { error: { message: string; fieldErrors?: Record<string, string> } };
