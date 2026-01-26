import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { identityId, otp } = await req.json();

  if (!identityId || !otp) {
    return NextResponse.json(
      { error: "Invalid identityId or otp" },
      { status: 400 }
    );
  }

  const res = await pool.query(
    `
    SELECT * FROM sp_verify_otp_and_issue_session(
      $1, $2, 'LOGIN', $3, $4
    )
    `,
    [
      identityId,
      otp,
      req.headers.get("x-forwarded-for"),
      req.headers.get("user-agent")
    ]
  );

  if (!res.rows.length) {
    return NextResponse.json(
      { error: "Invalid or expired OTP" },
      { status: 401 }
    );
  }

  const { session_id } = res.rows[0];

  // ✅ FIX: cookies() is async in Next 14
  const cookieStore = await cookies();

  cookieStore.set(
    "hireveri_session",
    session_id,
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/"
    }
  );

  return NextResponse.json({ success: true });
}
