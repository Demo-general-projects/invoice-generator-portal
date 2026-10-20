"use client";

import { PageError } from "@/components/load-state";

/** Last-resort error page for unexpected errors while rendering. */
export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return <PageError message={error.message} onRetry={reset} />;
}
