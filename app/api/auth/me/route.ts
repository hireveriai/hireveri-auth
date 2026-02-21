import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPool } from "@/lib/db-admin";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("hireveri_session")?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const pool = getPool();

    const res = await pool.query(`
      SELECT iu.email
      FROM auth_sessions s
      JOIN identity_users iu
        ON iu.identity_id = s.identity_id
      WHERE s.session_id = $1
        AND s.is_active = true
        AND s.expires_at > now()
    `, [sessionId]);

    if (!res.rows.length) {
      return NextResponse.json({ error: "Session invalid" }, { status: 401 });
    }

    return NextResponse.json({ email: res.rows[0].email });

  } catch (err) {
    console.error("AUTH ME ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}