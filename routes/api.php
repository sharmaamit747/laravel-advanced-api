<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MobileAuthController;

Route::post('/send-otp', [MobileAuthController::class, 'sendOtp']);
Route::post('/verify-otp', [MobileAuthController::class, 'verifyOtp']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [MobileAuthController::class, 'logout']);
    Route::get('/profile', fn(Request $req) => $req->user());
});