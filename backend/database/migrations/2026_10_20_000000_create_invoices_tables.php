<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Money is stored as integer cents, quantity as hundredths and tax as basis
// points so no floating-point value ever touches a calculation.
// Totals are derived (see app/Domain/Totals.php), never stored.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('number')->unique();
            $table->date('issue_date'); // read back as "YYYY-MM-DD", no time or timezone
            $table->date('due_date');
            $table->string('business_name');
            $table->string('business_email')->default('');
            $table->text('business_address')->default('');
            $table->string('customer_name');
            $table->string('customer_email')->default('');
            $table->text('customer_address')->default('');
            $table->text('notes')->default('');
            $table->unsignedBigInteger('discount_cents')->default(0);
            $table->unsignedInteger('tax_rate_bps')->default(0); // 10% = 1000
            $table->timestamp('last_sent_at', precision: 3)->nullable();
            $table->timestamps(precision: 3);
        });

        Schema::create('line_items', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('invoice_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('position');
            $table->string('description');
            $table->unsignedBigInteger('quantity_hundredths'); // 1.5 = 150
            $table->unsignedBigInteger('unit_price_cents');
        });

        Schema::create('custom_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('invoice_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('position');
            $table->string('label');
            $table->string('value');
            $table->boolean('visible')->default(true);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_fields');
        Schema::dropIfExists('line_items');
        Schema::dropIfExists('invoices');
    }
};
