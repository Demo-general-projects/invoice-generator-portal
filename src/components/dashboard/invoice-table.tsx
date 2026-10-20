"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  FileText,
  ListFilter,
  Mail,
  MoreHorizontal,
  PencilLine,
  Printer,
  Search,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/dates";
import type { InvoiceSummary } from "@/lib/invoices";
import { formatUSD } from "@/lib/money";
import { cn } from "@/lib/utils";

const PAD = "px-4 sm:px-6 lg:px-8";
const PAGE_SIZES = [10, 25, 50];

type StatusFilter = "all" | "draft" | "sent";
type SortKey = "number" | "customerName" | "totalCents" | "status" | "itemCount" | "dueDate";
type Sort = { key: SortKey; dir: "asc" | "desc" } | null;

const isSent = (invoice: InvoiceSummary) => invoice.lastSentAt !== null;

function compare(a: InvoiceSummary, b: InvoiceSummary, key: SortKey): number {
  switch (key) {
    case "totalCents":
    case "itemCount":
      return a[key] - b[key];
    case "status":
      return Number(isSent(a)) - Number(isSent(b));
    default:
      return a[key].localeCompare(b[key], "en", { numeric: true, sensitivity: "base" });
  }
}

export function InvoiceTable({ invoices }: { invoices: InvoiceSummary[] }) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<Sort>(null); // null = most recently updated first
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [page, setPage] = useState(0);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    const rows = invoices.filter(
      (i) =>
        (status === "all" || (status === "sent") === isSent(i)) &&
        (!q || i.number.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q)),
    );
    if (sort) rows.sort((a, b) => compare(a, b, sort.key) * (sort.dir === "asc" ? 1 : -1));
    return rows;
  }, [invoices, status, q, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const start = currentPage * pageSize;
  const visible = filtered.slice(start, start + pageSize);
  const counts = { all: invoices.length, draft: invoices.filter((i) => !isSent(i)).length, sent: invoices.filter(isSent).length };

  // Any change to what is listed starts again from the first page.
  const update = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(0);
  };

  const toggleSort = (key: SortKey) =>
    update(setSort)(sort?.key !== key ? { key, dir: "asc" } : sort.dir === "asc" ? { key, dir: "desc" } : null);

  // "/" focuses search, as hinted inside the field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof Element && e.target.closest("input, textarea, select, [contenteditable=true]");
      if (e.key !== "/" || typing) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Whole rows are clickable for pointer users; keyboard users use the links and menu.
  const openRow = (id: string) => (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest("a, button, [role=menu]")) return;
    router.push(`/invoices/${id}`);
  };

  const sortHeader = (key: SortKey, label: string, className?: string) => (
    <th scope="col" aria-sort={sort?.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className={cn("h-12 pr-3 font-normal", className)}>
      <button
        type="button"
        onClick={() => toggleSort(key)}
        className="flex w-full items-center justify-between gap-2 rounded-md py-1 text-left hover:text-foreground"
      >
        {label}
        {sort?.key === key ? (
          sort.dir === "asc" ? <ArrowUp className="size-3.5 text-foreground" aria-hidden /> : <ArrowDown className="size-3.5 text-foreground" aria-hidden />
        ) : (
          <ChevronsUpDown className="size-3.5" aria-hidden />
        )}
      </button>
    </th>
  );

  return (
    <div>
      {/* Toolbar */}
      <div className={cn("flex flex-col gap-3 border-b border-border py-4 sm:flex-row sm:items-center sm:justify-between", PAD)}>
        <div role="group" aria-label="Filter by status" className="inline-flex w-fit items-stretch overflow-hidden rounded-xl border border-border bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <span className="hidden items-center gap-2 border-r border-border px-3.5 text-[14px] font-medium text-foreground sm:flex">
            <ListFilter className="size-4" aria-hidden /> Status
          </span>
          {(["all", "draft", "sent"] as const).map((value, i) => (
            <button
              key={value}
              type="button"
              aria-pressed={status === value}
              onClick={() => update(setStatus)(value)}
              className={cn(
                "flex h-10 items-center gap-2 px-3.5 text-[14px] font-medium capitalize transition-colors",
                i > 0 && "border-l border-border",
                status === value ? "bg-[#f3f6f9] text-foreground" : "text-muted-foreground hover:bg-[#f8f9fb] hover:text-foreground",
              )}
            >
              {value}
              <span className={cn("rounded-md px-1.5 text-xs tabular-nums", status === value ? "bg-white text-foreground shadow-[0_0_0_1px_var(--border)]" : "bg-muted")}>
                {counts[value]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <label htmlFor="invoice-search" className="sr-only">
            Search invoices by number or customer
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            ref={searchRef}
            id="invoice-search"
            type="search"
            value={query}
            onChange={(e) => update(setQuery)(e.target.value)}
            placeholder="Search"
            autoComplete="off"
            aria-keyshortcuts="/"
            className="h-10 w-full rounded-xl border border-border bg-white pr-12 pl-10 text-base shadow-[0_1px_2px_rgba(16,24,40,0.04)] placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/12 focus-visible:outline-none sm:text-[14px] [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => update(setQuery)("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : (
            <kbd aria-hidden className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded-md border border-border bg-white px-1.5 font-sans text-xs font-medium text-muted-foreground shadow-[0_1px_0_var(--border)] sm:block">
              /
            </kbd>
          )}
        </div>
      </div>

      <div className={cn("py-5", PAD)}>
        {invoices.length === 0 ? (
          <EmptyState title="No invoices yet" body="Create your first invoice and it will appear here." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No invoices match"
            body="Try another invoice number, customer name or status."
            action={
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  update(setStatus)("all");
                }}
                className="mt-4 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <>
            {/* Desktop / tablet table */}
            <div className="hidden overflow-hidden rounded-2xl border border-border bg-[#f8f9fb] md:block">
              <table className="w-full border-collapse text-left text-[14.5px]">
                <caption className="sr-only">Saved invoices. Column headers sort the list.</caption>
                <thead>
                  <tr className="text-[14px] text-muted-foreground">
                    {sortHeader("number", "Invoice number", "pl-6")}
                    {sortHeader("customerName", "Customer")}
                    {sortHeader("totalCents", "Amount")}
                    {sortHeader("status", "Status")}
                    {sortHeader("itemCount", "Items", "hidden xl:table-cell")}
                    {sortHeader("dueDate", "Due date")}
                    <th scope="col" className="h-12 w-16 pr-5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {visible.map((invoice) => (
                    <tr
                      key={invoice.id}
                      onClick={openRow(invoice.id)}
                      className="group cursor-pointer border-t border-border transition-colors hover:bg-[#f5f7fb] has-[[data-popup-open]]:bg-[#f5f7fb]"
                    >
                      <td className="h-[3.75rem] pr-3 pl-6">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="rounded font-medium text-foreground tabular-nums underline-offset-4 hover:text-primary hover:underline"
                        >
                          {invoice.number}
                        </Link>
                      </td>
                      <td className="max-w-56 truncate pr-3 font-medium text-foreground">{invoice.customerName}</td>
                      <td className="pr-3 font-medium text-foreground tabular-nums">{formatUSD(invoice.totalCents)}</td>
                      <td className="pr-3">
                        <StatusBadge sentAt={invoice.lastSentAt} />
                      </td>
                      <td className="hidden pr-3 font-medium text-foreground xl:table-cell">
                        {invoice.itemCount} {invoice.itemCount === 1 ? "item" : "items"}
                      </td>
                      <td className="pr-3 text-muted-foreground tabular-nums">{formatDate(invoice.dueDate)}</td>
                      <td className="pr-5 text-right">
                        <RowActions invoice={invoice} />
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
                    className="block rounded-2xl border border-border bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] active:bg-[#f5f7fb]"
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

            {/* Footer: summary + pagination */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p role="status" className="text-[14px] text-muted-foreground">
                Showing {start + 1}–{start + visible.length} of {filtered.length} {filtered.length === 1 ? "result" : "results"}
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor="page-size" className="mr-1 hidden text-[14px] font-medium text-foreground sm:block">
                  Rows per page
                </label>
                <div className="relative">
                  <select
                    id="page-size"
                    value={pageSize}
                    onChange={(e) => update(setPageSize)(Number(e.target.value))}
                    aria-label="Rows per page"
                    className="h-10 appearance-none rounded-xl border border-border bg-white pr-9 pl-3.5 text-[14px] font-medium shadow-[0_1px_2px_rgba(16,24,40,0.04)] focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/12 focus-visible:outline-none"
                  >
                    {PAGE_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                </div>
                <PagerButton disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
                  <ArrowLeft className="size-4" aria-hidden /> Previous
                </PagerButton>
                <PagerButton disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)}>
                  Next <ArrowRight className="size-4" aria-hidden />
                </PagerButton>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RowActions({ invoice }: { invoice: InvoiceSummary }) {
  const router = useRouter();
  const go = (suffix = "") => router.push(`/invoices/${invoice.id}${suffix}`);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${invoice.number}`}
        className="inline-flex size-10 items-center justify-center rounded-xl text-foreground/70 transition-all hover:bg-white hover:text-foreground hover:shadow-[0_0_0_1px_var(--border),0_2px_4px_rgba(16,24,40,0.08)] focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none data-[popup-open]:bg-white data-[popup-open]:shadow-[0_0_0_1px_var(--border),0_2px_4px_rgba(16,24,40,0.08)] group-hover:bg-white group-hover:shadow-[0_0_0_1px_var(--border),0_2px_4px_rgba(16,24,40,0.08)]"
      >
        <MoreHorizontal className="size-5" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem onClick={() => go()}>
          <PencilLine aria-hidden /> Edit invoice
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => go("?action=print")}>
          <Printer aria-hidden /> Print / Save PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => go("?action=email")}>
          <Mail aria-hidden /> Send by email
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PagerButton({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 text-[14px] font-medium text-foreground shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors hover:bg-[#f8f9fb] disabled:cursor-not-allowed disabled:text-muted-foreground/70 disabled:shadow-none disabled:hover:bg-white"
    >
      {children}
    </button>
  );
}

function StatusBadge({ sentAt }: { sentAt: Date | null }) {
  const sent = sentAt !== null;
  return (
    <span
      // UTC calendar date keeps server and client render identical.
      title={sent ? `Emailed on ${formatDate(new Date(sentAt).toISOString().slice(0, 10))}` : "Saved, not yet emailed"}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium tracking-[0.01em] uppercase",
        sent ? "bg-[#e8f4ef] text-[#17604f]" : "bg-[#fdf2e2] text-[#94540a]",
      )}
    >
      {sent ? <Check className="size-3.5" aria-hidden /> : <PencilLine className="size-3.5" aria-hidden />}
      {sent ? "Sent" : "Draft"}
    </span>
  );
}

function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-input bg-[#fafbfc] px-6 py-16 text-center">
      <FileText className="mx-auto size-8 text-primary" aria-hidden />
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      {action}
    </div>
  );
}
