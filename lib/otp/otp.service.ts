import { connectClient, getPool } from "@/lib/db-admin";
import { sendOtpEmail } from "@/lib/email";
import type { PoolClient } from "pg";

const OTP_EXPIRY_MINUTES = 5;

/* ------------------ helpers ------------------ */

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizeIdentityIntent(intent: string) {
  if (intent === "recruiter" || intent === "recruiter_login") {
    return "recruiter_login";
  }

  return "candidate_practice";
}

function normalizeOtpIntent(intent: string) {
  if (intent === "recruiter" || intent === "recruiter_login") {
    return "recruiter";
  }

  return "candidate";
}

function normalizeEmail(email?: string) {
  const normalized = email?.toLowerCase().trim();
  return normalized || null;
}

function normalizePhone(phone?: string) {
  const normalized = phone?.trim();
  return normalized || null;
}

function isUniqueViolation(error: unknown) {
  return (error as { code?: string } | null)?.code === "23505";
}

async function resolveIdentity(params: {
  client: PoolClient;
  email?: string;
  phone?: string;
  intent: string;
}) {
  const { client } = params;
  const normalizedEmail = normalizeEmail(params.email);
  const normalizedPhone = normalizePhone(params.phone);
  const identityIntent = normalizeIdentityIntent(params.intent);

  if (normalizedEmail) {
    const existing = await client.query(
      `
      SELECT identity_id
      FROM public.identity_users
      WHERE lower(coalesce(primary_email, email)) = $1::text
        AND intent = $2::text
      ORDER BY is_verified DESC NULLS LAST, created_at DESC NULLS LAST
      LIMIT 1
      `,
      [normalizedEmail, identityIntent]
    );

    if (existing.rows.length) {
      return existing.rows[0].identity_id;
    }
  }

  if (!normalizedEmail && normalizedPhone) {
    const existing = await client.query(
      `
      SELECT identity_id
      FROM public.identity_users
      WHERE coalesce(primary_phone, phone) = $1::text
        AND intent = $2::text
      ORDER BY is_verified DESC NULLS LAST, created_at DESC NULLS LAST
      LIMIT 1
      `,
      [normalizedPhone, identityIntent]
    );

    if (existing.rows.length) {
      return existing.rows[0].identity_id;
    }
  }

  try {
    const created = await client.query(
      `
      INSERT INTO public.identity_users (
        email,
        primary_email,
        phone,
        primary_phone,
        intent
      )
      VALUES ($1, $1, $2, $2, $3)
      RETURNING identity_id
      `,
      [normalizedEmail, normalizedPhone, identityIntent]
    );

    return created.rows[0].identity_id;
  } catch (error) {
    if (!isUniqueViolation(error) || !normalizedEmail) {
      throw error;
    }

    // Compatibility with databases that still have the legacy global email
    // uniqueness constraint. The migration removes this fallback path.
    const legacyIdentity = await client.query(
      `
      UPDATE public.identity_users
      SET
        intent = $2::text,
        primary_email = coalesce(primary_email, $1::text),
        email = coalesce(email, $1::text)
      WHERE lower(coalesce(primary_email, email)) = $1::text
      RETURNING identity_id
      `,
      [normalizedEmail, identityIntent]
    );

    if (!legacyIdentity.rows.length) {
      throw error;
    }

    return legacyIdentity.rows[0].identity_id;
  }
}

/* ------------------ REQUEST OTP ------------------ */

export async function requestOTP(params: {
  email?: string;
  phone?: string;
  purpose: "LOGIN" | "SIGNUP" | "RESET";
  intent:
    | "recruiter"
    | "candidate"
    | "recruiter_login"
    | "candidate_practice";
}) {
  const { email, phone, purpose, intent } = params;

  if (!email && !phone) {
    throw new Error("IDENTITY_REQUIRED");
  }

  /* 1. Ensure an OTP identity exists without claiming a platform auth user.
        connectClient() types connection failures as DatabaseConnectionError so
        an unreachable database is not reported to the user as a mail problem. */
  const client = await connectClient();

  /* 2. Generate OTP */
  const otp = generateOtp();

  // DEV fallback (always keep this)
  if (process.env.NODE_ENV !== "production") {
    console.log("OTP (DEV ONLY):", otp);
  }

  const expiresAt = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  );

  let identityId = "";
  let otpId = "";

  try {
    identityId = await resolveIdentity({ client, email, phone, intent });

    /* 3. Store OTP before delivery so sent codes are always valid */
    const otpRes = await client.query(
      `
      INSERT INTO user_otps (
        otp_code,
        purpose,
        expires_at,
        identity_id,
        intent,
        used_at
      )
      VALUES ($1, $2, $3, $4, $5, NULL)
      RETURNING otp_id
      `,
      [otp, purpose, expiresAt, identityId, normalizeOtpIntent(intent)]
    );

    otpId = otpRes.rows[0].otp_id;
  } finally {
    client.release();
  }

  // Delivery is provider-agnostic; the mailer decides between Resend and SMTP.
  if (email) {
    await sendOtpEmail(email, otp);
  }

  return {
    identityId, // ✅ CRITICAL FIX
    otpId,
    expiresIn: OTP_EXPIRY_MINUTES * 60
  };
}

/* ------------------ VERIFY OTP ------------------ */

export async function verifyOTP(params: {
  otpId: string;
  otp: string;
}) {
  const { otpId, otp } = params;
const pool = getPool();
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

  if (otp !== record.otp_code) {
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
