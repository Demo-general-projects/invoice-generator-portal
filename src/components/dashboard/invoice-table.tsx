"use client";

import { useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, FileText, PencilLine, Search, X } from "lucide-react";
import { formatDate } from "@/lib/dates";
import type { InvoiceSummary } from "@/lib/invoices";
import { formatUSD } from "@/lib/money";
import { cn } from "@/lib/utils";

export function InvoiceTable({ invoices }: { invoices: InvoiceSummary[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      q
        ? invoices.filter((i) => i.number.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q))
        : invoices,
    [invoices, q],
  );

  // Whole rows are clickable for pointer users; keyboard users use the links.
  const openRow = (id: string) => (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest("a, button")) return;
    router.push(`/invoices/${id}`);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <label htmlFor="invoice-search" className="sr-only">
            Search invoices
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            id="invoice-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Invoice number or customer"
            autoComplete="off"
            className="h-11 w-full rounded-xl border border-input bg-white pr-10 pl-10 text-base shadow-[0_1px_2px_rgba(22,32,31,0.04)] placeholder:text-muted-foreground/80 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/12 focus-visible:outline-none sm:text-sm [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>
        <p role="status" className="text-sm text-muted-foreground">
          {q ? `${visible.length} of ${invoices.length} invoices` : `${invoices.length} ${invoices.length === 1 ? "invoice" : "invoices"}`}
        </p>
      </div>

      {invoices.length === 0 ? (
        <EmptyState title="No invoices yet" body="Create your first invoice and it will appear here." />
      ) : visible.length === 0 ? (
        <EmptyState
          title={`No invoices match “${query.trim()}”`}
          body="Try another invoice number or customer name."
          action={
            <button type="button" onClick={() => setQuery("")} className="mt-4 text-sm font-medium text-primary underline-offset-4 hover:underline">
              Clear search
            </button>
          }
        />
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div className="mt-5 hidden overflow-hidden rounded-2xl border border-border bg-white shadow-[0_1px_2px_rgba(22,32,31,0.04),0_8px_24px_-16px_rgba(22,32,31,0.12)] md:block">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">Saved invoices</caption>
              <thead>
                <tr className="border-b border-border bg-[#f8f8f5] text-[12px] font-medium text-muted-foreground">
                  <th scope="col" className="py-3.5 pr-4 pl-6 font-medium">Invoice number</th>
                  <th scope="col" className="py-3.5 pr-4 font-medium">Customer</th>
                  <th scope="col" className="py-3.5 pr-6 text-right font-medium">Amount</th>
                  <th scope="col" className="py-3.5 pr-4 font-medium">Status</th>
                  <th scope="col" className="py-3.5 pr-4 font-medium">Due date</th>
                  <th scope="col" className="py-3.5 pr-6 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((invoice) => (
                  <tr
                    key={invoice.id}
                    onClick={openRow(invoice.id)}
                    className="group cursor-pointer transition-colors hover:bg-[#fafaf7]"
                  >
                    <td className="py-4 pr-4 pl-6">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="rounded font-semibold tracking-tight text-foreground tabular-nums group-hover:text-primary"
                      >
                        {invoice.number}
                      </Link>
                    </td>
                    <td className="max-w-64 py-4 pr-4">
                      <p className="truncate font-medium">{invoice.customerName}</p>
                      {invoice.customerEmail && <p className="truncate text-[13px] text-muted-foreground">{invoice.customerEmail}</p>}
                    </td>
                    <td className="py-4 pr-6 text-right font-semibold tabular-nums">{formatUSD(invoice.totalCents)}</td>
                    <td className="py-4 pr-4">
                      <StatusBadge sentAt={invoice.lastSentAt} />
                    </td>
                    <td className="py-4 pr-4 text-muted-foreground tabular-nums">{formatDate(invoice.dueDate)}</td>
                    <td className="py-4 pr-6 text-right">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        aria-label={`Edit ${invoice.number}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-[13px] font-medium text-foreground/80 shadow-[0_1px_1px_rgba(22,32,31,0.04)] transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        <PencilLine className="size-3.5" aria-hidden /> Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="mt-4 flex flex-col gap-3 md:hidden">
            {visible.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="block rounded-2xl border border-border bg-white p-4 shadow-[0_1px_2px_rgba(22,32,31,0.04)] active:bg-[#fafaf7]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold tracking-tight tabular-nums">{invoice.number}</span>
                    <StatusBadge sentAt={invoice.lastSentAt} />
                  </div>
                  <p className="mt-2 truncate font-medium">{invoice.customerName}</p>
                  <div className="mt-3 flex items-end justify-between gap-3 border-t border-border pt-3">
                    <span className="text-[13px] text-muted-foreground">Due {formatDate(invoice.dueDate)}</span>
                    <span className="flex items-center gap-1 text-lg font-semibold tracking-tight tabular-nums">
                      {formatUSD(invoice.totalCents)}
                      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function StatusBadge({ sentAt }: { sentAt: Date | null }) {
  const sent = sentAt !== null;
  return (
    <span
      // UTC calendar date keeps server and client render identical.
      title={sent ? `Emailed on ${formatDate(new Date(sentAt).toISOString().slice(0, 10))}` : "Saved, not yet emailed"}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.06em] uppercase",
        sent ? "bg-accent text-primary" : "bg-[#f7efe1] text-[#7a4f0f]",
      )}
    >
      {sent ? <Check className="size-3" aria-hidden /> : <PencilLine className="size-3" aria-hidden />}
      {sent ? "Sent" : "Draft"}
    </span>
  );
}

function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-input bg-[#fbfbf9] px-6 py-16 text-center">
      <FileText className="mx-auto size-8 text-primary" aria-hidden />
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      {action}
    </div>
  );
}
