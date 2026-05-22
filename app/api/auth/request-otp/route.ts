import { NextResponse } from "next/server";
import { requestOTP } from "@/lib/otp/otp.service";
import { isOtpEmailDeliveryError } from "@/lib/email";

type RequestOtpParams = Parameters<typeof requestOTP>[0];
type RequestOtpResult = Awaited<ReturnType<typeof requestOTP>>;

declare global {
  var __hireveriOtpRequestInFlight:
    | Map<string, Promise<RequestOtpResult>>
    | undefined;
  var __hireveriOtpRequestCache:
    | Map<string, { expiresAt: number; result: RequestOtpResult }>
    | undefined;
}

const transientDbErrorCodes = new Set([
  "08000",
  "08001",
  "08006",
  "53300",
  "53400",
  "57P03",
]);

const MAX_DB_RETRY_ATTEMPTS = 4;
const OTP_REQUEST_CACHE_TTL_MS = 20_000;
const OTP_REQUEST_CACHE_MAX_ENTRIES = 500;

function getInFlightOtpRequests() {
  if (!global.__hireveriOtpRequestInFlight) {
    global.__hireveriOtpRequestInFlight = new Map();
  }

  return global.__hireveriOtpRequestInFlight;
}

function getOtpRequestCache() {
  if (!global.__hireveriOtpRequestCache) {
    global.__hireveriOtpRequestCache = new Map();
  }

  return global.__hireveriOtpRequestCache;
}

function getRequestKey(params: RequestOtpParams) {
  return [
    params.intent,
    params.purpose,
    params.email?.toLowerCase().trim() ?? "",
    params.phone?.trim() ?? "",
  ].join(":");
}

function getCachedOtpRequest(key: string) {
  const cache = getOtpRequestCache();
  const cached = cache.get(key);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return cached.result;
}

function setCachedOtpRequest(key: string, result: RequestOtpResult) {
  const cache = getOtpRequestCache();

  if (cache.size >= OTP_REQUEST_CACHE_MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      cache.delete(firstKey);
    }
  }

  cache.set(key, {
    expiresAt: Date.now() + OTP_REQUEST_CACHE_TTL_MS,
    result,
  });
}

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

async function requestOtpWithRetry(params: RequestOtpParams) {
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

async function requestOtpOnce(params: RequestOtpParams) {
  const key = getRequestKey(params);
  const cached = getCachedOtpRequest(key);

  if (cached) {
    return cached;
  }

  const inFlight = getInFlightOtpRequests();
  const existing = inFlight.get(key);

  if (existing) {
    return existing;
  }

  const promise = requestOtpWithRetry(params);
  inFlight.set(key, promise);

  try {
    const result = await promise;
    setCachedOtpRequest(key, result);
    return result;
  } finally {
    inFlight.delete(key);
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
    const result = await requestOtpOnce({
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
