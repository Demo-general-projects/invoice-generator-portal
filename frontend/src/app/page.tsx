"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLoading } from "@/components/load-state";

// A static export can't redirect on the server, so the start page forwards in the browser.
export default function Home() {
  const router = useRouter();
  useEffect(() => router.replace("/invoices"), [router]);
  return <PageLoading label="Opening invoices…" />;
}
