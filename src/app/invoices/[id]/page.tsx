import { notFound } from "next/navigation";
import { InvoiceEditor, type EditorAction } from "@/components/invoice/invoice-editor";
import { inputToForm } from "@/lib/invoice-schema";
import { getInvoice } from "@/lib/invoices";

const ACTIONS: EditorAction[] = ["print", "email"];

export default async function InvoicePage({ params, searchParams }: PageProps<"/invoices/[id]">) {
  const [{ id }, { action }] = await Promise.all([params, searchParams]);
  const invoice = await getInvoice(id);
  if (!invoice) notFound();
  const initialAction = ACTIONS.find((a) => a === action);
  return (
    <InvoiceEditor
      key={invoice.id}
      invoiceId={invoice.id}
      initialValues={inputToForm(invoice)}
      initialAction={initialAction}
    />
  );
}
