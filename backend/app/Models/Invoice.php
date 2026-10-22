<?php

namespace App\Models;

use App\Domain\Totals;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasUlids;

    protected $dateFormat = 'Y-m-d H:i:s.v';

    protected $fillable = [
        'number',
        'issue_date',
        'due_date',
        'business_name',
        'business_email',
        'business_phone',
        'business_address',
        'customer_name',
        'customer_email',
        'customer_address',
        'notes',
        'discount_cents',
        'tax_rate_bps',
        'template',
    ];

    protected function casts(): array
    {
        return [
            'discount_cents' => 'integer',
            'tax_rate_bps' => 'integer',
            'last_sent_at' => 'datetime',
        ];
    }

    public function lineItems(): HasMany
    {
        return $this->hasMany(LineItem::class)->orderBy('position');
    }

    public function customFields(): HasMany
    {
        return $this->hasMany(CustomField::class)->orderBy('position');
    }

    /** @return array{lineTotalsCents: list<int>, subtotalCents: int, discountCents: int, taxableCents: int, taxCents: int, totalCents: int} */
    public function totals(): array
    {
        return Totals::calculate(
            $this->lineItems
                ->map(fn (LineItem $line) => [
                    'quantityHundredths' => $line->quantity_hundredths,
                    'unitPriceCents' => $line->unit_price_cents,
                ])
                ->all(),
            $this->discount_cents,
            $this->tax_rate_bps,
        );
    }

    /** Suggests the next number by incrementing the most recent one: INV-0007 -> INV-0008. */
    public static function suggestNumber(): string
    {
        $latest = static::query()->latest()->latest('id')->value('number');
        if (! $latest || ! preg_match('/^(.*?)(\d+)$/', $latest, $match)) {
            return 'INV-0001';
        }
        [, $prefix, $digits] = $match;
        for ($n = (int) $digits + 1; ; $n++) {
            $candidate = $prefix.str_pad((string) $n, strlen($digits), '0', STR_PAD_LEFT);
            if (! static::where('number', $candidate)->exists()) {
                return $candidate;
            }
        }
    }
}
