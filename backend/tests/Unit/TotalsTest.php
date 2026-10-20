<?php

namespace Tests\Unit;

use App\Domain\Money;
use App\Domain\Totals;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class TotalsTest extends TestCase
{
    #[Test]
    public function round_div_rounds_half_up(): void
    {
        $this->assertSame(2, Money::roundDiv(150, 100));
        $this->assertSame(1, Money::roundDiv(149, 100));
        $this->assertSame(0, Money::roundDiv(0, 100));
    }

    #[Test]
    public function it_formats_money_and_decimals(): void
    {
        $this->assertSame('$99.00', Money::formatUsd(9900));
        $this->assertSame('$1,234.05', Money::formatUsd(123405));
        $this->assertSame('$0.00', Money::formatUsd(0));
        $this->assertSame('1.5', Money::formatDecimal(150, 2));
        $this->assertSame('8.25', Money::formatDecimal(825, 2));
        $this->assertSame('10', Money::formatDecimal(1000, 2));
    }

    #[Test]
    public function it_matches_the_brief_2_x_50_minus_10_plus_10_percent_is_99(): void
    {
        $totals = Totals::calculate([['quantityHundredths' => 200, 'unitPriceCents' => 5000]], 1000, 1000);

        $this->assertSame(10000, $totals['subtotalCents']);
        $this->assertSame(9000, $totals['taxableCents']);
        $this->assertSame(900, $totals['taxCents']);
        $this->assertSame(9900, $totals['totalCents']);
        $this->assertSame('$99.00', Money::formatUsd($totals['totalCents']));
    }

    #[Test]
    public function it_rounds_each_line_to_cents_before_summing(): void
    {
        // 0.33 × $0.10 = 3.3¢ -> 3¢ per line; summing first would give 10¢ not 9¢
        $line = ['quantityHundredths' => 33, 'unitPriceCents' => 10];

        $this->assertSame(3, Totals::lineTotalCents(33, 10));
        $this->assertSame(9, Totals::calculate([$line, $line, $line], 0, 0)['subtotalCents']);
    }

    #[Test]
    public function it_applies_tax_after_the_discount_and_rounds_tax_half_up(): void
    {
        // $10.05 taxable × 10% = 100.5¢ -> 101¢
        $totals = Totals::calculate([['quantityHundredths' => 100, 'unitPriceCents' => 1105]], 100, 1000);

        $this->assertSame(101, $totals['taxCents']);
        $this->assertSame(1106, $totals['totalCents']);
    }

    #[Test]
    public function it_supports_fractional_quantities_and_tax_rates(): void
    {
        // 1.5 h × $80 = $120, 8.25% tax = $9.90
        $totals = Totals::calculate([['quantityHundredths' => 150, 'unitPriceCents' => 8000]], 0, 825);

        $this->assertSame(12990, $totals['totalCents']);
    }

    #[Test]
    public function it_allows_a_discount_equal_to_the_subtotal(): void
    {
        $totals = Totals::calculate([['quantityHundredths' => 100, 'unitPriceCents' => 5000]], 5000, 1000);

        $this->assertSame(0, $totals['totalCents']);
    }
}
