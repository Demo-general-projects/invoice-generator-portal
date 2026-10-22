"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { InvoiceNotFound, PageError, PageLoading } from "@/components/load-state";
import { useApiGet } from "@/lib/api-client";
import type { InvoiceDefaults, InvoiceResponse } from "@/lib/api-types";
import { inputToForm } from "@/lib/invoice-schema";
import { formatDecimal } from "@/lib/money";
import { InvoiceEditor, type EditorAction } from "./invoice-editor";

const ACTIONS: EditorAction[] = ["print", "email"];

/** New invoice, prefilled with the suggested number, dates and the last sender details. */
export function NewInvoice() {
  const [result, retry] = useApiGet<InvoiceDefaults>("/api/invoices/defaults");
  if (result.status === "loading") return <PageLoading label="Preparing a new invoice…" />;
  if (result.status !== "ready") {
    return <PageError message={result.status === "error" ? result.message : "The invoices API was not found."} onRetry={retry} />;
  }

  const { number, issueDate, dueDate, business, template, taxRateBps, notes } = result.data;
  return (
    <InvoiceEditor
      initialValues={{
        number,
        issueDate,
        dueDate,
        businessName: business?.businessName ?? "",
        businessEmail: business?.businessEmail ?? "",
        businessPhone: business?.businessPhone ?? "",
        template: template ?? "classic",
        businessAddress: business?.businessAddress ?? "",
        customerName: "",
        customerEmail: "",
        customerAddress: "",
        notes: notes ?? "",
        discount: "",
        taxRate: taxRateBps ? formatDecimal(taxRateBps, 2) : "",
        lineItems: [{ description: "", quantity: "1", unitPrice: "" }],
        customFields: [],
      }}
    />
  );
}

/** Saved invoice from /invoices/edit/?id=…, optionally with ?action=print|email from the dashboard menu. */
export function EditInvoice() {
  const params = useSearchParams();
  const id = params.get("id");
  const action = ACTIONS.find((a) => a === params.get("action"));
  const [result, retry] = useApiGet<InvoiceResponse>(id ? `/api/invoices/${encodeURIComponent(id)}` : null);
  const invoice = result.status === "ready" ? result.data.invoice : null;

  // The title is the file name Chrome suggests for "Save as PDF".
  useEffect(() => {
    if (invoice) document.title = `${invoice.number} · ${invoice.businessName}`;
  }, [invoice]);

  if (!id || result.status === "not-found") return <InvoiceNotFound />;
  if (result.status === "loading") return <PageLoading label="Loading invoice…" />;
  if (result.status === "error") return <PageError message={result.message} onRetry={retry} />;

  return <InvoiceEditor key={result.data.invoice.id} invoiceId={result.data.invoice.id} initialValues={inputToForm(result.data.invoice)} initialAction={action} />;
}
