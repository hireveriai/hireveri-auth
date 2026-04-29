import { NextResponse } from "next/server";
import { requestOTP } from "@/lib/otp/otp.service";

function getRequestOtpErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Failed to send OTP";

  if (
    message.includes("MaxClientsInSessionMode") ||
    message.toLowerCase().includes("max clients reached")
  ) {
    return "Too many login requests are being processed right now. Please try again in a few seconds.";
  }

  return "Failed to send OTP. Please try again.";
}

/**
 * Auth OTP Request
 * - Intent is REQUIRED
 * - Backend never assumes role
 */
export async function POST(req: Request) {
  try {
    const { email, intent } = await req.json();

    // 🔒 Hard validation (no silent fallbacks)
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!intent) {
      return NextResponse.json(
        { error: "Auth intent is required" },
        { status: 400 }
      );
    }

    // ✅ Allowed intents only
    const allowedIntents = [
      "candidate_practice",
      "recruiter_login",
    ];

    if (!allowedIntents.includes(intent)) {
      return NextResponse.json(
        { error: "Invalid auth intent" },
        { status: 400 }
      );
    }

    // 🔐 Issue OTP (DB-owned)
    const result = await requestOTP({
      email,
      intent,
      purpose: "LOGIN",
    });

    return NextResponse.json({
      success: true,
      identityId: result.identityId,
      otpId: result.otpId,
      expiresIn: result.expiresIn,
    });
  } catch (err) {
    console.error("REQUEST OTP ERROR:", err);

    return NextResponse.json(
      { error: getRequestOtpErrorMessage(err) },
      { status: 500 }
    );
  }
}
