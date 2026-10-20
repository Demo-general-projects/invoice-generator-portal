<?php

namespace App\Http\Middleware;

use App\Http\ApiError;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Laravel silently treats a malformed JSON body as empty, which would surface
 * as confusing "field is required" errors. Answer with a clear 400 instead.
 */
class RejectInvalidJson
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isJson() && $request->getContent() !== '' && ! json_validate($request->getContent())) {
            return ApiError::response(400, 'Request body must be valid JSON');
        }

        return $next($request);
    }
}
