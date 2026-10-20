<?php

namespace App\Http;

use Illuminate\Http\JsonResponse;

/** Every API error uses one shape: { error: { message, fieldErrors? } } (frontend: ApiErrorBody). */
final class ApiError
{
    /** @param  array<string, string>|null  $fieldErrors */
    public static function response(int $status, string $message, ?array $fieldErrors = null): JsonResponse
    {
        $error = ['message' => $message];
        if ($fieldErrors) {
            $error['fieldErrors'] = $fieldErrors;
        }

        return response()->json(['error' => $error], $status);
    }
}
