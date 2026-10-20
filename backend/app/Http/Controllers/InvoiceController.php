<?php

namespace App\Http\Controllers;

use App\Http\ApiError;
use App\Http\Requests\InvoiceRequest;
use App\Http\Requests\SendInvoiceEmailRequest;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\InvoiceSummaryResource;
use App\Mail\EmailNotConfigured;
use App\Mail\InvoiceMail;
use App\Models\Invoice;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class InvoiceController extends Controller
{
    public function index(): JsonResponse
    {
        $invoices = Invoice::with('lineItems')->latest('updated_at')->latest('id')->get();

        return response()->json(['invoices' => InvoiceSummaryResource::collection($invoices)]);
    }

    /** Suggested number, dates and sender details for a new invoice. */
    public function defaults(): JsonResponse
    {
        $latest = Invoice::latest()->latest('id')->first(['business_name', 'business_email', 'business_address']);

        return response()->json([
            'number' => Invoice::suggestNumber(),
            'issueDate' => today()->toDateString(),
            'dueDate' => today()->addDays(30)->toDateString(),
            'business' => $latest ? [
                'businessName' => $latest->business_name,
                'businessEmail' => $latest->business_email,
                'businessAddress' => $latest->business_address,
            ] : null,
        ]);
    }

    public function store(InvoiceRequest $request): JsonResponse
    {
        return $this->save(new Invoice, $request, 201);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        return $this->withTotals($invoice);
    }

    public function update(InvoiceRequest $request, Invoice $invoice): JsonResponse
    {
        return $this->save($invoice, $request);
    }

    /** Emails the saved invoice, so the email always matches what was stored. */
    public function email(SendInvoiceEmailRequest $request, Invoice $invoice): JsonResponse
    {
        $data = $request->validated();
        $viewUrl = rtrim(config('app.frontend_url'), '/').'/invoices/edit/?id='.$invoice->id;

        try {
            EmailNotConfigured::check();
            Mail::to($data['to'])->send(new InvoiceMail($invoice, $data['subject'], $data['message'], $viewUrl));
        } catch (EmailNotConfigured $e) {
            return ApiError::response(503, $e->getMessage());
        } catch (TransportExceptionInterface $e) {
            report($e);

            return ApiError::response(502, 'The email provider rejected the message. Check the mail settings and try again.');
        }

        $invoice->forceFill(['last_sent_at' => now()])->save();

        return response()->json(['sentAt' => InvoiceResource::isoDate($invoice->last_sent_at)]);
    }

    /** Replaces the invoice and all its line items and custom fields in one transaction. */
    private function save(Invoice $invoice, InvoiceRequest $request, int $status = 200): JsonResponse
    {
        $attributes = $request->toAttributes();

        try {
            DB::transaction(function () use ($invoice, $attributes) {
                // Always bump updated_at: a change to line items alone is still a change to the invoice.
                $invoice->fill($attributes['invoice'])->forceFill(['updated_at' => now()])->save();
                $invoice->lineItems()->delete();
                $invoice->lineItems()->createMany($attributes['lineItems']);
                $invoice->customFields()->delete();
                $invoice->customFields()->createMany($attributes['customFields']);
            });
        } catch (UniqueConstraintViolationException) {
            $message = "Invoice number {$attributes['invoice']['number']} is already used by another invoice";

            return ApiError::response(409, $message, ['number' => $message]);
        }

        return $this->withTotals($invoice->refresh(), $status);
    }

    private function withTotals(Invoice $invoice, int $status = 200): JsonResponse
    {
        $invoice->loadMissing('lineItems', 'customFields');

        return response()->json(['invoice' => new InvoiceResource($invoice), 'totals' => $invoice->totals()], $status);
    }
}
