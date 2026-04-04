import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-admin";
import {
  getCandidateOnboardingUrl,
  getRecruiterOnboardingUrl,
} from "@/lib/app-urls";

const candidateApp = process.env.CANDIDATE_APP_URL!;
const practiceCandidateApp =
  process.env.PRACTICE_CANDIDATE_APP_URL || candidateApp;
const recruiterApp =
  process.env.RECRUITER_APP_URL || "https://recruiter.verihireai.work";
const recruiterAppTemplate = process.env.RECRUITER_APP_URL_TEMPLATE;
const sessionCookieDomain = process.env.SESSION_COOKIE_DOMAIN;

function buildRecruiterAppUrl(params: {
  organizationId?: string | null;
  userId?: string | null;
}) {
  const { organizationId, userId } = params;

  if (recruiterAppTemplate) {
    return recruiterAppTemplate
      .replaceAll("{organizationId}", organizationId ?? "")
      .replaceAll("{userId}", userId ?? "");
  }

  const url = new URL(recruiterApp);

  if (organizationId) {
    url.searchParams.set("organizationId", organizationId);
  }

  if (userId) {
    url.searchParams.set("userId", userId);
  }

  return url.toString();
}

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
    const otpRes = await pool.query(
      `
      SELECT otp_id
      FROM public.user_otps
      WHERE identity_id = $1::uuid
        AND otp_code = $2::text
        AND used_at IS NULL
        AND (expires_at IS NULL OR expires_at > now())
      ORDER BY expires_at DESC NULLS LAST, otp_id DESC
      LIMIT 1
      `,
      [identityId, otp]
    );

    if (!otpRes.rows.length) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 401 }
      );
    }

    await pool.query(
      `
      UPDATE public.auth_sessions
      SET is_active = false
      WHERE identity_id = $1::uuid
        AND is_active = true
        AND (
          expires_at <= now()
          OR auth_intent_id = (
            SELECT auth_intent_id
            FROM public.auth_intent_pool
            WHERE code = 'recruiter_login'
            LIMIT 1
          )
        )
      `,
      [identityId]
    );

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

    let nextRoute = result.redirectUrl;

    if (result.intent === "recruiter_login") {
      const recruiterRes = await pool.query(
        `
        SELECT user_id, organization_id
        FROM public.users
        WHERE role = 'RECRUITER'
          AND is_active = true
          AND lower(email) = $1::text
        LIMIT 1
        `,
        [normalizedEmail]
      );

      nextRoute = recruiterRes.rows.length
        ? buildRecruiterAppUrl({
            organizationId: recruiterRes.rows[0].organization_id,
            userId: recruiterRes.rows[0].user_id,
          })
        : getRecruiterOnboardingUrl(
            process.env.RECRUITER_AUTH_APP_URL || process.env.AUTH_APP_URL
          );
    } else if (result.intent === "candidate_practice") {
      const candidateRes = await pool.query(
        `
        SELECT user_id
        FROM public.users
        WHERE role = 'CANDIDATE'
          AND is_active = true
          AND (
            identity_id = $1::uuid
            OR lower(email) = $2::text
          )
        LIMIT 1
        `,
        [identityId, normalizedEmail]
      );

      if (!candidateRes.rows.length) {
        await pool.query(
          `
          SELECT *
          FROM public.sp_create_practice_candidate(
            $1::uuid,
            $2::text,
            NULL::text
          )
          `,
          [identityId, normalizedEmail]
        );

        nextRoute = getCandidateOnboardingUrl(
          process.env.PRACTICE_AUTH_APP_URL || process.env.AUTH_APP_URL
        );
      } else {
        nextRoute = practiceCandidateApp;
      }
    } else if (!nextRoute) {
      nextRoute = practiceCandidateApp;
    }

    const response = NextResponse.json({
      success: true,
      nextRoute,
    });

    response.cookies.set("hireveri_session", result.sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      domain: process.env.NODE_ENV === "production" ? sessionCookieDomain : undefined,
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
