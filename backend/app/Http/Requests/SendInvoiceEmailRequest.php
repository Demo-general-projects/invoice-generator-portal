<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** The body only chooses recipient, subject and message; the invoice itself comes from the database. */
class SendInvoiceEmailRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'to' => ['required', 'string', 'email'],
            'subject' => ['required', 'string', 'max:200'],
            'message' => ['present', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'to.*' => 'Enter a valid recipient email',
            'subject.required' => 'Add a subject',
            'message.max' => 'Keep the message under 1000 characters',
        ];
    }
}
