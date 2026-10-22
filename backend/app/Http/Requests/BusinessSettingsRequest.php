<?php

namespace App\Http\Requests;

use App\Models\BusinessSettings;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BusinessSettingsRequest extends FormRequest
{
    public function rules(): array
    {
        $text = fn (int $max) => ['present', 'string', "max:{$max}"];

        return [
            'businessName' => $text(120),
            'businessEmail' => [...$text(254), 'email'],
            'businessPhone' => $text(40),
            'businessAddress' => $text(500),
            'defaultTemplate' => ['required', Rule::in(BusinessSettings::TEMPLATES)],
            'defaultTaxRateBps' => ['required', 'integer', 'min:0', 'max:'.InvoiceRequest::MAX_TAX_RATE_BPS],
            'defaultNotes' => $text(2000),
        ];
    }

    public function messages(): array
    {
        return [
            '*.email' => 'Enter a valid email address',
            'defaultTemplate.*' => 'Pick a template',
            'defaultTaxRateBps.min' => "Tax can't be negative",
        ];
    }

    public function toAttributes(): array
    {
        $data = $this->validated();

        return [
            'business_name' => $data['businessName'],
            'business_email' => $data['businessEmail'],
            'business_phone' => $data['businessPhone'],
            'business_address' => $data['businessAddress'],
            'default_template' => $data['defaultTemplate'],
            'default_tax_rate_bps' => (int) $data['defaultTaxRateBps'],
            'default_notes' => $data['defaultNotes'],
        ];
    }
}
