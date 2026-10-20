<?php

namespace Tests\Feature;

use App\Mail\InvoiceMail;
use App\Models\Invoice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

// Runs the real API against an in-memory SQLite database (see phpunit.xml).
// No email is ever sent: the mailer is "array" or faked.
class InvoiceApiTest extends TestCase
{
    use RefreshDatabase;

    private const VALID = [
        'number' => 'INV-0001',
        'issueDate' => '2026-10-20',
        'dueDate' => '2026-11-19',
        'businessName' => 'Acme Studio',
        'businessEmail' => 'hello@acme.test',
        'businessAddress' => '',
        'customerName' => 'Bright Solutions',
        'customerEmail' => 'billing@bright.test',
        'customerAddress' => '',
        'notes' => '',
        'discountCents' => 1000,
        'taxRateBps' => 1000,
        'lineItems' => [['description' => 'Design', 'quantityHundredths' => 200, 'unitPriceCents' => 5000]],
        'customFields' => [['label' => 'PO', 'value' => '123', 'visible' => false]],
    ];

    private function createInvoice(array $overrides = []): string
    {
        return $this->postJson('/api/invoices', [...self::VALID, ...$overrides])->assertCreated()->json('invoice.id');
    }

    #[Test]
    public function it_reports_health(): void
    {
        $this->getJson('/api/health')->assertOk()->assertExactJson(['ok' => true]);
    }

    #[Test]
    public function it_creates_an_invoice_with_server_calculated_totals_of_99(): void
    {
        $this->postJson('/api/invoices', self::VALID)
            ->assertCreated()
            ->assertJsonPath('totals.totalCents', 9900)
            ->assertJsonPath('totals.lineTotalsCents', [10000])
            ->assertJsonPath('invoice.number', 'INV-0001')
            ->assertJsonPath('invoice.issueDate', '2026-10-20')
            ->assertJsonPath('invoice.businessAddress', '')
            ->assertJsonPath('invoice.lineItems', self::VALID['lineItems'])
            ->assertJsonPath('invoice.customFields', self::VALID['customFields'])
            ->assertJsonPath('invoice.lastSentAt', null);
    }

    #[Test]
    public function it_lists_invoices_with_iso_dates(): void
    {
        $this->createInvoice();

        $response = $this->getJson('/api/invoices')->assertOk()->assertJsonCount(1, 'invoices');
        $response->assertJsonPath('invoices.0.number', 'INV-0001')
            ->assertJsonPath('invoices.0.totalCents', 9900)
            ->assertJsonPath('invoices.0.itemCount', 1)
            ->assertJsonPath('invoices.0.lastSentAt', null);
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/', $response->json('invoices.0.updatedAt'));
    }

    #[Test]
    public function it_gets_one_invoice_and_404s_for_unknown_ids(): void
    {
        $id = $this->createInvoice();

        $this->getJson("/api/invoices/{$id}")->assertOk()->assertJsonPath('invoice.id', $id);
        $this->getJson('/api/invoices/missing')->assertNotFound()->assertExactJson(['error' => ['message' => 'Invoice not found']]);
        $this->getJson('/api/nothing-here')->assertNotFound()->assertJsonPath('error.message', 'Not found');
    }

    #[Test]
    public function it_updates_an_invoice_and_replaces_its_line_items(): void
    {
        $id = $this->createInvoice();
        $lines = [
            ['description' => 'Design', 'quantityHundredths' => 100, 'unitPriceCents' => 5000],
            ['description' => 'Build', 'quantityHundredths' => 150, 'unitPriceCents' => 8000],
        ];

        $this->putJson("/api/invoices/{$id}", [...self::VALID, 'taxRateBps' => 0, 'lineItems' => $lines, 'customFields' => []])
            ->assertOk()
            ->assertJsonPath('totals.totalCents', 16000)
            ->assertJsonPath('invoice.lineItems', $lines)
            ->assertJsonPath('invoice.customFields', []);
        $this->putJson('/api/invoices/missing', self::VALID)->assertNotFound();
    }

    #[Test]
    public function it_suggests_the_next_invoice_number_and_sender(): void
    {
        $this->getJson('/api/invoices/defaults')->assertOk()->assertJsonPath('number', 'INV-0001')->assertJsonPath('business', null);

        $this->createInvoice();

        $this->getJson('/api/invoices/defaults')
            ->assertOk()
            ->assertJsonPath('number', 'INV-0002')
            ->assertJsonPath('business.businessName', 'Acme Studio')
            ->assertJsonPath('issueDate', today()->toDateString())
            ->assertJsonPath('dueDate', today()->addDays(30)->toDateString());
    }

