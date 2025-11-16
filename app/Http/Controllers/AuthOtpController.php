<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str; 
use App\Models\User;

class AuthOtpController extends Controller
{
    // -------------------------
    // Helper: Send OTP
    // -------------------------
    protected function sendOtp($receiver, $otp)
    {
        $isEmail  = filter_var($receiver, FILTER_VALIDATE_EMAIL);
        $isMobile = preg_match('/^[0-9]{10}$/', $receiver);

        // Send Mobile OTP (2Factor)
        if ($isMobile) {
            $url = "https://2factor.in/API/V1/a94f102f-82db-11ea-9fa5-0200cd936042/SMS/{$receiver}/{$otp}/RANKTOP";

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            $response = curl_exec($ch);
            curl_close($ch);

            if ($response === false) {
                return false;
            }
        }

        // Send Email OTP
        if ($isEmail) {
            try {
                Mail::send('emails.otp', ['otp' => $otp], function ($msg) use ($receiver) {
                    $msg->to($receiver)
                        ->subject('Your OTP Code');
                });
            } catch (\Exception $e) {
                return false;
            }
        }

        return true;
    }


    // -------------------------
    // STEP 1: Check existing user
    // -------------------------
    public function checkUser(Request $request)
    {
        $request->validate([
            'mobile_or_email' => [
                'required',
                'string',
                function ($attribute, $value, $fail) {
                    $isMobile = preg_match('/^(?:\+91|0)?[6-9]\d{9}$/', $value);
                    $isEmail = filter_var($value, FILTER_VALIDATE_EMAIL);

                    if (!$isMobile && !$isEmail) {
                        $fail('The :attribute must be a valid Indian mobile number or email address.');
                    }
                }
            ],
        ]);

        $exists = User::where('email', $request->mobile_or_email)
                      ->orWhere('mobile', $request->mobile_or_email)
                      ->exists();
        $field = filter_var($request->mobile_or_email, FILTER_VALIDATE_EMAIL)
            ? 'email'
            : 'mobile';

        return response()->json(['exists' => $exists, 'type' => $field]);
    }


    // -------------------------
    // STEP 2: Login using Password
    // -------------------------
    public function loginPassword(Request $request)
    {
        $request->validate([
            'mobile_or_email' => [
                'required',
                'string',
                function ($attribute, $value, $fail) {
                    $isMobile = preg_match('/^(?:\+91|0)?[6-9]\d{9}$/', $value);
                    $isEmail = filter_var($value, FILTER_VALIDATE_EMAIL);

                    if (!$isMobile && !$isEmail) {
                        $fail('The :attribute must be a valid Indian mobile number or email address.');
                    }
                }
            ],
            'password'        => 'required|string'
        ]);

        $field = filter_var($request->mobile_or_email, FILTER_VALIDATE_EMAIL)
            ? 'email'
            : 'mobile';

        if (!Auth::attempt([$field => $request->mobile_or_email, 'password' => $request->password])) {
            return response()->json([
                'status'  => false,
                'message' => 'Invalid credentials'
            ], 422);
        }

        $request->session()->regenerate();

        return response()->json([
            'status'   => true,
            'message'  => 'Login successful',
            'redirect' => '/dashboard'
        ]);
    }


    // -------------------------
    // STEP 3: Register -> Send OTP
    // -------------------------
    public function register(Request $request)
    {
        $request->validate([
            'name'            => 'required|string|max:100',
            'mobile_or_email' => [
                'required',
                'string',
                function ($attribute, $value, $fail) {
                    $isMobile = preg_match('/^(?:\+91|0)?[6-9]\d{9}$/', $value);
                    $isEmail = filter_var($value, FILTER_VALIDATE_EMAIL);

                    if (!$isMobile && !$isEmail) {
                        $fail('The :attribute must be a valid Indian mobile number or email address.');
                    }
                }
            ],
            'password'        => 'required|min:6'
        ]);

        $receiver = $request->mobile_or_email;
        $isEmail  = filter_var($receiver, FILTER_VALIDATE_EMAIL);
        $isMobile = preg_match('/^[0-9]{10}$/', $receiver);

        if (!$isEmail && !$isMobile) {
            return response()->json([
                'status'  => false,
                'message' => 'Enter a valid email or 10-digit mobile number'
            ], 422);
        }

        if (User::where('email', $receiver)->orWhere('mobile', $receiver)->exists()) {
            return response()->json([
                'status'  => false,
                'message' => 'User already exists'
            ], 422);
        }

        $otp = rand(100000, 999999);

        session([
            'reg_data' => $request->only('name', 'mobile_or_email', 'password')
        ]);

        Cache::put('otp_' . $receiver, $otp, now()->addMinutes(5));

        $sent = $this->sendOtp($receiver, $otp);

        if (!$sent) {
            return response()->json([
                'status'  => false,
                'message' => 'Failed to send OTP'
            ], 422);
        }

        return response()->json([
            'status'     => true,
            'message'    => 'OTP sent successfully',
            'receiver'   => $receiver,
            'expires_in' => 30
        ]);
    }


