import { describe, expect, it } from "vitest";
import { formToInput, invoiceFormSchema, invoiceInputSchema, type InvoiceFormValues } from "./invoice-schema";
import { calculateTotals } from "./totals";

const validForm: InvoiceFormValues = {
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
  discount: "10",
  taxRate: "10",
  lineItems: [{ description: "Design", quantity: "2", unitPrice: "50" }],
  customFields: [{ label: "PO", value: "12345", visible: true }],
};

const errorsFor = (form: InvoiceFormValues) => {
  const result = invoiceFormSchema.safeParse(form);
  return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
};

describe("invoiceFormSchema", () => {
  it("accepts a valid invoice and converts it to integers", () => {
    expect(errorsFor(validForm)).toEqual({});
    const input = formToInput(validForm);
    expect(input).toMatchObject({
      discountCents: 1000,
      taxRateBps: 1000,
      lineItems: [{ quantityHundredths: 200, unitPriceCents: 5000 }],
    });
    expect(calculateTotals(input).totalCents).toBe(9900);
  });

  it("rejects negative quantity, price, discount and tax", () => {
    const errors = errorsFor({
      ...validForm,
      discount: "-1",
      taxRate: "-5",
      lineItems: [{ description: "Design", quantity: "-2", unitPrice: "-50" }],
    });
    expect(errors["lineItems.0.quantity"]).toMatch(/negative/);
    expect(errors["lineItems.0.unitPrice"]).toMatch(/negative/);
    expect(errors["discount"]).toMatch(/negative/);
    expect(errors["taxRate"]).toMatch(/negative/);
  });

  it("rejects a discount larger than the subtotal, even when other fields are invalid", () => {
    const errors = errorsFor({ ...validForm, customerName: "", discount: "100.01" });
    expect(errors["discount"]).toBe("Discount can't exceed the subtotal ($100.00)");
  });

  it("rejects a due date before the issue date", () => {
    expect(errorsFor({ ...validForm, dueDate: "2026-10-01" })["dueDate"]).toMatch(/before/);
  });

  it("ignores custom fields in totals", () => {
    const withHidden = formToInput({
      ...validForm,
      customFields: [{ label: "Fee", value: "$500", visible: false }],
    });
    expect(calculateTotals(withHidden).totalCents).toBe(9900);
  });
});

describe("invoiceInputSchema (server)", () => {
  it("re-validates integer input independently of the client", () => {
    const input = formToInput(validForm);
    expect(invoiceInputSchema.safeParse(input).success).toBe(true);
    expect(invoiceInputSchema.safeParse({ ...input, discountCents: 10001 }).success).toBe(false);
    expect(invoiceInputSchema.safeParse({ ...input, taxRateBps: -1 }).success).toBe(false);
    expect(invoiceInputSchema.safeParse({ ...input, discountCents: 1.5 }).success).toBe(false);
  });
});
