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

      <main>
        <InvoiceTable invoices={invoices} />
      </main>
    </DashboardShell>
  );
}
