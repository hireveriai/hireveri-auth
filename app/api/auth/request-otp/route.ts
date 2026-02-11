import { NextResponse } from "next/server";
import { requestOTP } from "@/lib/otp/otp.service";

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
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to send OTP" },
      { status: 500 }
    );
  }
}
