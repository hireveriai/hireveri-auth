import { NextResponse } from "next/server";
import { requestOTP } from "@/lib/otp/otp.service";
import { isOtpEmailDeliveryError } from "@/lib/email";

function isMaxClientsError(error: unknown) {
  const message =
    error instanceof Error ? error.message : String(error ?? "");

  return (
    message.includes("MaxClientsInSessionMode") ||
    message.toLowerCase().includes("max clients reached")
  );
}

function getRequestOtpErrorMessage(error: unknown) {
  if (isMaxClientsError(error)) {
    return "Too many login requests are being processed right now. Please try again in a few seconds.";
  }

  if (isOtpEmailDeliveryError(error)) {
    return error.publicMessage;
  }

  return "Failed to send OTP. Please try again.";
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestOtpWithRetry(params: Parameters<typeof requestOTP>[0]) {
  try {
    return await requestOTP(params);
  } catch (error) {
    if (!isMaxClientsError(error)) {
      throw error;
    }

    console.warn("REQUEST OTP RETRYING AFTER DB POOL SATURATION");
    await wait(600);

    return requestOTP(params);
  }
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
    const result = await requestOtpWithRetry({
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
