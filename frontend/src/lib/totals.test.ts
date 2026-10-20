import { describe, expect, it } from "vitest";
import { formatUSD, parseDecimal, roundDiv } from "./money";
import { calculateTotals, lineTotalCents } from "./totals";

describe("parseDecimal", () => {
  it.each([
    ["50", 5000],
    ["50.5", 5050],
    ["49.99", 4999],
    ["$1,250.00", 125000],
    [".5", 50],
    ["0", 0],
  ])("parses %s", (input, expected) => {
    expect(parseDecimal(input, 2)).toBe(expected);
  });

  it.each(["-1", "1.234", "abc", "", ".", "1e3", "1.2.3"])("rejects %s", (input) => {
    expect(parseDecimal(input, 2)).toBeNull();
  });
});

describe("roundDiv", () => {
  it("rounds half up", () => {
    expect(roundDiv(150, 100)).toBe(2);
    expect(roundDiv(149, 100)).toBe(1);
    expect(roundDiv(0, 100)).toBe(0);
  });
});

describe("calculateTotals", () => {
  it("matches the brief: 2 × $50 − $10 discount + 10% tax = $99.00", () => {
    const totals = calculateTotals({
      lineItems: [{ quantityHundredths: 200, unitPriceCents: 5000 }],
      discountCents: 1000,
      taxRateBps: 1000,
    });
    expect(totals).toMatchObject({
      subtotalCents: 10000,
      taxableCents: 9000,
      taxCents: 900,
      totalCents: 9900,
    });
    expect(formatUSD(totals.totalCents)).toBe("$99.00");
  });

  it("rounds each line to cents before summing", () => {
    // 0.33 × $0.10 = 3.3¢ -> 3¢ per line; summing first would give 10¢ not 9¢
    const line = { quantityHundredths: 33, unitPriceCents: 10 };
    expect(lineTotalCents(line)).toBe(3);
    expect(calculateTotals({ lineItems: [line, line, line], discountCents: 0, taxRateBps: 0 }).subtotalCents).toBe(9);
  });

  it("applies tax after the discount and rounds tax half up", () => {
    // $10.05 taxable × 10% = 100.5¢ -> 101¢
    const totals = calculateTotals({
      lineItems: [{ quantityHundredths: 100, unitPriceCents: 1105 }],
      discountCents: 100,
      taxRateBps: 1000,
    });
    expect(totals.taxCents).toBe(101);
    expect(totals.totalCents).toBe(1106);
  });

  it("supports fractional quantities and tax rates", () => {
    // 1.5 h × $80 = $120, 8.25% tax = $9.90
    const totals = calculateTotals({
      lineItems: [{ quantityHundredths: 150, unitPriceCents: 8000 }],
      discountCents: 0,
      taxRateBps: 825,
    });
    expect(totals.totalCents).toBe(12990);
  });

  it("allows a discount equal to the subtotal", () => {
    const totals = calculateTotals({
      lineItems: [{ quantityHundredths: 100, unitPriceCents: 5000 }],
      discountCents: 5000,
      taxRateBps: 1000,
    });
    expect(totals.totalCents).toBe(0);
  });
});
