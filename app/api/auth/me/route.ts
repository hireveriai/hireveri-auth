import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db-admin";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("hireveri_session")?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const res = await pool.query(
    `
    SELECT iu.email
    FROM auth_sessions s
    JOIN identity_users iu ON iu.identity_id = s.identity_id
    WHERE s.session_id = $1
    `,
    [sessionId]
  );

  if (!res.rows.length) {
    return NextResponse.json({ error: "Session invalid" }, { status: 401 });
  }

  return NextResponse.json({ email: res.rows[0].email });
}
