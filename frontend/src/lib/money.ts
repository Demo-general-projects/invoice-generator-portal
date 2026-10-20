// Frontend copy of the money rules. The backend's are in backend/app/Domain/Money.php; keep them in sync.
// All amounts are integers in their smallest unit: money in cents, quantity in
// hundredths, tax in basis points. User input is parsed from strings so no
// binary floating-point value is ever used in a calculation.

/**
 * Parses a non-negative decimal string into an integer scaled by 10^scale.
 * "50" -> 5000 and "1.5" -> 150 at scale 2. Returns null for anything that
 * isn't a plain non-negative number with at most `scale` decimals.
 */
export function parseDecimal(input: string, scale: number): number | null {
  const cleaned = input.trim().replace(/[$,\s]/g, "");
  const match = new RegExp(`^(\\d*)(?:\\.(\\d{0,${scale}}))?$`).exec(cleaned);
  if (!match || cleaned === "" || cleaned === ".") return null;
  const whole = match[1] || "0";
  const fraction = (match[2] ?? "").padEnd(scale, "0");
  const value = Number(whole) * 10 ** scale + Number(fraction || "0");
  return Number.isSafeInteger(value) ? value : null;
}

/** Integer division rounded half-up. Inputs are always non-negative here. */
export function roundDiv(numerator: number, denominator: number): number {
  return Math.floor((numerator * 2 + denominator) / (denominator * 2));
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatUSD(cents: number): string {
  return usd.format(cents / 100);
}

/** Formats a scaled integer back into an editable string: 150 -> "1.5". */
export function formatDecimal(value: number, scale: number): string {
  const factor = 10 ** scale;
  const whole = Math.floor(value / factor);
  const fraction = String(value % factor).padStart(scale, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
}

export const centsToInput = (cents: number) => (cents / 100).toFixed(2);
