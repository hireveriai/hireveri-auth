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
    const SESSION_TTL_SECONDS = 86400;

    const pool = getPool();
    const sessionRes = await pool.query(
      `
      SELECT *
      FROM sp_verify_otp_and_issue_session(
        $1::uuid,
        $2::text,
        'LOGIN',
        $3::integer
      )
      `,
      [identityId, otp, SESSION_TTL_SECONDS]
    );

    if (!sessionRes.rows.length) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 401 }
      );
    }

    const { session_id } = sessionRes.rows[0];

    const identityRes = await pool.query(
      `
      SELECT intent
      FROM identity_users
      WHERE identity_id = $1
      `,
      [identityId]
    );

    const intent = identityRes.rows[0]?.intent;

    if (!intent) {
      return NextResponse.json(
        { error: "Auth intent missing" },
        { status: 400 }
      );
    }

    let nextRoute: string;

    if (intent === "candidate_practice") {
      const userRes = await pool.query(
        `
        SELECT user_id
        FROM users
        WHERE email = $1
          AND role = 'CANDIDATE'
          AND is_active = true
        `,
        [normalizedEmail]
      );

      if (userRes.rows.length === 0) {
        await pool.query(`select sp_create_practice_candidate($1,$2)`, [
          normalizedEmail,
          identityId,
        ]);
      }

      nextRoute =
        userRes.rows.length > 0
          ? `${candidateApp}/dashboard`
          : `${candidateApp}/onboarding/candidate`;
    } else if (intent === "recruiter_login") {
      const userRes = await pool.query(
        `
        SELECT user_id
        FROM users
        WHERE role = 'RECRUITER'
          AND is_active = true
          AND (
            identity_id = $1
            OR lower(email) = $2
          )
        `,
        [identityId, normalizedEmail]
      );

      nextRoute =
        userRes.rows.length > 0
          ? recruiterApp
          : `${candidateApp}/onboarding/recruiter`;
    } else {
      return NextResponse.json(
        { error: "Invalid auth intent" },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      nextRoute,
    });

    response.cookies.set("hireveri_session", session_id, {
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
