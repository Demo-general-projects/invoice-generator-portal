import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import type { ReactNode } from "react";

/**
 * App frame for the invoices dashboard: a fixed sidebar on desktop and a
 * compact top bar on mobile. Only links to pages that exist.
 */
export function DashboardShell({ invoiceCount, children }: { invoiceCount: number; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-white lg:pl-[17rem]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[17rem] flex-col border-r border-border bg-[#f3f6fa] px-4 pt-6 pb-5 lg:flex">
        <Brand />
        <div aria-hidden className="mx-1 mt-6 border-t border-dashed border-input" />
        <nav aria-label="Main" className="mt-6">
          <ul className="flex flex-col gap-2">
            <li>
              <Link
                href="/invoices"
                aria-current="page"
                className="flex h-11 items-center gap-3 rounded-xl bg-white px-3.5 text-[15px] font-medium text-primary shadow-[0_1px_2px_rgba(16,24,40,0.06),0_1px_3px_rgba(16,24,40,0.04)]"
              >
                <FileText className="size-[18px]" aria-hidden />
                Invoices
                <span className="ml-auto min-w-7 rounded-md bg-primary px-1.5 py-0.5 text-center text-xs font-semibold text-white tabular-nums">
                  {invoiceCount}
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/invoices/new"
                className="flex h-11 items-center gap-3 rounded-xl px-3.5 text-[15px] font-medium text-foreground/80 transition-colors hover:bg-white/70 hover:text-foreground"
              >
                <Plus className="size-[18px]" aria-hidden />
                New invoice
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white/90 px-4 backdrop-blur lg:hidden">
        <Brand />
        <nav aria-label="Main">
          <Link
            href="/invoices/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-white shadow-sm"
          >
            <Plus className="size-4" aria-hidden /> New invoice
          </Link>
        </nav>
      </header>

      {children}
    </div>
  );
}

function Brand() {
  return (
    <Link href="/invoices" className="flex items-center gap-3 rounded-lg px-1">
      <span
        aria-hidden
        className="flex size-9 items-center justify-center rounded-[10px] bg-primary font-serif text-xl text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
      >
        L
      </span>
      <span className="text-[19px] font-semibold tracking-[-0.01em]">Ledgerline</span>
    </Link>
  );
}
