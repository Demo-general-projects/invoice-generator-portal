import type { Metadata } from "next";
import { InvoiceEditor } from "@/components/invoice/invoice-editor";
import { apiGet } from "@/lib/api-client";
import type { InvoiceDefaults } from "@/lib/api-types";

export const metadata: Metadata = { title: "New invoice · Ledgerline" };

export default async function NewInvoicePage() {
  // Suggested number, dates and sender details come from the API on every request.
  const defaults = await apiGet<InvoiceDefaults>("/api/invoices/defaults");
  if (!defaults) throw new Error("The API did not return invoice defaults.");
  const { number, issueDate, dueDate, business } = defaults;
  return (
    <InvoiceEditor
      initialValues={{
        number,
        issueDate,
        dueDate,
        businessName: business?.businessName ?? "",
        businessEmail: business?.businessEmail ?? "",
        businessAddress: business?.businessAddress ?? "",
        customerName: "",
        customerEmail: "",
        customerAddress: "",
        notes: "",
        discount: "",
        taxRate: "",
        lineItems: [{ description: "", quantity: "1", unitPrice: "" }],
        customFields: [],
      }}
    />
  );
}
