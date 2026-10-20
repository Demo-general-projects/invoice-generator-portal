<?php

namespace App\Mail;

use App\Domain\Money;
use App\Models\CustomField;
use App\Models\Invoice;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * The saved invoice as an email: an email-client-safe HTML version (tables and
 * inline styles) plus a plain-text alternative. Blade escapes every value.
 */
class InvoiceMail extends Mailable
{
    public function __construct(
        public Invoice $invoice,
        public string $subjectLine,
        public string $note,
        public string $viewUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->subjectLine);
    }

    public function content(): Content
    {
        $invoice = $this->invoice;
        $totals = $invoice->totals();

        // [label, value] pairs: custom field labels may repeat or match a built-in label.
        $meta = [
            ['Invoice no.', $invoice->number],
            ['Issue date', self::formatDate($invoice->issue_date)],
            ['Due date', self::formatDate($invoice->due_date)],
            // Only visible custom fields appear on the invoice, as in the preview and print.
            ...$invoice->customFields
                ->filter(fn (CustomField $field) => $field->visible)
                ->map(fn (CustomField $field) => [$field->label, $field->value]),
        ];

        $summary = ['Subtotal' => Money::formatUsd($totals['subtotalCents'])];
        if ($totals['discountCents'] > 0) {
            $summary['Discount'] = '−'.Money::formatUsd($totals['discountCents']);
        }
        $summary['Tax ('.Money::formatDecimal($invoice->tax_rate_bps, 2).'%)'] = Money::formatUsd($totals['taxCents']);

        $lines = $invoice->lineItems->values()->map(fn ($line, $i) => [
            'description' => $line->description,
            'quantity' => Money::formatDecimal($line->quantity_hundredths, 2),
            'unitPrice' => Money::formatUsd($line->unit_price_cents),
            'amount' => Money::formatUsd($totals['lineTotalsCents'][$i]),
        ]);

        return new Content(
            view: 'mail.invoice',
            text: 'mail.invoice-text',
            with: [
                'meta' => $meta,
                'summary' => $summary,
                'lines' => $lines,
                'total' => Money::formatUsd($totals['totalCents']),
            ],
        );
    }

    /** "2026-10-20" -> "Oct 20, 2026". Dates are calendar dates, so no timezone is applied. */
    private static function formatDate(string $date): string
    {
        return \DateTimeImmutable::createFromFormat('!Y-m-d', $date)->format('M j, Y');
    }
}
