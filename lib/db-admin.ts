// lib/db-admin.ts
import { Pool, type PoolClient } from "pg";

/**
 * Raised when acquiring a connection fails, so callers can tell "the database
 * is unreachable" apart from "the query failed". Without it a dead connection
 * surfaced through request-otp's catch-all as "Failed to send OTP", which
 * points at the mailer and hides the real cause - it cost real debugging time
 * when auth was pointed at a Supabase project that no longer existed.
 */
export class DatabaseConnectionError extends Error {
  public readonly publicMessage: string;

  constructor(
    message: string,
    publicMessage = "We could not reach the database. Please try again in a moment.",
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = "DatabaseConnectionError";
    this.publicMessage = publicMessage;
  }
}

export function isDatabaseConnectionError(
  error: unknown
): error is DatabaseConnectionError {
  return error instanceof DatabaseConnectionError;
}

declare global {
  // Reuse a single pool per server process to avoid stacking connections.
  var __verisnovaAdminPool: Pool | undefined;
}

function shouldForceTransactionPooler() {
  return process.env.DB_POOL_MODE !== "session";
}

function normalizeConnectionString(rawConnectionString: string) {
  const trimmed = rawConnectionString.trim().replace(/^"|"$/g, "");

  try {
    const url = new URL(trimmed);

    if (
      shouldForceTransactionPooler() &&
      url.hostname.endsWith(".pooler.supabase.com") &&
      (!url.port || url.port === "5432")
    ) {
      url.port = "6543";
    }

    return url.toString();
  } catch {
    return trimmed;
  }
}

function isLocalHost(hostname: string | undefined) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

/**
 * SSL defaults ON for any non-local host. It previously defaulted OFF unless
 * DB_SSL was explicitly "true", which meant a deploy that simply hadn't copied
 * that one variable would connect without TLS - and Supabase refuses those, so
 * every query failed and surfaced as a generic 500. Set DB_SSL="false" to
 * force it off for a remote host that genuinely does not use TLS.
 */
function resolveSsl(connectionString?: string) {
  if (process.env.DB_SSL === "false") {
    return false as const;
  }

  let hostname = process.env.DB_HOST;

  if (connectionString) {
    try {
      hostname = new URL(connectionString).hostname;
    } catch {
      // Unparseable string: fall through to the DB_HOST reading.
    }
  }

  return isLocalHost(hostname) ? (false as const) : { rejectUnauthorized: false };
}

function getPoolPort() {
  const configuredPort = Number(process.env.DB_PORT ?? 5432);

  if (
    shouldForceTransactionPooler() &&
    process.env.DB_HOST?.endsWith(".pooler.supabase.com") &&
    configuredPort === 5432
  ) {
    return 6543;
  }

  return configuredPort;
}

export function getPool() {
  if (!global.__verisnovaAdminPool) {
    const connectionString =
      process.env.DB_POOL_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL_NON_POOLING;

    global.__verisnovaAdminPool = new Pool({
      ...(connectionString
        ? { connectionString: normalizeConnectionString(connectionString) }
        : {
            user: process.env.DB_USER!,
            password: process.env.DB_PASSWORD!,
            host: process.env.DB_HOST!,
            port: getPoolPort(),
            database: process.env.DB_NAME!,
          }),
      max: Number(process.env.DB_POOL_MAX ?? 1),
      idleTimeoutMillis: Number(
        process.env.DB_IDLE_TIMEOUT_MS ?? 100
      ),
      connectionTimeoutMillis: Number(
        process.env.DB_CONNECTION_TIMEOUT_MS ?? 2_500
      ),
      maxUses: Number(process.env.DB_MAX_USES ?? 7_500),
      maxLifetimeSeconds: Number(
        process.env.DB_MAX_LIFETIME_SECONDS ?? 60
      ),
      allowExitOnIdle: true,
      ssl: resolveSsl(connectionString),
    });
  }

  return global.__verisnovaAdminPool;
}

/**
 * Acquire a pooled client, translating connection failures into
 * DatabaseConnectionError while preserving the original as `cause` so the
 * driver's message still reaches the logs.
 *
 * Callers must release the returned client in a `finally`. Acquisition is
 * deliberately kept outside that block: if this throws there is no client to
 * release, and wrapping it in the same try would attempt to release undefined.
 */
export async function connectClient(): Promise<PoolClient> {
  try {
    return await getPool().connect();
  } catch (error) {
    throw new DatabaseConnectionError(
      `Database connection failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
      undefined,
      { cause: error }
    );
  }
}