    #[Test]
    public function it_rejects_a_duplicate_invoice_number_with_409(): void
    {
        $this->createInvoice();
        $otherId = $this->createInvoice(['number' => 'INV-0002']);

        $message = 'Invoice number INV-0001 is already used by another invoice';
        $this->postJson('/api/invoices', self::VALID)->assertStatus(409)->assertJsonPath('error.fieldErrors.number', $message);
        $this->putJson("/api/invoices/{$otherId}", self::VALID)->assertStatus(409);
    }

    #[Test]
    public function it_rejects_negative_tax_and_a_discount_above_the_subtotal_with_field_errors(): void
    {
        $this->postJson('/api/invoices', [...self::VALID, 'taxRateBps' => -1, 'discountCents' => 20000])
            ->assertStatus(400)
            ->assertJsonPath('error.fieldErrors.taxRateBps', "Tax can't be negative")
            ->assertJsonPath('error.fieldErrors.discountCents', "Discount can't exceed the subtotal ($100.00)");
    }

    #[Test]
    public function it_rejects_negatives_fractional_cents_and_bad_dates(): void
    {
        $line = self::VALID['lineItems'][0];
        $cases = [
            'discountCents' => [['discountCents' => -1], "Discount can't be negative"],
            'lineItems.0.quantityHundredths' => [['lineItems' => [[...$line, 'quantityHundredths' => -100]]], 'Quantity must be more than 0'],
            'lineItems.0.unitPriceCents' => [['lineItems' => [[...$line, 'unitPriceCents' => -1]]], "Price can't be negative"],
            'dueDate' => [['dueDate' => '2026-10-01'], "Due date can't be before the issue date"],
            'lineItems' => [['lineItems' => []], 'Add at least one line item'],
            'customerEmail' => [['customerEmail' => 'not-an-email'], 'Enter a valid email address'],
            'customFields.0.label' => [['customFields' => [['label' => ' ', 'value' => '', 'visible' => true]]], 'Add a label'],
        ];

        foreach ($cases as $field => [$overrides, $message]) {
            // Field keys contain dots ("lineItems.0.unitPriceCents"), so read them directly.
            $fieldErrors = $this->postJson('/api/invoices', [...self::VALID, ...$overrides])->assertStatus(400)->json('error.fieldErrors');
            $this->assertSame($message, $fieldErrors[$field] ?? null, $field);
        }
        $this->postJson('/api/invoices', [...self::VALID, 'discountCents' => 1.5])
            ->assertStatus(400)
            ->assertJsonValidationErrorFor('discountCents', 'error.fieldErrors');
        $this->assertSame(0, Invoice::count());
    }

    #[Test]
    public function it_rejects_malformed_json(): void
    {
        $this->call('POST', '/api/invoices', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'], '{bad')
            ->assertStatus(400)
            ->assertExactJson(['error' => ['message' => 'Request body must be valid JSON']]);
    }

    #[Test]
    public function it_validates_the_email_request_then_reports_missing_mail_settings(): void
    {
        $id = $this->createInvoice();

        $this->postJson("/api/invoices/{$id}/email", ['to' => 'nope', 'subject' => 'Hi', 'message' => ''])
            ->assertStatus(400)
            ->assertJsonPath('error.fieldErrors.to', 'Enter a valid recipient email');
        $this->postJson("/api/invoices/{$id}/email", ['to' => 'me@example.com', 'subject' => 'Hi', 'message' => ''])
            ->assertStatus(503)
            ->assertJsonPath('error.message', fn (string $message) => str_contains($message, "isn't configured"));
    }

    #[Test]
    public function it_emails_the_saved_invoice_and_marks_it_sent(): void
    {
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => 'smtp.example.com',
            'mail.mailers.smtp.username' => 'user',
            'mail.mailers.smtp.password' => 'secret',
            'mail.from.address' => 'invoices@example.com',
        ]);
        Mail::fake();
        $id = $this->createInvoice(['customFields' => [
            ['label' => 'PO', 'value' => 'PO-1', 'visible' => true],
            ['label' => 'Internal', 'value' => 'hidden-ref', 'visible' => false],
        ]]);

        $sentAt = $this->postJson("/api/invoices/{$id}/email", ['to' => 'me@example.com', 'subject' => 'Invoice INV-0001', 'message' => "Hello\n<b>there</b>"])
            ->assertOk()
            ->json('sentAt');

        $this->assertNotNull($sentAt);
        $this->getJson('/api/invoices')->assertJsonPath('invoices.0.lastSentAt', $sentAt);
        Mail::assertSent(InvoiceMail::class, function (InvoiceMail $mail) use ($id) {
            $html = $mail->render();

            return $mail->hasTo('me@example.com')
                && $mail->hasSubject('Invoice INV-0001')
                && str_contains($html, '$99.00')
                && str_contains($html, 'PO-1')
                && ! str_contains($html, 'hidden-ref')
                && str_contains($html, 'Hello<br />')
                && str_contains($html, '&lt;b&gt;there&lt;/b&gt;')
                && str_contains($html, "/invoices/edit/?id={$id}");
        });
    }
}