    // -------------------------
    // STEP 4: Verify OTP & Create Account
    // -------------------------
    public function verifyRegistrationOtp(Request $request)
    {
        $request->validate([
            'mobile_or_email' => 'required|string',
            'otp'             => 'required|digits:6'
        ]);

        $receiver = $request->mobile_or_email;
        $otp      = $request->otp;

        $cachedOtp = Cache::get('otp_' . $receiver);

        if (!$cachedOtp || $cachedOtp != $otp) {
            return response()->json([
                'status'  => false,
                'message' => 'Invalid or expired OTP'
            ], 422);
        }

        $data = session('reg_data');

        if (!$data) {
            return response()->json([
                'status'  => false,
                'message' => 'Session expired. Try again.'
            ], 422);
        }

        $user = User::create([
            'name'     => $data['name'],
            'password' => Hash::make($data['password']),
            'email'    => filter_var($data['mobile_or_email'], FILTER_VALIDATE_EMAIL)
                            ? $data['mobile_or_email']
                            : null,
            'mobile'   => preg_match('/^[0-9]{10}$/', $data['mobile_or_email'])
                            ? $data['mobile_or_email']
                            : null,
        ]);

        Auth::login($user);
        request()->session()->regenerate();

        Cache::forget('otp_' . $receiver);
        session()->forget('reg_data');

        return response()->json([
            'status'   => true,
            'message'  => 'Account created successfully',
            'redirect' => '/dashboard'
        ]);
    }


    // -------------------------
    // NEW: Resend OTP API
    // -------------------------
    public function resendOtp(Request $request)
    {
        $request->validate([
            'mobile_or_email' => 'required|string'
        ]);

        $receiver = $request->mobile_or_email;

        $otp = rand(100000, 999999);

        Cache::put('otp_' . $receiver, $otp, now()->addMinutes(5));

        $sent = $this->sendOtp($receiver, $otp);

        if (!$sent) {
            return response()->json([
                'status'  => false,
                'message' => 'Failed to resend OTP'
            ], 422);
        }

        return response()->json([
            'status'     => true,
            'message'    => 'OTP resent successfully',
            'expires_in' => 30
        ]);
    }

    // -------------------------
    // NEW: Login OTP API
    // -------------------------
    public function loginOtp(Request $request)
    {
        $request->validate([
            'mobile_or_email' => 'required|string'
        ]);

        $receiver = $request->mobile_or_email;

        $otp = rand(100000, 999999);

        Cache::put('otp_' . $receiver, $otp, now()->addMinutes(5));

        $sent = $this->sendOtp($receiver, $otp);

        if (!$sent) {
            return response()->json([
                'status'  => false,
                'message' => 'Failed to resend OTP'
            ], 422);
        }

        return response()->json([
            'status'     => true,
            'message'    => 'OTP resent successfully',
            'expires_in' => 30
        ]);
    }

    // -------------------------
    // STEP : Verify OTP & Login
    // -------------------------
    public function verifyLoginOtp(Request $request)
    {
        $request->validate([
            'mobile_or_email' => 'required|string',
            'otp'             => 'required|digits:6'
        ]);

        $receiver = $request->mobile_or_email;
        $otp      = $request->otp;

        $cachedOtp = Cache::get('otp_' . $receiver);

        if (!$cachedOtp || $cachedOtp != $otp) {
            return response()->json([
                'status'  => false,
                'message' => 'Invalid or expired OTP'
            ], 422);
        }

        // -------------------------------
        // Identify Email or Mobile
        // -------------------------------
        $email  = filter_var($receiver, FILTER_VALIDATE_EMAIL) ? $receiver : null;
        $mobile = preg_match('/^[0-9]{10}$/', $receiver) ? $receiver : null;

        // -------------------------------
        // Find Existing User
        // -------------------------------
        $user = User::where(function ($q) use ($email, $mobile) {
            if ($email)  $q->orWhere('email', $email);
            if ($mobile) $q->orWhere('mobile', $mobile);
        })->first();

        // -------------------------------
        // If user not found → create automatically
        // -------------------------------
        if (!$user) {
            $user = User::create([
                'name'     => 'User ' . rand(1000, 9999), // default name
                'email'    => $email,
                'mobile'   => $mobile,
                'password' => Hash::make(Str::random(12)), // random password
            ]);
        }

        // -------------------------------
        // Login user
        // -------------------------------
        Auth::login($user);
        request()->session()->regenerate();

        // Clear OTP
        Cache::forget('otp_' . $receiver);

        return response()->json([
            'status'   => true,
            'message'  => 'Login successful',
            'redirect' => '/dashboard'
        ]);
    }
}