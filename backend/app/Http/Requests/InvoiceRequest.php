<?php

namespace App\Http\Requests;

use App\Domain\Money;
use App\Domain\Totals;
use App\Models\BusinessSettings;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * The API is the source of truth for the invoice rules: every create and update
 * is validated here. The frontend repeats them (frontend/src/lib/invoice-schema.ts)
 * for instant form feedback; keep both in sync.
 */
class InvoiceRequest extends FormRequest
{
    // Upper bounds keep every intermediate product well inside a 64-bit integer.
    public const MAX_QUANTITY_HUNDREDTHS = 1_000_000_00; // 1,000,000 units

    public const MAX_UNIT_PRICE_CENTS = 10_000_000_00; // $10M

    public const MAX_TAX_RATE_BPS = 100_00; // 100%

    public function rules(): array
    {
        $text = fn (int $max) => ['present', 'string', "max:{$max}"];

        return [
            'number' => ['required', 'string', 'max:40'],
            'issueDate' => ['required', 'date_format:Y-m-d'],
            'dueDate' => ['required', 'date_format:Y-m-d'],
            'businessName' => ['required', 'string', 'max:120'],
            'businessEmail' => [...$text(254), 'email'],
            'businessPhone' => ['sometimes', 'string', 'max:40'],
            'template' => ['sometimes', Rule::in(BusinessSettings::TEMPLATES)],
            'businessAddress' => $text(500),
            'customerName' => ['required', 'string', 'max:120'],
            'customerEmail' => [...$text(254), 'email'],
            'customerAddress' => $text(500),
            'notes' => $text(2000),
            'discountCents' => ['required', 'integer', 'min:0'],
            'taxRateBps' => ['required', 'integer', 'min:0', 'max:'.self::MAX_TAX_RATE_BPS],

            'lineItems' => ['required', 'list', 'min:1', 'max:100'],
            'lineItems.*' => ['array'],
            'lineItems.*.description' => ['required', 'string', 'max:200'],
            'lineItems.*.quantityHundredths' => ['required', 'integer', 'min:1', 'max:'.self::MAX_QUANTITY_HUNDREDTHS],
            'lineItems.*.unitPriceCents' => ['required', 'integer', 'min:0', 'max:'.self::MAX_UNIT_PRICE_CENTS],

            'customFields' => ['present', 'list', 'max:20'],
            'customFields.*' => ['array'],
            'customFields.*.label' => ['required', 'string', 'max:60'],
            'customFields.*.value' => $text(200),
            'customFields.*.visible' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'number.required' => 'Invoice number is required',
            'issueDate.*' => 'Pick an issue date',
            'dueDate.*' => 'Pick a due date',
            'businessName.required' => 'Business name is required',
            'customerName.required' => 'Customer name is required',
            '*.email' => 'Enter a valid email address',
            'discountCents.min' => "Discount can't be negative",
            'taxRateBps.min' => "Tax can't be negative",
            'lineItems.required' => 'Add at least one line item',
            'lineItems.min' => 'Add at least one line item',
            'lineItems.*.description.required' => 'Add a description',
            'lineItems.*.quantityHundredths.min' => 'Quantity must be more than 0',
            'lineItems.*.unitPriceCents.min' => "Price can't be negative",
            'customFields.*.label.required' => 'Add a label',
        ];
    }

    /** Rules that compare fields, run once the individual fields are valid. */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $errors = $validator->errors();
                $input = $this->all();

                if (! $errors->hasAny(['issueDate', 'dueDate']) && $input['dueDate'] < $input['issueDate']) {
                    $errors->add('dueDate', "Due date can't be before the issue date");
                }

                if ($errors->has('lineItems*') || $errors->has('discountCents')) {
                    return;
                }
                $subtotalCents = Totals::calculate(
                    array_map(fn (array $line) => [
                        'quantityHundredths' => (int) $line['quantityHundredths'],
                        'unitPriceCents' => (int) $line['unitPriceCents'],
                    ], $input['lineItems']),
                    0,
                    0,
                )['subtotalCents'];
                if ((int) $input['discountCents'] > $subtotalCents) {
                    $errors->add('discountCents', "Discount can't exceed the subtotal (".Money::formatUsd($subtotalCents).')');
                }
            },
        ];
    }

    /** Validated input in database column names, with children in their submitted order. */
    public function toAttributes(): array
    {
        $data = $this->validated();

        return [
            'invoice' => [
                'number' => $data['number'],
                'issue_date' => $data['issueDate'],
                'due_date' => $data['dueDate'],
                'business_name' => $data['businessName'],
                'business_email' => $data['businessEmail'],
                'business_phone' => $data['businessPhone'] ?? '',
                'business_address' => $data['businessAddress'],
                'template' => $data['template'] ?? 'classic',
                'customer_name' => $data['customerName'],
                'customer_email' => $data['customerEmail'],
                'customer_address' => $data['customerAddress'],
                'notes' => $data['notes'],
                'discount_cents' => (int) $data['discountCents'],
                'tax_rate_bps' => (int) $data['taxRateBps'],
            ],
            'lineItems' => array_map(fn (array $line, int $position) => [
                'position' => $position,
                'description' => $line['description'],
                'quantity_hundredths' => (int) $line['quantityHundredths'],
                'unit_price_cents' => (int) $line['unitPriceCents'],
            ], $data['lineItems'], array_keys($data['lineItems'])),
            'customFields' => array_map(fn (array $field, int $position) => [
                'position' => $position,
                'label' => $field['label'],
                'value' => $field['value'],
                'visible' => (bool) $field['visible'],
            ], $data['customFields'], array_keys($data['customFields'])),
        ];
    }
}
