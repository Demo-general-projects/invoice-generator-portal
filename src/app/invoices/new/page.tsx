import type { Metadata } from "next";
import { connection } from "next/server";
import { InvoiceEditor } from "@/components/invoice/invoice-editor";
import { todayISO } from "@/lib/dates";
import { latestBusinessDetails, suggestInvoiceNumber } from "@/lib/invoices";

export const metadata: Metadata = { title: "New invoice · Ledgerline" };

export default async function NewInvoicePage() {
  await connection(); // invoice number and dates depend on the current data and day
  const [number, business] = await Promise.all([suggestInvoiceNumber(), latestBusinessDetails()]);
  return (
    <InvoiceEditor
      initialValues={{
        number,
        issueDate: todayISO(),
        dueDate: todayISO(30),
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
