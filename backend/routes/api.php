<?php

use App\Http\Controllers\InvoiceController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => ['ok' => true]);

Route::controller(InvoiceController::class)->prefix('invoices')->group(function () {
    Route::get('/', 'index');
    Route::get('/defaults', 'defaults');
    Route::post('/', 'store');
    Route::get('/{invoice}', 'show');
    Route::put('/{invoice}', 'update');
    Route::post('/{invoice}/email', 'email');
});
