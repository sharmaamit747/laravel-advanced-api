<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthOtpController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

Route::get('/', fn() => Inertia::render('Auth/Login'))->name('login');

Route::post('/check-user', [AuthOtpController::class, 'checkUser']);
Route::post('/login-password', [AuthOtpController::class, 'loginPassword']);
Route::post('/register', [AuthOtpController::class, 'register']);
Route::post('/verify-registration-otp', [AuthOtpController::class, 'verifyRegistrationOtp']);
Route::post('/verify-login-otp', [AuthOtpController::class, 'verifyLoginOtp']);
Route::post('/resend-otp', [AuthOtpController::class, 'resendOtp']);
Route::post('/otp-login', [AuthOtpController::class, 'loginOtp']);


// Forgot Password Page
Route::get('/forgot-password', [PasswordResetLinkController::class, 'create'])
        ->middleware('guest')
        ->name('password.request');

// Send Reset Link Email
Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])
        ->middleware('guest')
        ->name('password.email');

// Reset Password Form
Route::get('/reset-password/{token}', [NewPasswordController::class, 'create'])
        ->middleware('guest')
        ->name('password.reset');

// Update Password (Submit)
Route::post('/reset-password', [NewPasswordController::class, 'store'])
        ->middleware('guest')
        ->name('password.update');

Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard')->middleware('auth');
Route::get('/profile/edit', [ProfileController::class, 'edit'])->name('profile.edit')->middleware('auth');
Route::post('/logout', function () {
    Auth::logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();

    return redirect('/');
})->name('logout');
