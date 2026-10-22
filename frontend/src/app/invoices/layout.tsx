"use client";

import { PageLoading } from "@/components/load-state";
import { useRequireAuth } from "@/lib/auth";

export default function InvoicesLayout({ children }: { children: React.ReactNode }) {
  const ok = useRequireAuth();
  if (!ok) return <PageLoading label="Checking your session…" />;
  return <>{children}</>;
}
