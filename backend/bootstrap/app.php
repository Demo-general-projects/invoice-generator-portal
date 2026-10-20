<?php

use App\Http\ApiError;
use App\Http\Middleware\RejectInvalidJson;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Optional invoice fields are empty strings, not null, in the API contract.
        $middleware->convertEmptyStringsToNull(except: [fn (Request $request) => $request->is('api/*')]);
        $middleware->api(prepend: [RejectInvalidJson::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // API errors always use { error: { message, fieldErrors? } }, which the frontend reads.
        $exceptions->render(function (ValidationException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }
            $fieldErrors = array_map(fn (array $messages) => $messages[0], $e->errors());

            return ApiError::response(400, $e->validator->errors()->first(), $fieldErrors);
        });

        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }
            $model = $e->getPrevious() instanceof ModelNotFoundException ? $e->getPrevious()->getModel() : null;

            return ApiError::response(404, $model ? class_basename($model).' not found' : 'Not found');
        });

        $exceptions->render(function (HttpExceptionInterface $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }
            $status = $e->getStatusCode();

            return ApiError::response($status, $e->getMessage() ?: (Response::$statusTexts[$status] ?? 'Request failed'));
        });

        $exceptions->render(function (Throwable $e, Request $request) {
            return $request->is('api/*') ? ApiError::response(500, 'Something went wrong on the server') : null;
        });
    })->create();
