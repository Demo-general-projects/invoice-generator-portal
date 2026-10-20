<?php

use App\Http\Controllers\FrontendController;
use Illuminate\Support\Facades\Route;

// The invoice app is the frontend's static build, copied into public/app by
// `php artisan frontend:build`. The web server serves those files directly;
// this route covers paths it can't resolve on its own.
Route::redirect('/', '/app/invoices/');
Route::get('/app/{path?}', FrontendController::class)->where('path', '.*');
