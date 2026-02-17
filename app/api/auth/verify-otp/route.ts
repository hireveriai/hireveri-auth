import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-admin";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { identityId, otp, email } = await req.json();

  if (!identityId || !otp || !email) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }

  const SESSION_TTL_SECONDS = 86400;

  /* 1️⃣ Verify OTP + issue session */
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

  /* 2️⃣ Resolve intent (DB is source of truth) */
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

  /* 3️⃣ Resolve next route */
  let nextRoute: string;

  /* 🧑‍🎓 PRACTICE CANDIDATE */
  if (intent === "candidate_practice") {
  const userRes = await pool.query(
    `
    SELECT user_id
    FROM users
    WHERE email = $1
      AND role = 'CANDIDATE'
      AND is_active = true
    `,
    [email.toLowerCase()]
  );

  if (userRes.rows.length === 0) {
    // create candidate if first time
    await pool.query(
      `select sp_create_practice_candidate($1,$2)`,
      [email.toLowerCase(), identityId]
    );
  }

  nextRoute =
    userRes.rows.length > 0
      ? "/practice/dashboard"
      : "/onboarding/candidate";
}


  /* 🧑‍💼 RECRUITER */
  else if (intent === "recruiter_login") {
    const userRes = await pool.query(
      `
      SELECT user_id
      FROM users
      WHERE identity_id = $1
        AND role = 'RECRUITER'
        AND is_active = true
      `,
      [identityId]
    );

    nextRoute =
      userRes.rows.length > 0
        ? "/recruiter/war-room"
        : "/onboarding/recruiter";
  }

  else {
    return NextResponse.json(
      { error: "Invalid auth intent" },
      { status: 400 }
    );
  }

  /* 4️⃣ Set session cookie */
  const cookieStore = await cookies();
  cookieStore.set("hireveri_session", session_id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return NextResponse.json({
    success: true,
    nextRoute,
  });
}
