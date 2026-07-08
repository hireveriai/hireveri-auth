import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-admin";
import {
  getCandidateOnboardingUrl,
  getRecruiterOnboardingUrl,
} from "@/lib/app-urls";
import { getSharedCookieOptions } from "@/lib/auth/shared-cookie";
import { getPracticeCandidateDashboardUrl } from "@/lib/practice-candidate-url";

const recruiterApp =
  process.env.RECRUITER_APP_URL || "https://recruiter.hireveri.com";
const recruiterAppTemplate = process.env.RECRUITER_APP_URL_TEMPLATE;
const AUTH_COOKIE_NAMES = [
  "hireveri_session",
  "authToken",
  "accessToken",
  "access_token",
  "token",
];
const AUTH_COOKIE_DOMAINS = [".hireveri.com", ".verihireai.work"];
const USE_RECRUITER_QUERY_HANDOFF =
  process.env.RECRUITER_QUERY_HANDOFF === "true";

type LegalConsentPayload = {
  acceptedAt?: string;
  termsVersion?: string;
  privacyVersion?: string;
};

function normalizeLegalConsent(value: unknown): LegalConsentPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const consent = value as LegalConsentPayload;
  const acceptedAt = typeof consent.acceptedAt === "string" ? consent.acceptedAt : null;
  const termsVersion = typeof consent.termsVersion === "string" ? consent.termsVersion.trim() : "";
  const privacyVersion = typeof consent.privacyVersion === "string" ? consent.privacyVersion.trim() : "";

  if (!acceptedAt || Number.isNaN(new Date(acceptedAt).getTime()) || !termsVersion || !privacyVersion) {
    return null;
  }

  return {
    acceptedAt,
    termsVersion,
    privacyVersion,
  };
}

