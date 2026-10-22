<?php

use App\Http\Controllers\BusinessSettingsController;
use App\Http\Controllers\InvoiceController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => ['ok' => true]);

Route::get('/settings', [BusinessSettingsController::class, 'show']);
Route::put('/settings', [BusinessSettingsController::class, 'update']);

Route::controller(InvoiceController::class)->prefix('invoices')->group(function () {
    Route::get('/', 'index');
    Route::get('/defaults', 'defaults');
    Route::post('/', 'store');
    Route::get('/{invoice}', 'show');
    Route::put('/{invoice}', 'update');
    Route::post('/{invoice}/email', 'email');
});
