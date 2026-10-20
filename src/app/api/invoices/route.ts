import { apiError, parseBody } from "@/lib/api";
import { invoiceInputSchema } from "@/lib/invoice-schema";
import { createInvoice, DuplicateInvoiceNumberError, listInvoices } from "@/lib/invoices";
import { calculateTotals } from "@/lib/totals";

export async function GET() {
  return Response.json({ invoices: await listInvoices() });
}

export async function POST(request: Request) {
  const parsed = await parseBody(request, invoiceInputSchema);
  if ("response" in parsed) return parsed.response;
  try {
    const invoice = await createInvoice(parsed.data);
    return Response.json({ invoice, totals: calculateTotals(invoice) }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateInvoiceNumberError) return apiError(409, error.message, { number: error.message });
    throw error;
  }
}
