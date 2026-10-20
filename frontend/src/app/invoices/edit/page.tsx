import { Suspense } from "react";
import type { Metadata } from "next";
import { PageLoading } from "@/components/load-state";
import { EditInvoice } from "@/components/invoice/invoice-pages";

// EditInvoice sets the real title (the file name Chrome suggests for "Save as PDF") once the invoice loads.
export const metadata: Metadata = { title: "Invoice · Ledgerline" };

export default function EditInvoicePage() {
  // The id comes from the query string, which is only known in the browser.
  return (
    <Suspense fallback={<PageLoading label="Loading invoice…" />}>
      <EditInvoice />
    </Suspense>
  );
}
