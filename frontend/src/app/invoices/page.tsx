import type { Metadata } from "next";
import { InvoicesDashboard } from "@/components/dashboard/invoices-dashboard";

export const metadata: Metadata = { title: "Invoices · Ledgerline" };

export default function InvoicesPage() {
  return <InvoicesDashboard />;
}
