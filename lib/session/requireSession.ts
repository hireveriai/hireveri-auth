import { cookies } from "next/headers";
import { getPool } from "@/lib/db-admin";
import { IDLE_SESSION_TIMEOUT_HOURS } from "@/lib/session/idle-timeout";

/**
 * Resolve authenticated session from hireveri_session cookie
 * ---------------------------------------------------------
 * - Infra-level auth (allowed)
 * - No business logic
 * - No table access except auth_sessions
 *
 * A session is valid while it is active, inside expires_at, AND has been used
 * within IDLE_SESSION_TIMEOUT_HOURS. Sessions idle past that window are
 * deactivated here so every other consumer of auth_sessions sees them as dead
 * too. Validating a session stamps last_seen_at, which is what keeps an
 * in-use session alive.
 */
export async function requireSession() {
  // ✅ cookies() is ASYNC in Next 14.1+
  const cookieStore = await cookies();

  const sessionId = cookieStore.get("hireveri_session")?.value;

  if (!sessionId) {
    throw new Error("Unauthenticated");
  }

  const pool = getPool();

  // Single statement: retire the session if it has gone idle, otherwise touch
  // last_seen_at and return it. Anything that comes back is a live session.
  const { rows } = await pool.query(
    `
    update auth_sessions
    set
      is_active = case
        when last_seen_at <= now() - make_interval(hours => $2::int) then false
        else is_active
      end,
      last_seen_at = case
        when last_seen_at <= now() - make_interval(hours => $2::int) then last_seen_at
        else now()
      end
    where session_id = $1
      and is_active = true
      and expires_at > now()
    returning identity_id, is_active
    `,
    [sessionId, IDLE_SESSION_TIMEOUT_HOURS]
  );

  const session = rows[0];

  if (!session || session.is_active === false) {
    throw new Error("Invalid session");
  }

  return { identity_id: session.identity_id };
}
