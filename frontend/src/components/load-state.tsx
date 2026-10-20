import Link from "next/link";
import { FileQuestion, Loader2, RotateCw, ServerCrash } from "lucide-react";
import type { ReactNode } from "react";

/** Full-page placeholder while a page loads its data from the API. */
export function PageLoading({ label }: { label: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background" aria-busy="true">
      <p role="status" className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" aria-hidden /> {label}
      </p>
    </main>
  );
}

/** Shown when a page can't load its data, most often because the API server isn't running. */
export function PageError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Notice icon={<ServerCrash className="mx-auto size-9 text-primary" aria-hidden />} title="Couldn't load this page" body={message}>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"
      >
        <RotateCw className="size-4" aria-hidden /> Try again
      </button>
    </Notice>
  );
}

export function InvoiceNotFound() {
  return (
    <Notice
      icon={<FileQuestion className="mx-auto size-9 text-primary" aria-hidden />}
      title="Invoice not found"
      body="It may have been removed, or the link is incomplete."
    >
      <Link
        href="/invoices"
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"
      >
        Back to invoices
      </Link>
    </Notice>
  );
}

function Notice({ icon, title, body, children }: { icon: ReactNode; title: string; body: string; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        {icon}
        <h1 className="mt-4 text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        {children}
      </div>
    </main>
  );
}
