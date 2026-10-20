import { parseField, type InvoiceFormValues } from "./invoice-schema";
import { calculateTotals, lineTotalCents, type Totals } from "./totals";

export type PreviewLine = {
  quantityHundredths: number | null;
  unitPriceCents: number | null;
  amountCents: number | null;
};

export type InvoicePreview = {
  lines: PreviewLine[];
  totals: Totals;
  taxRateBps: number | null;
  /** Subtotal is trustworthy only when every line parses. */
  linesValid: boolean;
  /** Tax and total are trustworthy only when everything parses and the discount fits. */
  totalsValid: boolean;
};

/**
 * Leniently derives amounts from in-progress form values for the live preview.
 * Anything that doesn't parse yet is reported as null instead of guessed.
 */
export function derivePreview(values: InvoiceFormValues): InvoicePreview {
  const lines = values.lineItems.map((line) => {
    const quantityHundredths = parseField(line.quantity, "quantity");
    const unitPriceCents = parseField(line.unitPrice, "unitPrice");
    const amountCents =
      quantityHundredths !== null && unitPriceCents !== null
        ? lineTotalCents({ quantityHundredths, unitPriceCents })
        : null;
    return { quantityHundredths, unitPriceCents, amountCents };
  });
  const discountCents = parseField(values.discount, "discount");
  const taxRateBps = parseField(values.taxRate, "taxRate");
  const totals = calculateTotals({
    lineItems: lines.map((l) => ({ quantityHundredths: l.quantityHundredths ?? 0, unitPriceCents: l.unitPriceCents ?? 0 })),
    discountCents: discountCents ?? 0,
    taxRateBps: taxRateBps ?? 0,
  });
  const linesValid = lines.every((l) => l.amountCents !== null);
  const totalsValid =
    linesValid && discountCents !== null && taxRateBps !== null && totals.discountCents <= totals.subtotalCents;
  return { lines, totals, taxRateBps, linesValid, totalsValid };
}
