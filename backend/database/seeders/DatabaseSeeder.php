<?php

namespace Database\Seeders;

use App\Models\Invoice;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /** Seeds one fictional invoice (the brief's $99.00 example) so the app has something to show on first run. */
    public function run(): void
    {
        if (Invoice::where('number', 'INV-0001')->exists()) {
            $this->command?->info('Seed invoice already exists, skipping.');

            return;
        }

        $invoice = Invoice::create([
            'number' => 'INV-0001',
            'issue_date' => '2026-10-20',
            'due_date' => '2026-11-19',
            'business_name' => 'Acme Studio',
            'business_email' => 'hello@acmestudio.example',
            'business_address' => "123 Creative Street\nSan Francisco, CA 94105",
            'customer_name' => 'Bright Solutions Ltd.',
            'customer_email' => 'billing@brightsolutions.example',
            'customer_address' => "456 Market Street\nNew York, NY 10001",
            'notes' => 'Thank you for your business. Payment is due within 30 days by bank transfer.',
            'discount_cents' => 1000,
            'tax_rate_bps' => 1000,
        ]);
        $invoice->lineItems()->create([
            'position' => 0,
            'description' => 'Brand strategy workshop',
            'quantity_hundredths' => 200,
            'unit_price_cents' => 5000,
        ]);
        $invoice->customFields()->createMany([
            ['position' => 0, 'label' => 'PO number', 'value' => 'PO-12345', 'visible' => true],
            ['position' => 1, 'label' => 'Project', 'value' => 'Website redesign', 'visible' => true],
            ['position' => 2, 'label' => 'Internal ref', 'value' => 'ACME-Q4-17', 'visible' => false],
        ]);
    }
}
