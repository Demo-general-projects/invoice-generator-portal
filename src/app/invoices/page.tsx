import Link from "next/link";
import { connection } from "next/server";
import { Plus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { InvoiceTable } from "@/components/dashboard/invoice-table";
import { listInvoices } from "@/lib/invoices";

export default async function InvoicesPage() {
  await connection();
  const invoices = await listInvoices();
  return (
    <DashboardShell invoiceCount={invoices.length}>
      {/* Desktop page header */}
      <div className="hidden h-16 items-center border-b border-border px-8 lg:flex">
        <p className="text-sm text-muted-foreground">
          Workspace <span aria-hidden className="mx-1.5">/</span>
          <span className="font-medium text-foreground">Invoices</span>
        </p>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight sm:text-[30px]">Invoices</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every saved invoice, most recently updated first. Open one to edit, print or email it.
            </p>
          </div>
          <Link
            href="/invoices/new"
            className="hidden h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(22,32,31,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] transition-colors hover:bg-primary/90 lg:inline-flex"
          >
            <Plus className="size-4" aria-hidden /> Create invoice
          </Link>
        </div>

        <div className="mt-7">
          <InvoiceTable invoices={invoices} />
        </div>
      </main>
    </DashboardShell>
  );
}
