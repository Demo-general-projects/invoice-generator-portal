<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Serves a page of the static frontend build in public/app, e.g. /app/invoices
 * -> public/app/invoices/index.html, for servers that don't map directories to
 * their index.html themselves.
 */
class FrontendController extends Controller
{
    public function __invoke(string $path = ''): BinaryFileResponse|Response
    {
        $root = public_path('app');
        if (! is_file("{$root}/index.html")) {
            return response('The frontend has not been built yet. Run "php artisan frontend:build".', 404)
                ->header('Content-Type', 'text/plain');
        }

        $page = realpath("{$root}/".trim($path, '/').'/index.html');
        if ($page !== false && str_starts_with($page, realpath($root).DIRECTORY_SEPARATOR)) {
            return response()->file($page, ['Content-Type' => 'text/html; charset=utf-8']);
        }

        return response()->file("{$root}/404.html", ['Content-Type' => 'text/html; charset=utf-8'])->setStatusCode(404);
    }
}
