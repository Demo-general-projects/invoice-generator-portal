<?php

namespace App\Domain;

/**
 * All amounts are integers in their smallest unit: money in cents, quantity in
 * hundredths, tax in basis points. No float ever touches a calculation.
 *
 * The frontend keeps the same rules in frontend/src/lib/money.ts; keep them in sync.
 */
final class Money
{
    /** Integer division rounded half-up. Inputs are always non-negative here. */
    public static function roundDiv(int $numerator, int $denominator): int
    {
        return intdiv($numerator * 2 + $denominator, $denominator * 2);
    }

    /** 9900 -> "$99.00", 123456 -> "$1,234.56". */
    public static function formatUsd(int $cents): string
    {
        return '$'.number_format(intdiv($cents, 100)).'.'.str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }

    /** Formats a scaled integer for display: 150 -> "1.5", 1000 -> "10". */
    public static function formatDecimal(int $value, int $scale): string
    {
        $factor = 10 ** $scale;
        $fraction = rtrim(str_pad((string) ($value % $factor), $scale, '0', STR_PAD_LEFT), '0');

        return intdiv($value, $factor).($fraction === '' ? '' : ".{$fraction}");
    }
}
