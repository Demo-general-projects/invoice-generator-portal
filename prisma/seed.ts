// Seeds one fictional invoice so the app has something to show on first run.
import "dotenv/config";
import { createInvoice } from "../server/invoices";
import { db } from "../server/db";

async function main() {
  if (await db.invoice.findUnique({ where: { number: "INV-0001" } })) {
    console.log("Seed invoice already exists, skipping.");
    return;
  }
  const invoice = await createInvoice({
    number: "INV-0001",
    issueDate: "2026-10-20",
    dueDate: "2026-11-19",
    businessName: "Acme Studio",
    businessEmail: "hello@acmestudio.example",
    businessAddress: "123 Creative Street\nSan Francisco, CA 94105",
    customerName: "Bright Solutions Ltd.",
    customerEmail: "billing@brightsolutions.example",
    customerAddress: "456 Market Street\nNew York, NY 10001",
    notes: "Thank you for your business. Payment is due within 30 days by bank transfer.",
    discountCents: 1000,
    taxRateBps: 1000,
    lineItems: [{ description: "Brand strategy workshop", quantityHundredths: 200, unitPriceCents: 5000 }],
    customFields: [
      { label: "PO number", value: "PO-12345", visible: true },
      { label: "Project", value: "Website redesign", visible: true },
      { label: "Internal ref", value: "ACME-Q4-17", visible: false },
    ],
  });
  console.log(`Seeded ${invoice.number} (${invoice.id})`);
}

main().finally(() => db.$disconnect());
