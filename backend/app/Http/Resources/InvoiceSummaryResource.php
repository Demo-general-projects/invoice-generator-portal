<?php

namespace App\Http\Resources;

use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One row of the invoices dashboard (frontend/src/lib/api-types.ts: InvoiceSummary).
 *
 * @mixin Invoice
 */
class InvoiceSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'customerName' => $this->customer_name,
            'customerEmail' => $this->customer_email,
            'issueDate' => $this->issue_date,
            'dueDate' => $this->due_date,
            'totalCents' => $this->totals()['totalCents'],
            'itemCount' => $this->lineItems->count(),
            'lastSentAt' => InvoiceResource::isoDate($this->last_sent_at),
            'updatedAt' => InvoiceResource::isoDate($this->updated_at),
        ];
    }
}
