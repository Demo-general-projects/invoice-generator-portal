<?php

namespace App\Domain;

/**
 * Invoice totals in integer cents. The frontend keeps the same rules in
 * frontend/src/lib/totals.ts for the live preview; keep them in sync.
 */
final class Totals
{
    /** Quantity is in hundredths, so divide by 100 and round to the nearest cent. */
    public static function lineTotalCents(int $quantityHundredths, int $unitPriceCents): int
    {
        return Money::roundDiv($quantityHundredths * $unitPriceCents, 100);
    }

    /**
     * Order matters and follows the brief: round each line to cents, sum the
     * lines, subtract the fixed discount, then calculate and round the tax.
     * Custom fields are deliberately not an input.
     *
     * @param  list<array{quantityHundredths: int, unitPriceCents: int}>  $lineItems
     * @return array{lineTotalsCents: list<int>, subtotalCents: int, discountCents: int, taxableCents: int, taxCents: int, totalCents: int}
     */
    public static function calculate(array $lineItems, int $discountCents, int $taxRateBps): array
    {
        $lineTotalsCents = array_map(
            fn (array $line) => self::lineTotalCents($line['quantityHundredths'], $line['unitPriceCents']),
            $lineItems,
        );
        $subtotalCents = array_sum($lineTotalsCents);
        $taxableCents = max(0, $subtotalCents - $discountCents);
        $taxCents = Money::roundDiv($taxableCents * $taxRateBps, 10_000);

        return [
            'lineTotalsCents' => $lineTotalsCents,
            'subtotalCents' => $subtotalCents,
            'discountCents' => $discountCents,
            'taxableCents' => $taxableCents,
            'taxCents' => $taxCents,
            'totalCents' => $taxableCents + $taxCents,
        ];
    }
}
