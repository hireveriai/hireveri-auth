import crypto from "crypto";
import { pool } from "@/lib/db";
import { sendOtpEmail } from "@/lib/email";

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;

/* ------------------ helpers ------------------ */

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

/* ------------------ REQUEST OTP ------------------ */

export async function requestOTP(params: {
  email?: string;
  phone?: string;
  purpose: "LOGIN" | "SIGNUP" | "RESET";
  intent: "recruiter" | "candidate";
}) {
  const { email, phone, purpose, intent } = params;

  if (!email && !phone) {
    throw new Error("IDENTITY_REQUIRED");
  }

  /* 1. Ensure identity exists */
  const identityRes = await pool.query(
    `
    INSERT INTO identity_users (email, phone, intent)
    VALUES ($1, $2, $3)
    ON CONFLICT (email)
    DO UPDATE SET intent = EXCLUDED.intent
    RETURNING identity_id
    `,
    [email ?? null, phone ?? null, intent]
  );

  const identityId = identityRes.rows[0].identity_id;

  /* 2. Generate OTP */
  const otp = generateOtp();
  const otpHash = hashOtp(otp);

  // DEV fallback (always keep this)
  if (process.env.NODE_ENV !== "production") {
    console.log("OTP (DEV ONLY):", otp);
  }

  // Email delivery (only if SMTP configured)
  if (email && process.env.SMTP_HOST) {
    await sendOtpEmail(email, otp);
  }

  const expiresAt = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  );

  /* 3. Store OTP */
  const otpRes = await pool.query(
    `
    INSERT INTO user_otps (
      otp_code,
      purpose,
      expires_at,
      identity_id,
      used_at
    )
    VALUES ($1, $2, $3, $4, NULL)
    RETURNING otp_id
    `,
    [otpHash, purpose, expiresAt, identityId]
  );

  return {
    identityId, // ✅ CRITICAL FIX
    otpId: otpRes.rows[0].otp_id,
    expiresIn: OTP_EXPIRY_MINUTES * 60
  };
}

/* ------------------ VERIFY OTP ------------------ */

export async function verifyOTP(params: {
  otpId: string;
  otp: string;
}) {
  const { otpId, otp } = params;

  const res = await pool.query(
    `
    SELECT
      otp_id,
      otp_code,
      expires_at,
      used_at,
      identity_id
    FROM user_otps
    WHERE otp_id = $1
    `,
    [otpId]
  );

  if (res.rowCount === 0) {
    throw new Error("OTP_NOT_FOUND");
  }

  const record = res.rows[0];

  if (record.used_at) {
    throw new Error("OTP_ALREADY_USED");
  }

  if (new Date(record.expires_at) < new Date()) {
    throw new Error("OTP_EXPIRED");
  }

  const incomingHash = hashOtp(otp);

  if (incomingHash !== record.otp_code) {
    throw new Error("OTP_INVALID");
  }

  /* Consume OTP */
  await pool.query(
    `
    UPDATE user_otps
    SET used_at = NOW()
    WHERE otp_id = $1
    `,
    [otpId]
  );

  return {
    identityId: record.identity_id
  };
}
