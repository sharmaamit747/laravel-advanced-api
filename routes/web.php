<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthOtpController;
use Inertia\Inertia;

Route::get('/', fn() => Inertia::render('Auth/Login'))->name('login');

Route::post('/send-otp', [AuthOtpController::class, 'sendOtp'])->name('send.otp');
Route::post('/verify-otp', [AuthOtpController::class, 'verifyOtp'])->name('validate.otp');

Route::middleware('auth')->get('/dashboard', fn() => Inertia::render('Dashboard'))->name('dashboard');

