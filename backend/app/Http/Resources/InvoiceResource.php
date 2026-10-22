<?php

namespace App\Http\Resources;

use App\Models\CustomField;
use App\Models\Invoice;
use App\Models\LineItem;
use DateTimeImmutable;
use DateTimeInterface;
use DateTimeZone;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One invoice as the frontend expects it (frontend/src/lib/api-types.ts: InvoiceDTO).
 * Field names stay camelCase; database columns are snake_case.
 *
 * @mixin Invoice
 */
class InvoiceResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'issueDate' => $this->issue_date,
            'dueDate' => $this->due_date,
            'businessName' => $this->business_name,
            'businessEmail' => $this->business_email,
            'businessPhone' => $this->business_phone ?? '',
            'businessAddress' => $this->business_address,
            'customerName' => $this->customer_name,
            'customerEmail' => $this->customer_email,
            'customerAddress' => $this->customer_address,
            'notes' => $this->notes,
            'template' => $this->template ?? 'classic',
            'discountCents' => $this->discount_cents,
            'taxRateBps' => $this->tax_rate_bps,
            'lineItems' => $this->lineItems->map(fn (LineItem $line) => [
                'description' => $line->description,
                'quantityHundredths' => $line->quantity_hundredths,
                'unitPriceCents' => $line->unit_price_cents,
            ])->all(),
            'customFields' => $this->customFields->map(fn (CustomField $field) => [
                'label' => $field->label,
                'value' => $field->value,
                'visible' => $field->visible,
            ])->all(),
            'lastSentAt' => self::isoDate($this->last_sent_at),
            'createdAt' => self::isoDate($this->created_at),
            'updatedAt' => self::isoDate($this->updated_at),
        ];
    }

    /** ISO 8601 in UTC with milliseconds, e.g. 2026-10-20T14:50:28.521Z, as JavaScript's Date produces. */
    public static function isoDate(?DateTimeInterface $date): ?string
    {
        return $date === null
            ? null
            : DateTimeImmutable::createFromInterface($date)->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.v\Z');
    }
}
