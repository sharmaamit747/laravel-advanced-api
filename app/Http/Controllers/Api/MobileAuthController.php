<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MobileAuthController extends Controller
{
    public function sendOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mobile' => 'required|digits:10'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $otp = rand(100000, 999999);

        $user = User::updateOrCreate(
            ['mobile' => $request->mobile],
            [
                'otp' => $otp,
                'otp_expires_at' => Carbon::now()->addMinutes(5)
            ]
        );

        // 🔥 For now - mock SMS response
        // Later integrate Twilio / MSG91
        return response()->json([
            'message' => 'OTP sent successfully',
            'otp' => $otp  // ❗ remove in production
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mobile' => 'required|digits:10',
            'otp'    => 'required|digits:6'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::where('mobile', $request->mobile)
            ->where('otp', $request->otp)
            ->where('otp_expires_at', '>', Carbon::now())
            ->first();

        if(!$user){
            return response()->json(['message' => 'Invalid or expired OTP'], 401);
        }

        $token = $user->createToken('authToken')->plainTextToken;

        // Clear OTP after success
        $user->update([
            'otp' => null,
            'otp_expires_at' => null
        ]);

        return response()->json([
            'message' => 'OTP verified',
            'token' => $token,
            'user' => $user
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Logged out']);
    }
}
