"use client";

import Link from "next/link";
import { Loader2, Plus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { InvoiceTable } from "@/components/dashboard/invoice-table";
import { PageError } from "@/components/load-state";
import { useApiGet } from "@/lib/api-client";
import type { InvoiceSummary } from "@/lib/api-types";

export function InvoicesDashboard() {
  const [result, retry] = useApiGet<{ invoices: InvoiceSummary[] }>("/api/invoices");
  if (result.status === "error" || result.status === "not-found") {
    return <PageError message={result.status === "error" ? result.message : "The invoices API was not found."} onRetry={retry} />;
  }
  const invoices = result.status === "ready" ? result.data.invoices : null;

  return (
    <DashboardShell invoiceCount={invoices?.length ?? 0}>
      {/* On mobile the top bar already carries the brand and action, so this bar is for screen readers only. */}
      <div className="flex h-[4.5rem] items-center justify-between gap-4 border-b border-border px-4 max-lg:sr-only sm:px-6 lg:px-8">
        <h1 className="text-[17px] font-medium tracking-[-0.01em]">Invoices</h1>
        <Link
          href="/invoices/new"
          className="hidden h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[15px] font-medium text-white shadow-[0_1px_2px_rgba(16,24,40,0.12),inset_0_1px_0_rgba(255,255,255,0.12)] transition-colors hover:bg-primary/90 lg:inline-flex"
        >
          <Plus className="size-[18px]" aria-hidden /> Create invoice
        </Link>
      </div>

      <main aria-busy={!invoices}>
        {invoices ? (
          <InvoiceTable invoices={invoices} />
        ) : (
          <p role="status" className="flex items-center justify-center gap-2.5 py-24 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" aria-hidden /> Loading invoices…
          </p>
        )}
      </main>
    </DashboardShell>
  );
}
