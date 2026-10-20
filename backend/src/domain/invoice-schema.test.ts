import { describe, expect, it } from "vitest";
import { invoiceInputSchema, type InvoiceInput } from "./invoice-schema";
import { calculateTotals } from "./totals";

const valid: InvoiceInput = {
  number: "INV-0001",
  issueDate: "2026-10-20",
  dueDate: "2026-11-19",
  businessName: "Acme Studio",
  businessEmail: "hello@acme.test",
  businessAddress: "",
  customerName: "Bright Solutions",
  customerEmail: "",
  customerAddress: "",
  notes: "",
  discountCents: 1000,
  taxRateBps: 1000,
  lineItems: [{ description: "Design", quantityHundredths: 200, unitPriceCents: 5000 }],
  customFields: [{ label: "Fee", value: "$500", visible: false }],
};

describe("invoiceInputSchema", () => {
  it("accepts the brief's example and totals $99.00; custom fields don't count", () => {
    expect(invoiceInputSchema.safeParse(valid).success).toBe(true);
    expect(calculateTotals(valid).totalCents).toBe(9900);
  });

  it("rejects negative values, fractional cents and a discount above the subtotal", () => {
    expect(invoiceInputSchema.safeParse({ ...valid, taxRateBps: -1 }).success).toBe(false);
    expect(invoiceInputSchema.safeParse({ ...valid, discountCents: 1.5 }).success).toBe(false);
    expect(invoiceInputSchema.safeParse({ ...valid, discountCents: 10001 }).success).toBe(false);
    expect(
      invoiceInputSchema.safeParse({ ...valid, lineItems: [{ description: "x", quantityHundredths: -100, unitPriceCents: 5000 }] }).success,
    ).toBe(false);
  });

  it("rejects a due date before the issue date", () => {
    expect(invoiceInputSchema.safeParse({ ...valid, dueDate: "2026-10-01" }).success).toBe(false);
  });
});
