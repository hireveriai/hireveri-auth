import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-admin";

const candidateApp = process.env.CANDIDATE_APP_URL!;
const recruiterApp =
  process.env.RECRUITER_APP_URL || "https://recruiter.verihireai.work";

export async function POST(req: Request) {
  try {
    const { identityId, otp, email } = await req.json();

    if (!identityId || !otp || !email) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const userAgent = req.headers.get("user-agent");
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

    const pool = getPool();
    const verifyRes = await pool.query(
      `
      SELECT public.sp_verify_otp_and_issue_session(
        $1::uuid,
        $2::text,
        $3::text,
        $4::text,
        $5::text
      )
      AS result
      `,
      [identityId, normalizedEmail, otp, ipAddress, userAgent]
    );

    const result = verifyRes.rows[0]?.result;

    if (!result?.success || !result?.sessionId) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 401 }
      );
    }

    const nextRoute =
      result.redirectUrl ||
      (result.intent === "recruiter_login"
        ? recruiterApp
        : `${candidateApp}/dashboard`);

    const response = NextResponse.json({
      success: true,
      nextRoute,
    });

    response.cookies.set("hireveri_session", result.sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      domain:
        process.env.NODE_ENV === "production" ? ".verihireai.work" : undefined,
    });

    return response;
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    return NextResponse.json(
      { error: "Server error during verification. Please try again." },
      { status: 500 }
    );
  }
}
