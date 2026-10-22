<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** The single row of business settings used to prefill new invoices. */
class BusinessSettings extends Model
{
    public const TEMPLATES = ['classic', 'modern', 'minimal'];

    protected $dateFormat = 'Y-m-d H:i:s.v';

    protected $fillable = [
        'business_name',
        'business_email',
        'business_phone',
        'business_address',
        'default_template',
        'default_tax_rate_bps',
        'default_notes',
    ];

    protected function casts(): array
    {
        return ['default_tax_rate_bps' => 'integer'];
    }

    public static function current(): self
    {
        return static::query()->first() ?? new self;
    }

    /** Camel-cased for the API (frontend/src/lib/api-types.ts: BusinessSettingsDTO). */
    public function toApi(): array
    {
        return [
            'businessName' => $this->business_name ?? '',
            'businessEmail' => $this->business_email ?? '',
            'businessPhone' => $this->business_phone ?? '',
            'businessAddress' => $this->business_address ?? '',
            'defaultTemplate' => $this->default_template ?? 'classic',
            'defaultTaxRateBps' => $this->default_tax_rate_bps ?? 0,
            'defaultNotes' => $this->default_notes ?? '',
        ];
    }
}
