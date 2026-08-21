/**
 * Shared classification for Postgres/pooler failures.
 *
 * The auth routes previously funnelled every thrown error into a single
 * "Server error during verification" 500, which hid three very different
 * situations from both the user and the logs: a wrong code, a busy pooler,
 * and a genuine bug.
 */

const TRANSIENT_SQL_STATES = new Set([
  "08000", // connection_exception
  "08001", // sqlclient_unable_to_establish_sqlconnection
  "08006", // connection_failure
  "53300", // too_many_connections
  "53400", // configuration_limit_exceeded
  "57P03", // cannot_connect_now
]);

/** Errors raised by name inside sp_verify_otp_and_issue_session. */
const OTP_REJECTION_MARKERS = [
  "INVALID_OTP",
  "IDENTITY_NOT_FOUND",
  "IDENTITY_LOOKUP_REQUIRED",
  "OTP_REQUIRED",
  "INVALID_INTENT",
];

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error ?? "");
}

export function getSqlState(error: unknown) {
  return (error as { code?: string } | null)?.code ?? null;
}

/**
 * True when the pooler refused or dropped the connection. These are safe to
 * retry: the statement never reached Postgres.
 */
export function isTransientDbCapacityError(error: unknown) {
  const code = getSqlState(error);
  const message = getMessage(error).toLowerCase();

  return (
    (code ? TRANSIENT_SQL_STATES.has(code) : false) ||
    message.includes("maxclientsinsessionmode") ||
    message.includes("max clients reached") ||
    message.includes("too many clients") ||
    message.includes("remaining connection slots") ||
    message.includes("connection terminated due to connection timeout") ||
    message.includes("timeout exceeded when trying to connect")
  );
}

/**
 * True when the OTP itself was rejected. The database function signals this by
 * raising rather than returning a flag, so it arrives here as an exception.
 */
export function isOtpRejectionError(error: unknown) {
  const message = getMessage(error);

  return OTP_REJECTION_MARKERS.some((marker) => message.includes(marker));
}

/** Compact, log-safe description. Never includes the OTP or the email. */
export function describeDbError(error: unknown) {
  return {
    sqlState: getSqlState(error),
    message: getMessage(error).slice(0, 300),
    transient: isTransientDbCapacityError(error),
    otpRejection: isOtpRejectionError(error),
  };
}

const MAX_ATTEMPTS = 4;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries only connection-level failures, and only for operations the caller
 * declares safe to repeat. A statement that reached Postgres is never retried.
 */
export async function withDbRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isTransientDbCapacityError(error)) {
        throw error;
      }

      lastError = error;

      if (attempt === MAX_ATTEMPTS - 1) {
        break;
      }

      await wait(Math.min(300 * 2 ** attempt + Math.random() * 200, 2_500));
    }
  }

  throw lastError;
}
