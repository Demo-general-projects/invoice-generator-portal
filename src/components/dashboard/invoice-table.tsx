"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, FileText, PencilLine, Search, X } from "lucide-react";
import { formatDate } from "@/lib/dates";
import type { InvoiceSummary } from "@/lib/invoices";
import { formatUSD } from "@/lib/money";
import { cn } from "@/lib/utils";

const PAD = "px-4 sm:px-6 lg:px-8";

export function InvoiceTable({ invoices }: { invoices: InvoiceSummary[] }) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      q
        ? invoices.filter((i) => i.number.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q))
        : invoices,
    [invoices, q],
  );

  // "/" focuses search, as hinted inside the field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key !== "/" || target.closest("input, textarea, [contenteditable=true]")) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Whole rows are clickable for pointer users; keyboard users use the links.
  const openRow = (id: string) => (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest("a, button")) return;
    router.push(`/invoices/${id}`);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className={cn("flex flex-col gap-3 border-b border-border py-4 sm:flex-row sm:items-center sm:justify-between lg:py-5", PAD)}>
        <div className="flex items-center gap-2.5">
          <h2 className="text-[15px] font-medium">All invoices</h2>
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
            {invoices.length}
          </span>
        </div>
        <div className="relative w-full sm:w-80">
          <label htmlFor="invoice-search" className="sr-only">
            Search invoices by number or customer
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            ref={searchRef}
            id="invoice-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            autoComplete="off"
            aria-keyshortcuts="/"
            className="h-11 w-full rounded-xl border border-border bg-white pr-12 pl-11 text-base shadow-[0_1px_2px_rgba(16,24,40,0.04)] placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/12 focus-visible:outline-none sm:text-[15px] [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : (
            <kbd
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 font-sans text-xs font-medium text-muted-foreground sm:block"
            >
              /
            </kbd>
          )}
        </div>
      </div>

      <div className={cn("py-6", PAD)}>
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
            <div className="hidden overflow-hidden rounded-2xl border border-border bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:block">
              <table className="w-full border-collapse text-left text-[15px]">
                <caption className="sr-only">Saved invoices</caption>
                <thead>
                  <tr className="bg-[#f8f9fb] text-[14px] text-muted-foreground">
                    <th scope="col" className="h-14 pr-4 pl-6 font-normal">Invoice number</th>
                    <th scope="col" className="h-14 pr-4 font-normal">Customer</th>
                    <th scope="col" className="h-14 pr-4 font-normal">Amount</th>
                    <th scope="col" className="h-14 pr-4 font-normal">Status</th>
                    <th scope="col" className="hidden h-14 pr-4 font-normal xl:table-cell">Items</th>
                    <th scope="col" className="h-14 pr-4 font-normal">Due date</th>
                    <th scope="col" className="h-14 w-16 pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((invoice) => (
                    <tr
                      key={invoice.id}
                      onClick={openRow(invoice.id)}
                      className="group cursor-pointer border-t border-border transition-colors hover:bg-[#f6f8fb]"
                    >
                      <td className="h-[4.25rem] pr-4 pl-6">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="rounded font-medium text-foreground tabular-nums decoration-primary/40 underline-offset-4 group-hover:text-primary hover:underline"
                        >
                          {invoice.number}
                        </Link>
                      </td>
                      <td className="max-w-60 truncate pr-4 text-foreground">{invoice.customerName}</td>
                      <td className="pr-4 font-medium tabular-nums">{formatUSD(invoice.totalCents)}</td>
                      <td className="pr-4">
                        <StatusBadge sentAt={invoice.lastSentAt} />
                      </td>
                      <td className="hidden pr-4 text-foreground xl:table-cell">
                        {invoice.itemCount} {invoice.itemCount === 1 ? "item" : "items"}
                      </td>
                      <td className="pr-4 text-muted-foreground tabular-nums">{formatDate(invoice.dueDate)}</td>
                      <td className="pr-6 text-right">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          aria-label={`Edit ${invoice.number}`}
                          title="Edit invoice"
                          className="inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-all group-hover:bg-white group-hover:text-foreground group-hover:shadow-[0_1px_3px_rgba(16,24,40,0.12)] hover:text-primary"
                        >
                          <PencilLine className="size-[18px]" aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="flex flex-col gap-3 md:hidden">
              {visible.map((invoice) => (
                <li key={invoice.id}>
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="block rounded-2xl border border-border bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] active:bg-[#f6f8fb]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium tabular-nums">{invoice.number}</span>
                      <StatusBadge sentAt={invoice.lastSentAt} />
                    </div>
                    <p className="mt-1.5 truncate text-[15px] text-foreground/80">{invoice.customerName}</p>
                    <div className="mt-3 flex items-end justify-between gap-3 border-t border-border pt-3">
                      <span className="text-[13px] text-muted-foreground">
                        Due {formatDate(invoice.dueDate)} · {invoice.itemCount} {invoice.itemCount === 1 ? "item" : "items"}
                      </span>
                      <span className="flex items-center gap-1 text-lg font-semibold tracking-tight tabular-nums">
                        {formatUSD(invoice.totalCents)}
                        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <p role="status" className="mt-5 text-[15px] text-muted-foreground">
              {q
                ? `Showing ${visible.length} of ${invoices.length} invoices matching “${query.trim()}”`
                : `Showing 1–${visible.length} of ${visible.length} ${visible.length === 1 ? "result" : "results"}`}
            </p>
          </>
        )}
      </div>
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
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium tracking-[0.02em] uppercase",
        sent ? "bg-[#e7f3ef] text-[#17604f]" : "bg-[#fdf3e3] text-[#94540a]",
      )}
    >
      {sent ? <Check className="size-3.5" aria-hidden /> : <PencilLine className="size-3.5" aria-hidden />}
      {sent ? "Sent" : "Draft"}
    </span>
  );
}

function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-input bg-[#fafbfc] px-6 py-16 text-center">
      <FileText className="mx-auto size-8 text-primary" aria-hidden />
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      {action}
    </div>
  );
}
