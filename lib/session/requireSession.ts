import { cookies } from "next/headers";
import { pool } from "@/lib/db-admin";

/**
 * Resolve authenticated session from hireveri_session cookie
 * ---------------------------------------------------------
 * - Infra-level auth (allowed)
 * - No business logic
 * - No table access except auth_sessions
 */
export async function requireSession() {
  // ✅ cookies() is ASYNC in Next 14.1+
  const cookieStore = await cookies();

  const sessionId = cookieStore.get("hireveri_session")?.value;

  if (!sessionId) {
    throw new Error("Unauthenticated");
  }

  const { rows } = await pool.query(
    `
    select identity_id
    from auth_sessions
    where session_id = $1
      and is_active = true
      and expires_at > now()
    `,
    [sessionId]
  );

  if (!rows.length) {
    throw new Error("Invalid session");
  }

  return rows[0]; // { identity_id }
}
