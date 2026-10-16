import { randomInt, timingSafeEqual } from "crypto";

/** Wrong guesses allowed against one code before it is voided. */
export const OTP_MAX_FAILED_ATTEMPTS = 5;
/** Codes (and so emails) one identity can be issued per rolling window. */
export const OTP_MAX_ISSUES_PER_WINDOW = 5;
export const OTP_ISSUE_WINDOW_MINUTES = 15;

/** Satisfied by pg's Pool and PoolClient; tests use an in-process Postgres. */
export type OtpQueryable = {
  query(text: string, params?: unknown[]): Promise<{ rows: unknown[] }>;
};

export class OtpRateLimitError extends Error {
  public readonly publicMessage: string;

  constructor(publicMessage: string) {
    super(publicMessage);
    this.name = "OtpRateLimitError";
    this.publicMessage = publicMessage;
  }
}

export function isOtpRateLimitError(error: unknown): error is OtpRateLimitError {
  return error instanceof OtpRateLimitError;
}

export function generateOtp(): string {
  return randomInt(100000, 1000000).toString();
}

/**
 * Call inside the transaction that inserts the new code. Serializes requests
 * for one identity, refuses once the window's cap is reached, and voids every
 * code still live so only the newest one can be used — previously each resend
 * added another valid code, multiplying the odds of a guess.
 */
export async function reserveOtpIssue(client: OtpQueryable, identityId: string) {
  await client.query(`SELECT pg_advisory_xact_lock(hashtext($1::text))`, [
    `otp-issue:${identityId}`,
  ]);

  const { rows } = await client.query(
    `
    SELECT count(*)::int AS issued
    FROM public.user_otps
    WHERE identity_id = $1::uuid
      AND created_at > now() - make_interval(mins => $2::int)
    `,
    [identityId, OTP_ISSUE_WINDOW_MINUTES]
  );
  const issued = (rows[0] as { issued: number } | undefined)?.issued ?? 0;

  if (issued >= OTP_MAX_ISSUES_PER_WINDOW) {
    throw new OtpRateLimitError(
      `Too many codes requested. Please wait ${OTP_ISSUE_WINDOW_MINUTES} minutes and try again.`
    );
  }

  await client.query(
    `
    UPDATE public.user_otps
    SET used_at = now()
    WHERE identity_id = $1::uuid
      AND used_at IS NULL
      AND (expires_at IS NULL OR expires_at > now())
    `,
    [identityId]
  );
}

export type OtpAttemptResult =
  | { status: "valid" }
  | { status: "invalid"; attemptsRemaining: number }
  | { status: "locked" }
  | { status: "missing" };

function codesMatch(stored: unknown, submitted: string) {
  const expected = Buffer.from(String(stored ?? ""));
  const received = Buffer.from(submitted);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/**
 * Checks a submitted code against the identity's newest live code. A wrong
 * guess is counted in the same UPDATE that voids the code on the last allowed
 * attempt, so parallel guesses cannot exceed the limit. A "valid" result does
 * not consume the code; sp_verify_otp_and_issue_session does that.
 */
export async function checkOtpAttempt(
  db: OtpQueryable,
  identityId: string,
  otp: string
): Promise<OtpAttemptResult> {
  const { rows } = await db.query(
    `
    SELECT otp_id::text AS otp_id, otp_code
    FROM public.user_otps
    WHERE identity_id = $1::uuid
      AND used_at IS NULL
      AND (expires_at IS NULL OR expires_at > now())
    ORDER BY created_at DESC, expires_at DESC NULLS LAST
    LIMIT 1
    `,
    [identityId]
  );
  const live = rows[0] as { otp_id: string; otp_code: string | null } | undefined;

  if (!live) {
    return { status: "missing" };
  }

  if (codesMatch(live.otp_code, otp)) {
    return { status: "valid" };
  }

  const { rows: updated } = await db.query(
    `
    UPDATE public.user_otps
    SET failed_attempts = failed_attempts + 1,
        used_at = CASE
          WHEN failed_attempts + 1 >= $2::int THEN now()
          ELSE used_at
        END
    WHERE otp_id = $1::uuid
      AND used_at IS NULL
    RETURNING failed_attempts
    `,
    [live.otp_id, OTP_MAX_FAILED_ATTEMPTS]
  );
  const failed = (updated[0] as { failed_attempts: number } | undefined)?.failed_attempts;

  // Consumed or replaced between the two statements (login elsewhere, new code).
  if (failed === undefined) {
    return { status: "missing" };
  }

  if (failed >= OTP_MAX_FAILED_ATTEMPTS) {
    return { status: "locked" };
  }

  return { status: "invalid", attemptsRemaining: OTP_MAX_FAILED_ATTEMPTS - failed };
}
