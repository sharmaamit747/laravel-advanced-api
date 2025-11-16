<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Your OTP Code</title>
</head>
<body style="background:#f6f6f6; padding:20px;">
    <div style="max-width:500px; margin:auto; background:#ffffff; padding:25px; border-radius:8px; font-family:Arial, sans-serif;">
        <h2 style="text-align:center; color:#333;">Your Verification Code</h2>

        <p style="font-size:16px; color:#555;">
            Use the OTP below to complete your verification:
        </p>

        <h1 style="text-align:center; font-size:32px; letter-spacing:4px; background:#f1f1f1; padding:15px; border-radius:6px;">
            {{ $otp }}
        </h1>

        <p style="font-size:14px; color:#777; text-align:center; margin-top:20px;">
            This OTP is valid for 5 minutes.
        </p>

        <p style="text-align:center; color:#aaa; font-size:12px;">
            If you did not request this, please ignore this email.
        </p>
    </div>
</body>
</html>