async function recordLegalConsent(params: {
  pool: ReturnType<typeof getPool>;
  identityId: string;
  email: string;
  consent: LegalConsentPayload | null;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  if (!params.consent) {
    return;
  }

  try {
    const tableCheck = await params.pool.query(
      `select to_regclass('public.auth_legal_acceptances') as table_name`
    );

    if (!tableCheck.rows[0]?.table_name) {
      return;
    }

    await params.pool.query(
      `
      insert into public.auth_legal_acceptances (
        identity_id,
        email_normalized,
        accepted_at,
        terms_version,
        privacy_version,
        ip_address,
        user_agent
      )
      values (
        $1::uuid,
        $2::text,
        $3::timestamptz,
        $4::text,
        $5::text,
        $6::text,
        $7::text
      )
      on conflict (identity_id, terms_version, privacy_version) do update
        set
          accepted_at = excluded.accepted_at,
          email_normalized = excluded.email_normalized,
          ip_address = excluded.ip_address,
          user_agent = excluded.user_agent
      `,
      [
        params.identityId,
        params.email,
        params.consent.acceptedAt,
        params.consent.termsVersion,
        params.consent.privacyVersion,
        params.ipAddress,
        params.userAgent,
      ]
    );
  } catch (error) {
    console.warn("LEGAL CONSENT RECORD WARNING:", error);
  }
}

function buildRecruiterAppUrl(params: {
  organizationId?: string | null;
  userId?: string | null;
  token?: string | null;
  sessionId?: string | null;
  nextPath?: string | null;
}) {
  const { organizationId, userId, token, sessionId } = params;
  const nextPath = appendRecruiterIdentityToPath(
    params.nextPath,
    organizationId,
    userId
  );

  if (USE_RECRUITER_QUERY_HANDOFF && (token || sessionId)) {
    const handoffUrl = new URL("/api/auth/handoff", recruiterApp);

    if (token) {
      handoffUrl.searchParams.set("token", token);
    }

    if (sessionId) {
      handoffUrl.searchParams.set("session", sessionId);
    }

    handoffUrl.searchParams.set("next", nextPath);
    return handoffUrl.toString();
  }

  if (recruiterAppTemplate && (!params.nextPath || params.nextPath === "/")) {
    const templatedUrl = recruiterAppTemplate
      .replaceAll("{organizationId}", organizationId ?? "")
      .replaceAll("{userId}", userId ?? "");

    try {
      if (new URL(templatedUrl).origin === new URL(recruiterApp).origin) {
        return templatedUrl;
      }
    } catch {
      // Fall back to the configured recruiter app below.
    }
  }

  const url = new URL(nextPath, recruiterApp);

  return url.toString();
}

function getSafeRecruiterNextPath(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "/";
  }

  try {
    const base = new URL(recruiterApp);
    const parsed = new URL(value, base);

    if (parsed.origin !== base.origin) {
      return "/";
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}

function appendRecruiterIdentityToPath(
  value: string | null | undefined,
  organizationId?: string | null,
  userId?: string | null
) {
  const base = new URL(recruiterApp);
  const url = new URL(value || "/", base);

  if (organizationId) {
    url.searchParams.set("organizationId", organizationId);
  }

  if (userId) {
    url.searchParams.set("userId", userId);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

async function isPracticeCandidateOnboarded(params: {
  pool: ReturnType<typeof getPool>;
  identityId: string;
}) {
  const result = await params.pool.query(
    `
    select
      c.candidate_id,
      c.first_name,
      c.last_name,
      c.primary_role_id,
      c.experience_level_code,
      exists (
        select 1
        from public.candidate_primary_skills cps
        where cps.candidate_id = c.candidate_id
      ) as has_primary_skills
    from public.candidate_identity_links cil
    join public.candidates c
      on c.candidate_id = cil.candidate_id
    where cil.identity_id = $1::uuid
      and cil.purpose = 'practice'
    order by cil.created_at desc
    limit 1
    `,
    [params.identityId]
  );

  const candidate = result.rows[0];

  return Boolean(
    candidate?.candidate_id &&
      candidate.first_name &&
      candidate.last_name &&
      candidate.primary_role_id &&
      candidate.experience_level_code &&
      candidate.has_primary_skills
  );
}

export async function POST(req: Request) {
  try {
    const { identityId, otp, email, next, consent } = await req.json();

    if (!identityId || !otp || !email) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const legalConsent = normalizeLegalConsent(consent);
    const safeRecruiterNextPath = getSafeRecruiterNextPath(next);
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
        WITH auth_match AS (
          SELECT
            coalesce(u.user_id, om.legacy_user_id, au.id) AS id,
            coalesce(u.organization_id, om.org_id) AS org_id,
            0 AS priority
          FROM public.auth_users au
          JOIN public.organization_memberships om
            ON om.auth_user_id = au.id
          LEFT JOIN public.users u
            ON (
              u.user_id = om.legacy_user_id
              OR (
                u.auth_user_id = au.id
                AND u.organization_id = om.org_id
                AND u.role IN ('RECRUITER', 'ORG_OWNER', 'ADMIN')
              )
            )
           AND u.is_active = true
          WHERE au.email_normalized = $1::text
            AND om.role IN ('RECRUITER', 'ORG_OWNER', 'ADMIN', 'INTERVIEWER')
          ORDER BY om.created_at ASC
          LIMIT 1
        ),
        legacy_match AS (
          SELECT
            u.user_id AS id,
            u.organization_id AS org_id,
            1 AS priority
          FROM public.users u
          WHERE u.role IN ('RECRUITER', 'ORG_OWNER', 'ADMIN')
            AND u.is_active = true
            AND lower(u.email) = $1::text
          ORDER BY u.created_at ASC
          LIMIT 1
        )
        SELECT
          candidate.id,
          candidate.org_id
        FROM (
          SELECT * FROM auth_match
          UNION ALL
          SELECT * FROM legacy_match
        ) candidate
        ORDER BY candidate.priority
        LIMIT 1
        `,
        [normalizedEmail]
      );

      const user = recruiterRes.rows[0];

      if (user) {
        nextRoute = buildRecruiterAppUrl({
          organizationId: user.org_id,
          userId: user.id,
          sessionId: result.sessionId,
          nextPath: safeRecruiterNextPath,
        });
      } else {
        const onboardingUrl = new URL(getRecruiterOnboardingUrl(
          process.env.RECRUITER_AUTH_APP_URL || process.env.AUTH_APP_URL
        ));
        onboardingUrl.searchParams.set("next", safeRecruiterNextPath);
        nextRoute = onboardingUrl.toString();
      }
    } else if (result.intent === "candidate_practice") {
      const candidateRes = await pool.query(
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

      const isOnboarded =
        !candidateRes.rows[0]?.created_new &&
        (await isPracticeCandidateOnboarded({ pool, identityId }));

      if (isOnboarded) {
        nextRoute = getPracticeCandidateDashboardUrl();
      } else {
        nextRoute = getCandidateOnboardingUrl(
          process.env.PRACTICE_AUTH_APP_URL || process.env.AUTH_APP_URL
        );
      }
    } else if (!nextRoute) {
      nextRoute = getPracticeCandidateDashboardUrl();
    }

    const response = NextResponse.json({
      success: true,
      nextRoute,
    });

    const sharedCookieOptions = getSharedCookieOptions(req);

    if (result.intent === "recruiter_login") {
      for (const name of AUTH_COOKIE_NAMES) {
        response.cookies.set(name, "", {
          ...sharedCookieOptions,
          maxAge: 0,
        });

        for (const domain of AUTH_COOKIE_DOMAINS) {
          response.cookies.set(name, "", {
            ...sharedCookieOptions,
            domain,
            maxAge: 0,
          });
        }
      }

      response.cookies.set(
        "hireveri_session",
        result.sessionId,
        sharedCookieOptions
      );

      return response;
    }

    await recordLegalConsent({
      pool,
      identityId,
      email: normalizedEmail,
      consent: legalConsent,
      ipAddress,
      userAgent,
    });

    response.cookies.set("hireveri_session", result.sessionId, sharedCookieOptions);
    response.cookies.set("authToken", "", {
      ...sharedCookieOptions,
      maxAge: 0,
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
