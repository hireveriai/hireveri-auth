import { NextResponse } from "next/server";
import { requestOTP } from "@/lib/otp/otp.service";
import { isOtpEmailDeliveryError } from "@/lib/email";

const transientDbErrorCodes = new Set([
  "08000",
  "08001",
  "08006",
  "53300",
  "53400",
  "57P03",
]);

const MAX_DB_RETRY_ATTEMPTS = 4;

function isTransientDbCapacityError(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  const message =
    error instanceof Error ? error.message : String(error ?? "");
  const normalizedMessage = message.toLowerCase();

  return (
    (code ? transientDbErrorCodes.has(code) : false) ||
    message.includes("MaxClientsInSessionMode") ||
    normalizedMessage.includes("max clients reached") ||
    normalizedMessage.includes("too many clients") ||
    normalizedMessage.includes("remaining connection slots") ||
    normalizedMessage.includes("connection terminated due to connection timeout") ||
    normalizedMessage.includes("timeout exceeded when trying to connect")
  );
}

function getRequestOtpErrorMessage(error: unknown) {
  if (isTransientDbCapacityError(error)) {
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

function getRetryDelayMs(attempt: number) {
  const baseDelayMs = 300 * 2 ** attempt;
  const jitterMs = Math.floor(Math.random() * 200);

  return Math.min(baseDelayMs + jitterMs, 2_500);
}

async function requestOtpWithRetry(params: Parameters<typeof requestOTP>[0]) {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_DB_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await requestOTP(params);
    } catch (error) {
      if (!isTransientDbCapacityError(error)) {
        throw error;
      }

      lastError = error;

      if (attempt === MAX_DB_RETRY_ATTEMPTS - 1) {
        break;
      }

      const delayMs = getRetryDelayMs(attempt);

      console.warn("REQUEST OTP RETRYING AFTER DB CAPACITY ERROR", {
        attempt: attempt + 1,
        delayMs,
      });

      await wait(delayMs);
    }
  }

  throw lastError;
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
