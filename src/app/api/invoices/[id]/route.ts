import { apiError, parseBody } from "@/lib/api";
import { invoiceInputSchema } from "@/lib/invoice-schema";
import { DuplicateInvoiceNumberError, getInvoice, updateInvoice } from "@/lib/invoices";
import { calculateTotals } from "@/lib/totals";

export async function GET(_request: Request, ctx: RouteContext<"/api/invoices/[id]">) {
  const { id } = await ctx.params;
  const invoice = await getInvoice(id);
  if (!invoice) return apiError(404, "Invoice not found");
  return Response.json({ invoice, totals: calculateTotals(invoice) });
}

export async function PUT(request: Request, ctx: RouteContext<"/api/invoices/[id]">) {
  const { id } = await ctx.params;
  const parsed = await parseBody(request, invoiceInputSchema);
  if ("response" in parsed) return parsed.response;
  try {
    const invoice = await updateInvoice(id, parsed.data);
    if (!invoice) return apiError(404, "Invoice not found");
    return Response.json({ invoice, totals: calculateTotals(invoice) });
  } catch (error) {
    if (error instanceof DuplicateInvoiceNumberError) return apiError(409, error.message, { number: error.message });
    throw error;
  }
}
