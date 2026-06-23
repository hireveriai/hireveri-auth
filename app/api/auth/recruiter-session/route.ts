import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-admin";

type RecruiterSessionPayload = {
  userId: string;
  organizationId: string;
  identityId: string;
  email: string;
};

declare global {
  var __hireveriRecruiterSessionCache:
    | Map<string, { expiresAt: number; payload: RecruiterSessionPayload }>
    | undefined;
  var __hireveriRecruiterSessionInFlight:
    | Map<string, Promise<RecruiterSessionPayload | null>>
    | undefined;
}

const SESSION_CACHE_TTL_MS = 60_000;
const SESSION_CACHE_MAX_ENTRIES = 500;
const MAX_DB_RETRY_ATTEMPTS = 4;
const transientDbErrorCodes = new Set([
  "08000",
  "08001",
  "08006",
  "53300",
  "53400",
  "57P03",
]);

function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const separatorIndex = part.indexOf("=");

      if (separatorIndex === -1) {
        return acc;
      }

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

function getSessionCache() {
  if (!global.__hireveriRecruiterSessionCache) {
    global.__hireveriRecruiterSessionCache = new Map();
  }

  return global.__hireveriRecruiterSessionCache;
}

function getInFlightMap() {
  if (!global.__hireveriRecruiterSessionInFlight) {
    global.__hireveriRecruiterSessionInFlight = new Map();
  }

  return global.__hireveriRecruiterSessionInFlight;
}

function getCachedSession(sessionId: string) {
  const cache = getSessionCache();
  const cached = cache.get(sessionId);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    cache.delete(sessionId);
    return null;
  }

  return cached.payload;
}

function setCachedSession(sessionId: string, payload: RecruiterSessionPayload) {
  const cache = getSessionCache();

  if (cache.size >= SESSION_CACHE_MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      cache.delete(firstKey);
    }
  }

  cache.set(sessionId, {
    expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
    payload,
  });
}

function isTransientDbCapacityError(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  const message = error instanceof Error ? error.message : String(error ?? "");
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

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(attempt: number) {
  const baseDelayMs = 200 * 2 ** attempt;
  const jitterMs = Math.floor(Math.random() * 150);

  return Math.min(baseDelayMs + jitterMs, 1_500);
}

async function queryRecruiterSession(sessionId: string): Promise<RecruiterSessionPayload | null> {
  const pool = getPool();
  const result = await pool.query(
    `
    WITH session_identity AS (
      SELECT
        s.identity_id,
        lower(coalesce(iu.primary_email, iu.email)) AS email_normalized
      FROM public.auth_sessions s
      JOIN public.identity_users iu
        ON iu.identity_id = s.identity_id
      WHERE s.session_id = $1::uuid
        AND s.is_active = true
        AND s.expires_at > now()
      LIMIT 1
    ),
    auth_match AS (
      SELECT
        coalesce(u.user_id, om.legacy_user_id, au.id) AS user_id,
        om.org_id AS organization_id,
        si.identity_id,
        si.email_normalized,
        0 AS priority
      FROM session_identity si
      JOIN public.auth_users au
        ON au.email_normalized = si.email_normalized
      JOIN public.organization_memberships om
        ON om.auth_user_id = au.id
      JOIN public.organizations o
        ON o.organization_id = om.org_id
       AND coalesce(o.is_active, true) = true
      LEFT JOIN public.users u
        ON (
          u.user_id = om.legacy_user_id
          OR (
            u.auth_user_id = au.id
            AND u.organization_id = om.org_id
            AND u.role IN ('RECRUITER', 'ORG_OWNER', 'ADMIN')
          )
        )
       AND u.is_active = true
      WHERE om.role IN ('RECRUITER', 'ORG_OWNER', 'ADMIN', 'INTERVIEWER')
    ),
    legacy_match AS (
      SELECT
        u.user_id,
        u.organization_id,
        si.identity_id,
        si.email_normalized,
        1 AS priority
      FROM session_identity si
      JOIN public.users u
        ON lower(u.email) = si.email_normalized
      JOIN public.organizations o
        ON o.organization_id = u.organization_id
       AND coalesce(o.is_active, true) = true
      WHERE u.role IN ('RECRUITER', 'ORG_OWNER', 'ADMIN')
        AND u.is_active = true
    )
    SELECT
      candidate.user_id,
      candidate.organization_id,
      candidate.identity_id,
      candidate.email_normalized
    FROM (
      SELECT * FROM auth_match
      UNION ALL
      SELECT * FROM legacy_match
    ) candidate
    WHERE candidate.user_id IS NOT NULL
      AND candidate.organization_id IS NOT NULL
    ORDER BY candidate.priority
    LIMIT 1
    `,
    [sessionId]
  );

  const recruiter = result.rows[0];

  if (!recruiter?.user_id || !recruiter.organization_id) {
    return null;
  }

  return {
    userId: recruiter.user_id,
    organizationId: recruiter.organization_id,
    identityId: recruiter.identity_id,
    email: recruiter.email_normalized,
  };
}

async function queryRecruiterSessionWithRetry(sessionId: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_DB_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await queryRecruiterSession(sessionId);
    } catch (error) {
      if (!isTransientDbCapacityError(error)) {
        throw error;
      }

      lastError = error;

      if (attempt === MAX_DB_RETRY_ATTEMPTS - 1) {
        break;
      }

      await wait(getRetryDelayMs(attempt));
    }
  }

  throw lastError;
}

async function getRecruiterSession(sessionId: string) {
  const cached = getCachedSession(sessionId);

  if (cached) {
    return cached;
  }

  const inFlight = getInFlightMap();
  const existing = inFlight.get(sessionId);

  if (existing) {
    return existing;
  }

  const promise = queryRecruiterSessionWithRetry(sessionId);
  inFlight.set(sessionId, promise);

  try {
    const payload = await promise;

    if (payload) {
      setCachedSession(sessionId, payload);
    }

    return payload;
  } finally {
    inFlight.delete(sessionId);
  }
}

export async function GET(request: Request) {
  try {
    const cookies = parseCookieHeader(request.headers.get("cookie"));
    const sessionId = cookies.hireveri_session?.trim();

    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const recruiter = await getRecruiterSession(sessionId);

    if (!recruiter) {
      return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
    }

    return NextResponse.json(recruiter);
  } catch (error) {
    console.error("RECRUITER SESSION ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
