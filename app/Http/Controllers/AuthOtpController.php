<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;


class AuthOtpController extends Controller
{
    public function sendOtp(Request $request)
    {
        $request->validate(['mobile' => 'required']);

        $otp = rand(100000, 999999);
        Cache::put('otp_' . $request->mobile, $otp, now()->addMinutes(5));

        $url = 'https://2factor.in/API/V1/a94f102f-82db-11ea-9fa5-0200cd936042/SMS/' . $request->mobile . '/' . $otp . '/RANKTOP';
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        $err = curl_error($ch);  //if you need
        curl_close($ch);
        if ($response) {
            return response()->json(data: [
                'status' => true,
                'message' => 'OTP sent to your mobile number',
                'showOtp' => true,
                'mobile' => $request->mobile,
                'expires_in' => 30 // 30 sec resend timer
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Invalid mobile number or request blocked'
            ], 422);

        }
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'mobile' => 'required',
            'otp' => 'required'
        ]);

        if (Cache::get('otp_' . $request->mobile) != $request->otp) {
            return response()->json([
                'status' => false,
                'message' => 'Incorrect OTP. Try again!'
            ], 422);
        }

        $user = User::firstOrCreate(
            ['mobile' => $request->mobile],
            ['name' => 'User' . rand(1000, 9999)]
        );

        Auth::login($user);

        return response()->json([
            'type' => 'success',
            'message' => 'Login successfully'
        ]);

    }
}
