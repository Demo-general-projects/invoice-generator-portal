import Link from "next/link";
import { connection } from "next/server";
import { FileText, Plus } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { formatDate } from "@/lib/dates";
import { listInvoices } from "@/lib/invoices";
import { formatUSD } from "@/lib/money";

export default async function InvoicesPage() {
  await connection();
  const invoices = await listInvoices();
  return (
    <div className="min-h-dvh">
      <AppHeader crumbs={[{ label: "Invoices" }]}>
        <Link
          href="/invoices/new"
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-sm hover:bg-primary/90"
        >
          <Plus className="size-4" aria-hidden /> New invoice
        </Link>
      </AppHeader>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Invoices</h1>
        <p className="mt-1 text-sm text-muted-foreground">Saved invoices, most recently updated first.</p>

        {invoices.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-input bg-white px-6 py-14 text-center">
            <FileText className="mx-auto size-8 text-primary" aria-hidden />
            <p className="mt-3 font-medium">No invoices yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Create your first invoice to see it here.</p>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(22,32,31,0.04)]">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-4 transition-colors hover:bg-muted/60 focus-visible:-outline-offset-2 sm:grid-cols-[8rem_minmax(0,1fr)_8rem_7rem_8rem]"
                >
                  <span className="font-medium tabular-nums">{invoice.number}</span>
                  <span className="truncate text-sm text-muted-foreground sm:text-foreground">{invoice.customerName}</span>
                  <span className="text-sm text-muted-foreground">Due {formatDate(invoice.dueDate)}</span>
                  <span className="text-xs">
                    {invoice.lastSentAt ? (
                      <span className="rounded-full bg-accent px-2.5 py-1 font-medium text-primary">Sent</span>
                    ) : (
                      <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">Draft</span>
                    )}
                  </span>
                  <span className="text-right font-semibold tabular-nums sm:col-auto">{formatUSD(invoice.totalCents)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
