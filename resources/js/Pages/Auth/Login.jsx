import { useState } from "react";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import SmallParagraph from "@/Components/SmallParagraph";
import Heading from "@/Components/Heading";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head } from "@inertiajs/react";

export default function Login() {
    const [mobile, setMobile] = useState("");
    const [otp, setOtp] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");

    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [timer, setTimer] = useState(0);
    const [type, setType] = useState("");

    const [step, setStep] = useState("enter"); // enter -> login-password -> register -> otp-verify

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

    const csrf = () =>
        fetch("/sanctum/csrf-cookie", { credentials: "include" });

    // STEP 1: Check user
    const checkUser = async () => {
        await csrf();
        setProcessing(true);
        setError("");

        const res = await fetch("/check-user", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-XSRF-TOKEN": decodeURIComponent(getCookie("XSRF-TOKEN")),
            },
            body: JSON.stringify({ mobile_or_email: mobile }),
        });

        const data = await res.json();
        setProcessing(false);
        if (data.exists) {
            setType(data.type);
            setStep("login-password");
        } else {
            setType(data.type);
            setStep("new-user-confirm");   // ← NEW SCREEN HERE
        }
    };

    // STEP 2: Login with password
    const loginWithPassword = async () => {
        await csrf();
        setProcessing(true);
        setError("");

        const res = await fetch("/login-password", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-XSRF-TOKEN": decodeURIComponent(getCookie("XSRF-TOKEN")),
            },
            body: JSON.stringify({
                mobile_or_email: mobile,
                password,
            }),
        });

        const data = await res.json();
        setProcessing(false);

        if (!res.ok) {
            setError(data.message || "Invalid credentials");
            return;
        }

        window.location.href = data.redirect || "/dashboard";
    };

    // STEP 3: Register and send OTP
    const registerUser = async () => {
        await csrf();
        setProcessing(true);
        setError("");

        const res = await fetch("/register", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-XSRF-TOKEN": decodeURIComponent(getCookie("XSRF-TOKEN")),
            },
            body: JSON.stringify({
                name,
                mobile_or_email: mobile,
                password,
            }),
        });

        const data = await res.json();
        setProcessing(false);

        if (!res.ok) {
            setError(data.message || "Failed to start registration");
            return;
        }

        setMessage(data.message);
        setStep("otp-verify");
        startTimer();
    };

    // ✅ NEW: Resend OTP API
    const resendOtp = async () => {
        await csrf();
        setProcessing(true);

        const res = await fetch("/resend-otp", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-XSRF-TOKEN": decodeURIComponent(getCookie("XSRF-TOKEN")),
            },
            body: JSON.stringify({ mobile_or_email: mobile }),
        });

        const data = await res.json();
        setProcessing(false);

        if (!res.ok) {
            setError(data.message || "Failed to resend OTP");
            return;
        }

        setMessage("OTP resent successfully");

        startTimer();
    };

    // STEP 4: Verify OTP
    const verifyRegistrationOtp = async () => {
        await csrf();
        setProcessing(true);
        setError("");

        const res = await fetch("/verify-registration-otp", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-XSRF-TOKEN": decodeURIComponent(getCookie("XSRF-TOKEN")),
            },
            body: JSON.stringify({ mobile_or_email: mobile, otp }),
        });

        const data = await res.json();
        setProcessing(false);

        if (!res.ok) {
            setError(data.message || "Invalid OTP");
            return;
        }

        window.location.href = data.redirect || "/dashboard";
    };

    // ✅ NEW: Login with OTP
    const loginWithOtp = async () => {
        await csrf();
        setProcessing(true);

        const res = await fetch("/otp-login", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-XSRF-TOKEN": decodeURIComponent(getCookie("XSRF-TOKEN")),
            },
            body: JSON.stringify({ mobile_or_email: mobile }),
        });

        const data = await res.json();
        setProcessing(false);

        if (!res.ok) {
            setError(data.message || "Failed to send OTP");
            return;
        }

        setMessage("OTP sent successfully");
        setStep("otp-login");
        startTimer();
    };

    // STEP 4: Verify OTP
    const verifyLoginOtp = async () => {
        await csrf();
        setProcessing(true);
        setError("");

        const res = await fetch("/verify-login-otp", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-XSRF-TOKEN": decodeURIComponent(getCookie("XSRF-TOKEN")),
            },
            body: JSON.stringify({ mobile_or_email: mobile, otp }),
        });

        const data = await res.json();
        setProcessing(false);

        if (!res.ok) {
            setError(data.message || "Invalid OTP");
            return;
        }

        window.location.href = data.redirect || "/dashboard";
    };

    return (
        <GuestLayout>


            {message && (
                <div className="bg-green-100 text-green-700 p-2 rounded mb-2">
                    {message}
                </div>
            )}
            {error && (
                <div className="bg-red-100 text-red-700 p-2 rounded mb-2">
                    {error}
                </div>
            )}

            {/* STEP 1 */}
            {step === "enter" && (
                <>
                    <Head title="Sign in or create account" />
                    <Heading as="h4" className="px-0 mb-5" title="Sign in or create account" />
                    <InputLabel value="Enter mobile number or email" />
                    <TextInput
                        className="mt-1 block w-full"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        autoFocus
                    />
                    <PrimaryButton
                        className="mt-4"
                        disabled={!mobile || processing}
                        onClick={checkUser}
                    >
                        {processing ? "Checking..." : "Continue"}
                    </PrimaryButton>
                    <SmallParagraph title="By continuing, you agree to YARA Codes Conditions of Use and Privacy Notice." className="my-4" />
                </>
            )}

            {/* STEP 2 */}
            {step === "login-password" && (
                <>
                    <Head title="Login using Password" />
                    <Heading as="h2" className="px-0 mb-5" title="Sign in" />
                    <div className="text-gray-700 mb-5">
                        <b>{type === "mobile" ? "IN + 91 " : ""}</b> {mobile}{" "}
                        <button
                            className="text-blue-600 underline ml-2"
                            onClick={() => setStep("enter")}
                        >
                            Change
                        </button>
                    </div>
                    <div className="row-flex m-0">
                        <div className="flex-item">
                            <Heading as="h6" className="px-0 mb-1" title="Password" />
                        </div>

                        <div className="flex-item right">
                            <a className="text-blue-600" href="forgot-password">Forgot password?</a>
                        </div>
                    </div>
                    <TextInput
                        type="password"
                        className="mt-1 block w-full"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <PrimaryButton
                        className="mt-4"
                        disabled={!password || processing}
                        onClick={loginWithPassword}
                    >
                        {processing ? "Logging in..." : "Login"}
                    </PrimaryButton>

                    <div className="or-container">
                        <span className="line"></span>
                        <span className="or-text">OR</span>
                        <span className="line"></span>
                    </div>

                    <PrimaryButton
                        className="mt-2 width-100 justify-center"
                        disabled={processing}
                        onClick={loginWithOtp}
                    >
                        {processing ? "OTP Sending..." : "Get an OTP on your phone"}
                    </PrimaryButton>

                </>
            )}

            {step === "new-user-confirm" && (
                <div className="mt-0">
                    <Head title="New User" />
                    <h2 className="text-lg font-semibold mb-5">
                        Looks like you are new with YARA Codes
                    </h2>

                    <div className="text-gray-700 mb-5">
                        <b>{type === "mobile" ? "IN + 91 " : ""}</b> {mobile}{" "}
                        <button
                            className="text-blue-600 underline ml-2"
                            onClick={() => setStep("enter")}
                        >
                            Change
                        </button>
                    </div>

                    <p className="text-gray-600 mb-4">
                        Let's create an account using your {type === "mobile" ? "mobile number" : "email"}
                    </p>

                    <PrimaryButton
                        className="mb-4 text-center"
                        onClick={() => setStep("register")}
                    >
                        Proceed to create an account
                    </PrimaryButton>
                    <hr className="my-5" />
                    <div className="text-center text-sm">
                        Already a customer?{" "}
                        <br />
                        <button
                            className="text-blue-700 underline"
                            onClick={() => setStep("enter")}
                        >

                            Sign in with another email or mobile
                        </button>
                    </div>
                </div>
            )}


            {/* STEP 3 */}
            {step === "register" && (
                <>
                    <Head title="Register" />
                    <Heading as="h2" className="px-0 mb-5" title="Create Account" />
                    {type === "mobile" && (
                        <>
                            <InputLabel value="Mobile Number" />
                            <TextInput
                                className="mt-1 block w-full"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                disabled
                            />
                        </>
                    )}
                    {type === "email" && (
                        <>
                            < InputLabel value="Email" />
                            <TextInput
                                className="mt-1 block w-full"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                disabled
                            />
                        </>
                    )}
                    <InputLabel className="mt-4" value="Your Name" />
                    <TextInput
                        className="mt-1 block w-full"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <InputLabel className="mt-4" value="Password (at least 6 characters)" />
                    <TextInput
                        type="password"
                        className="mt-1 block w-full"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <SmallParagraph title="To verify your number/email, we will send you a text message with a temporary code. Message and data rates may apply." className="my-4" />
                    <PrimaryButton
                        className="mt-4"
                        disabled={!name || !password || processing}
                        onClick={registerUser}
                    >
                        {type === "mobile"
                            ? (processing ? "Processing..." : "Verify Mobile Number")
                            : (processing ? "Processing..." : "Verify Email")
                        }

                    </PrimaryButton>
                    <hr className="my-5" />
                    <div className="text-center text-sm">
                        Already a customer?{" "}
                        <br />
                        <button
                            className="text-blue-700 underline"
                            onClick={() => setStep("enter")}
                        >

                            Sign in with another email or mobile
                        </button>
                    </div>
                </>
            )}

            {/* STEP 4 */}
            {step === "otp-verify" && (
                <>
                    <Head title="OTP Verification" />
                    <InputLabel value="Enter OTP" />
                    <TextInput
                        className="mt-1 block w-full"
                        value={otp}
                        maxLength={6}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, ""); // only numbers
                            setOtp(val.slice(0, 6)); // force 6 digits max
                        }}
                    />

                    <PrimaryButton
                        className="mt-4"
                        disabled={otp.length !== 6 || processing}
                        onClick={verifyRegistrationOtp}
                    >
                        {processing ? "Verifying..." : "Verify & Create Account"}
                    </PrimaryButton>

                    <div className="mt-3 text-center text-sm">
                        {timer > 0 ? (
                            <span>Resend OTP in {timer}s</span>
                        ) : (
                            <button
                                className="text-blue-700 underline"
                                onClick={resendOtp}
                                disabled={processing}
                            >
                                Resend OTP
                            </button>
                        )}
                    </div>
                </>
            )}

            {/* STEP 4 */}
            {step === "otp-login" && (
                <>
                    <Head title="Login Using OTP" />
                    <Heading as="h2" className="px-0 mb-5" title="Authentication required" />
                    <div className="text-gray-700 mb-5">
                        <b>{type === "mobile" ? "IN + 91 " : ""}</b> {mobile}{" "}
                        <button
                            className="text-blue-600 underline ml-2"
                            onClick={() => setStep("enter")}
                        >
                            Change
                        </button>
                    </div>
                    <SmallParagraph title="We’ve sent a One Time Password (OTP) to the mobile number above. Please enter it to complete verification" className="my-4" />
                    <InputLabel value="Enter OTP" />
                    <TextInput
                        className="mt-1 block w-full"
                        value={otp}
                        maxLength={6}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, ""); // only numbers
                            setOtp(val.slice(0, 6)); // force 6 digits max
                        }}
                    />

                    <PrimaryButton
                        className="mt-4"
                        disabled={otp.length !== 6 || processing}
                        onClick={verifyLoginOtp}
                    >
                        {processing ? "Verifying..." : "Continue"}
                    </PrimaryButton>

                    <div className="mt-3 text-center text-sm">
                        {timer > 0 ? (
                            <span>Resend OTP in {timer}s</span>
                        ) : (
                            <button
                                className="text-blue-700 underline"
                                onClick={resendOtp}
                                disabled={processing}
                            >
                                Resend OTP
                            </button>
                        )}
                    </div>
                </>
            )}
        </GuestLayout>
    );
}
