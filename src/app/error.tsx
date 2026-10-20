"use client";

import { RotateCw, ServerCrash } from "lucide-react";

/** Shown when a page can't load its data, most often because the API server isn't running. */
export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <ServerCrash className="mx-auto size-9 text-primary" aria-hidden />
        <h1 className="mt-4 text-lg font-semibold">Couldn&apos;t load this page</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"
        >
          <RotateCw className="size-4" aria-hidden /> Try again
        </button>
      </div>
    </main>
  );
}
