import { notFound } from "next/navigation";
import { InvoiceEditor } from "@/components/invoice/invoice-editor";
import { inputToForm } from "@/lib/invoice-schema";
import { getInvoice } from "@/lib/invoices";

export default async function InvoicePage({ params }: PageProps<"/invoices/[id]">) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();
  return <InvoiceEditor key={invoice.id} invoiceId={invoice.id} initialValues={inputToForm(invoice)} />;
}
