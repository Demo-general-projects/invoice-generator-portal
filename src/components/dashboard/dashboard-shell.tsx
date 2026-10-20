import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import type { ReactNode } from "react";

/**
 * App frame for the invoices dashboard: a fixed sidebar on desktop and a
 * compact top bar on mobile. Only links to pages that exist.
 */
export function DashboardShell({ invoiceCount, children }: { invoiceCount: number; children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-background px-4 py-5 lg:flex">
        <Brand />
        <nav aria-label="Main" className="mt-8">
          <p className="px-3 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Workspace</p>
          <ul className="mt-2 flex flex-col gap-1">
            <li>
              <Link
                href="/invoices"
                aria-current="page"
                className="flex h-10 items-center gap-3 rounded-lg bg-white px-3 text-sm font-medium text-primary shadow-[0_1px_2px_rgba(22,32,31,0.06)] ring-1 ring-border"
              >
                <FileText className="size-4" aria-hidden />
                Invoices
                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white tabular-nums">
                  {invoiceCount}
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/invoices/new"
                className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-foreground/75 transition-colors hover:bg-white hover:text-foreground"
              >
                <Plus className="size-4" aria-hidden />
                New invoice
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
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

      <div className="min-h-dvh bg-white lg:border-l-0">{children}</div>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/invoices" className="flex items-center gap-2.5 rounded-md px-1 font-semibold tracking-tight">
      <span aria-hidden className="flex size-8 items-center justify-center rounded-lg bg-primary font-serif text-lg text-white">
        L
      </span>
      <span>Ledgerline</span>
    </Link>
  );
}
