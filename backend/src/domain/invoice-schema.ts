// Backend copy of the invoice rules. The API is the source of truth: it
// re-validates every request with these schemas. The frontend keeps its own
// copy (frontend/src/lib/invoice-schema.ts) for instant form feedback; keep the
// rules in sync.
import { z } from "zod";
import { formatUSD } from "./money";
import { calculateTotals } from "./totals";

// Upper bounds keep every intermediate product inside Number.MAX_SAFE_INTEGER.
export const LIMITS = {
  quantityHundredths: 1_000_000_00, // 1,000,000 units
  unitPriceCents: 10_000_000_00, // $10M
  taxRateBps: 100_00, // 100%
  lineItems: 100,
  customFields: 20,
} as const;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const optionalEmail = z.union([z.literal(""), z.email("Enter a valid email address")]);

/* ------------------------------------------------------------------------ */
/* API / storage shape: integers only. Used by the server to re-validate.   */
/* ------------------------------------------------------------------------ */

const baseFields = {
  number: z.string().trim().min(1, "Invoice number is required").max(40),
  issueDate: z.string().regex(DATE, "Pick an issue date"),
  dueDate: z.string().regex(DATE, "Pick a due date"),
  businessName: z.string().trim().min(1, "Business name is required").max(120),
  businessEmail: optionalEmail,
  businessAddress: z.string().max(500),
  customerName: z.string().trim().min(1, "Customer name is required").max(120),
  customerEmail: optionalEmail,
  customerAddress: z.string().max(500),
  notes: z.string().max(2000),
  customFields: z
    .array(
      z.object({
        label: z.string().trim().min(1, "Add a label").max(60),
        value: z.string().max(200),
        visible: z.boolean(),
      }),
    )
    .max(LIMITS.customFields),
};

export const invoiceInputSchema = z
  .object({
    ...baseFields,
    discountCents: z.int().min(0, "Discount can't be negative"),
    taxRateBps: z.int().min(0, "Tax can't be negative").max(LIMITS.taxRateBps),
    lineItems: z
      .array(
        z.object({
          description: z.string().trim().min(1, "Add a description").max(200),
          quantityHundredths: z.int().min(1, "Quantity must be more than 0").max(LIMITS.quantityHundredths),
          unitPriceCents: z.int().min(0, "Price can't be negative").max(LIMITS.unitPriceCents),
        }),
      )
      .min(1, "Add at least one line item")
      .max(LIMITS.lineItems),
  })
  .superRefine((invoice, ctx) => {
    if (invoice.dueDate < invoice.issueDate) {
      ctx.addIssue({ code: "custom", path: ["dueDate"], message: "Due date can't be before the issue date" });
    }
    const { subtotalCents } = calculateTotals(invoice);
    if (invoice.discountCents > subtotalCents) {
      ctx.addIssue({
        code: "custom",
        path: ["discountCents"],
        message: `Discount can't exceed the subtotal (${formatUSD(subtotalCents)})`,
      });
    }
  });

export type InvoiceInput = z.infer<typeof invoiceInputSchema>;

/* ------------------------------------------------------------------------ */
/* Email request                                                            */
/* ------------------------------------------------------------------------ */

export const emailRequestSchema = z.object({
  to: z.email("Enter a valid recipient email"),
  subject: z.string().trim().min(1, "Add a subject").max(200),
  message: z.string().max(1000, "Keep the message under 1000 characters"),
});

export type EmailRequest = z.infer<typeof emailRequestSchema>;
