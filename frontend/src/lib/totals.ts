// Frontend copy. The backend keeps its own copy in backend/src/domain/totals.ts; keep them in sync.
import { roundDiv } from "./money";

export type TotalsLine = { quantityHundredths: number; unitPriceCents: number };

export type Totals = {
  lineTotalsCents: number[];
  subtotalCents: number;
  discountCents: number;
  taxableCents: number;
  taxCents: number;
  totalCents: number;
};

/** Quantity is in hundredths, so divide by 100 and round to the nearest cent. */
export function lineTotalCents({ quantityHundredths, unitPriceCents }: TotalsLine): number {
  return roundDiv(quantityHundredths * unitPriceCents, 100);
}

/**
 * Order matters and follows the brief: round each line to cents, sum the
 * lines, subtract the fixed discount, then calculate and round the tax.
 * Custom fields are deliberately not an input.
 */
export function calculateTotals(input: {
  lineItems: TotalsLine[];
  discountCents: number;
  taxRateBps: number;
}): Totals {
  const lineTotalsCents = input.lineItems.map(lineTotalCents);
  const subtotalCents = lineTotalsCents.reduce((sum, cents) => sum + cents, 0);
  const taxableCents = Math.max(0, subtotalCents - input.discountCents);
  const taxCents = roundDiv(taxableCents * input.taxRateBps, 10_000);
  return {
    lineTotalsCents,
    subtotalCents,
    discountCents: input.discountCents,
    taxableCents,
    taxCents,
    totalCents: taxableCents + taxCents,
  };
}
