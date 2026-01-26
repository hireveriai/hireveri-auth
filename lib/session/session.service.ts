import { pool } from "@/lib/db";

const SESSION_TTL_HOURS = 24;

export async function createSession(params: {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { userId, ipAddress, userAgent } = params;

  const expiresAt = new Date(
    Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000
  );

  const res = await pool.query(
    `
    INSERT INTO auth_sessions (
      user_id,
      expires_at,
      ip_address,
      user_agent,
      is_active
    )
    VALUES ($1, $2, $3, $4, true)
    RETURNING session_id
    `,
    [userId, expiresAt, ipAddress ?? null, userAgent ?? null]
  );

  return {
    sessionId: res.rows[0].session_id,
    expiresAt
  };
}
