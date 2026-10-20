import { z } from "zod";
import { formatUSD, parseDecimal } from "./money";
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
/* Form shape: numbers stay as the strings the user typed.                  */
/* ------------------------------------------------------------------------ */

type DecimalRule = { label: string; scale: number; max: number; required: boolean; min?: number };

function describeDecimalError(raw: string, rule: DecimalRule): string | null {
  const value = raw.trim();
  if (value === "") return rule.required ? `${rule.label} is required` : null;
  if (value.startsWith("-")) return `${rule.label} can't be negative`;
  const parsed = parseDecimal(value, rule.scale);
  if (parsed === null) {
    return rule.scale === 2 ? `Use a number with up to 2 decimals` : `Enter a valid number`;
  }
  if (rule.min !== undefined && parsed < rule.min) return `${rule.label} must be more than 0`;
  if (parsed > rule.max) return `${rule.label} is too large`;
  return null;
}

const decimalString = (rule: DecimalRule) =>
  z.string().superRefine((value, ctx) => {
    const message = describeDecimalError(value, rule);
    if (message) ctx.addIssue({ code: "custom", message });
  });

const RULES = {
  quantity: { label: "Quantity", scale: 2, max: LIMITS.quantityHundredths, required: true, min: 1 },
  unitPrice: { label: "Price", scale: 2, max: LIMITS.unitPriceCents, required: true },
  discount: { label: "Discount", scale: 2, max: LIMITS.unitPriceCents * LIMITS.lineItems, required: false },
  taxRate: { label: "Tax rate", scale: 2, max: LIMITS.taxRateBps, required: false },
} satisfies Record<string, DecimalRule>;

/** Lenient parse used for live previews: invalid or empty input becomes null. */
export const parseField = (value: string, rule: keyof typeof RULES) =>
  describeDecimalError(value, RULES[rule]) ? null : (parseDecimal(value, 2) ?? 0);

export const invoiceFormSchema = z
  .object({
    ...baseFields,
    discount: decimalString(RULES.discount),
    taxRate: decimalString(RULES.taxRate),
    lineItems: z
      .array(
        z.object({
          description: z.string().trim().min(1, "Add a description").max(200),
          quantity: decimalString(RULES.quantity),
          unitPrice: decimalString(RULES.unitPrice),
        }),
      )
      .min(1, "Add at least one line item")
      .max(LIMITS.lineItems),
  })
  .superRefine((form, ctx) => {
    if (DATE.test(form.issueDate) && DATE.test(form.dueDate) && form.dueDate < form.issueDate) {
      ctx.addIssue({ code: "custom", path: ["dueDate"], message: "Due date can't be before the issue date" });
    }
    const discount = parseField(form.discount, "discount");
    const lines = form.lineItems.map((line) => ({
      quantityHundredths: parseField(line.quantity, "quantity"),
      unitPriceCents: parseField(line.unitPrice, "unitPrice"),
    }));
    if (discount === null || lines.some((l) => l.quantityHundredths === null || l.unitPriceCents === null)) return;
    const { subtotalCents } = calculateTotals({
      lineItems: lines as { quantityHundredths: number; unitPriceCents: number }[],
      discountCents: 0,
      taxRateBps: 0,
    });
    if (discount > subtotalCents) {
      ctx.addIssue({
        code: "custom",
        path: ["discount"],
        message: `Discount can't exceed the subtotal (${formatUSD(subtotalCents)})`,
      });
    }
  });

export type InvoiceFormValues = z.input<typeof invoiceFormSchema>;

/** Converts validated form values into the integer API shape. */
export function formToInput(form: InvoiceFormValues): InvoiceInput {
  const { discount, taxRate, lineItems, ...rest } = form;
  return {
    ...rest,
    discountCents: parseField(discount, "discount") ?? 0,
    taxRateBps: parseField(taxRate, "taxRate") ?? 0,
    lineItems: lineItems.map((line) => ({
      description: line.description.trim(),
      quantityHundredths: parseField(line.quantity, "quantity") ?? 0,
      unitPriceCents: parseField(line.unitPrice, "unitPrice") ?? 0,
    })),
  };
}
