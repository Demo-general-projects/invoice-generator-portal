<?php

namespace App\Http\Controllers;

use App\Http\Requests\BusinessSettingsRequest;
use App\Models\BusinessSettings;
use Illuminate\Http\JsonResponse;

class BusinessSettingsController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(['settings' => BusinessSettings::current()->toApi()]);
    }

    public function update(BusinessSettingsRequest $request): JsonResponse
    {
        $settings = BusinessSettings::current();
        $settings->fill($request->toAttributes())->save();

        return response()->json(['settings' => $settings->refresh()->toApi()]);
    }
}
