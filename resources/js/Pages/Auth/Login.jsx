import { useState, useEffect } from "react";
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head } from '@inertiajs/react';

export default function Login({ status }) {
    const [mobile, setMobile] = useState("");
    const [otp, setOtp] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [timer, setTimer] = useState(0);
    const [message, setMessage] = useState("");

    function getCookie(name) {
        let cookieArr = document.cookie.split(";");
        for (let cookie of cookieArr) {
            let [key, val] = cookie.split("=");
            if (name === key.trim()) return decodeURIComponent(val);
        }
        return null;
    }

    const startTimer = () => {
        setTimer(30);
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const sendOtp = async () => {
        await fetch("/sanctum/csrf-cookie", { credentials: "include" });
        try {
            setProcessing(true);
            setError("");
            const res = await fetch("/send-otp", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-XSRF-TOKEN": decodeURIComponent(getCookie("XSRF-TOKEN")),
                },
                body: JSON.stringify({ mobile }),
            });

            const data = await res.json();
            setProcessing(false);

            if (!res.ok) {
                setError(data.message || "Failed to send OTP");
                return;
            }

            setMessage(data.message);
            setIsOtpSent(true);
            startTimer();

        } catch {
            setError("Something went wrong");
        }
    };

    const verifyOtp = async () => {
        await fetch("/sanctum/csrf-cookie", { credentials: "include" });

        try {
            setProcessing(true);
            setError("");

            const res = await fetch("/verify-otp", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-XSRF-TOKEN": decodeURIComponent(getCookie("XSRF-TOKEN")),
                },
                body: JSON.stringify({ mobile, otp }),
            });

            const data = await res.json();
            setProcessing(false);

            if (!res.ok) {
                setError(data.message || "Invalid OTP");
                return;
            }

            setMessage("Login Successful! Redirecting...");
            setTimeout(() => {
                window.location.href = data.redirect || "/dashboard";
            }, 1000);

        } catch {
            setError("Something went wrong");
        }
    };

    return (
        <GuestLayout>
            <Head title="Login with OTP" />

            {message && <div className="bg-green-100 text-green-700 p-2 rounded mb-2">{message}</div>}
            {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-2">{error}</div>}

            {/* Mobile Field */}
            {!isOtpSent && (
                <div>
                    <InputLabel htmlFor="mobile" value="Mobile Number" />
                    <TextInput
                        id="mobile"
                        type="text"
                        value={mobile}
                        className="mt-1 block w-full"
                        onChange={(e) => setMobile(e.target.value)}
                        autoFocus
                    />
                </div>
            )}

            {/* OTP Field */}
            {isOtpSent && (
                <div className="mt-4">
                    <InputLabel htmlFor="otp" value="OTP" />
                    <TextInput
                        id="otp"
                        type="text"
                        value={otp}
                        className="mt-1 block w-full"
                        onChange={(e) => setOtp(e.target.value)}
                    />
                </div>
            )}

            <div className="mt-4 flex items-center justify-end">
                {!isOtpSent ? (
                    <PrimaryButton disabled={processing || !mobile} onClick={sendOtp}>
                        {processing ? "Sending..." : "Send OTP"}
                    </PrimaryButton>
                ) : (
                    <PrimaryButton disabled={processing || !otp} onClick={verifyOtp}>
                        {processing ? "Verifying..." : "Verify & Login"}
                    </PrimaryButton>
                )}
            </div>

            {isOtpSent && (
                <div className="mt-3 text-center text-sm">
                    {timer > 0 ? (
                        <span className="text-gray-600">Resend OTP in {timer}s</span>
                    ) : (
                        <button onClick={sendOtp} className="text-blue-700 underline">
                            Resend OTP
                        </button>
                    )}
                </div>
            )}
        </GuestLayout>
    );
}
