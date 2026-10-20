import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

type Crumb = { label: string; href?: string };

export function AppHeader({ crumbs, children }: { crumbs: Crumb[]; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur print:hidden">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-4 px-4 sm:px-6">
        <Link href="/invoices" className="flex items-center gap-2.5 rounded-md font-semibold tracking-tight">
          <span aria-hidden className="flex size-8 items-center justify-center rounded-lg bg-primary font-serif text-lg text-white">
            L
          </span>
          <span className="hidden sm:inline">Ledgerline</span>
        </Link>
        <nav aria-label="Breadcrumb" className="hidden md:block">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {crumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <ChevronRight className="size-4" aria-hidden />
                {crumb.href ? (
                  <Link href={crumb.href} className="rounded hover:text-foreground">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="font-medium text-foreground">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <div className="ml-auto flex items-center gap-2">{children}</div>
      </div>
    </header>
  );
}
