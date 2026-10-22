<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Business settings (one row) that prefill new invoices, plus the template and
// phone number each invoice stores so it reopens exactly as it was saved.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_settings', function (Blueprint $table) {
            $table->id();
            $table->string('business_name')->default('');
            $table->string('business_email')->default('');
            $table->string('business_phone')->default('');
            $table->text('business_address')->default('');
            $table->string('default_template')->default('classic');
            $table->unsignedInteger('default_tax_rate_bps')->default(0);
            $table->text('default_notes')->default('');
            $table->timestamps(precision: 3);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->string('template')->default('classic');
            $table->string('business_phone')->default('');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['template', 'business_phone']);
        });
        Schema::dropIfExists('business_settings');
    }
};
