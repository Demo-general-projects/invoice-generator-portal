import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { InvoiceEditor, type EditorAction } from "@/components/invoice/invoice-editor";
import { inputToForm } from "@/lib/invoice-schema";
import { apiGet } from "@/lib/api-client";
import type { InvoiceResponse } from "@/lib/api-types";

const ACTIONS: EditorAction[] = ["print", "email"];

// Metadata and the page share one API request per render.
const getInvoice = cache(async (id: string) => (await apiGet<InvoiceResponse>(`/api/invoices/${encodeURIComponent(id)}`))?.invoice ?? null);

// The title is the file name Chrome suggests for "Save as PDF".
export async function generateMetadata({ params }: PageProps<"/invoices/[id]">): Promise<Metadata> {
  const invoice = await getInvoice((await params).id);
  return { title: invoice ? `${invoice.number} · ${invoice.businessName}` : "Invoice not found" };
}

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
