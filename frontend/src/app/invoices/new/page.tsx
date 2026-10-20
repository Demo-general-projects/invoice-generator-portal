import type { Metadata } from "next";
import { NewInvoice } from "@/components/invoice/invoice-pages";

export const metadata: Metadata = { title: "New invoice · Ledgerline" };

export default function NewInvoicePage() {
  return <NewInvoice />;
}
