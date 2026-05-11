import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-admin";

function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const separatorIndex = part.indexOf("=");

      if (separatorIndex === -1) {
        return acc;
      }

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

export async function GET(request: Request) {
  try {
    const cookies = parseCookieHeader(request.headers.get("cookie"));
    const sessionId = cookies.hireveri_session?.trim();

    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const pool = getPool();
    const result = await pool.query(
      `
      WITH session_identity AS (
        SELECT
          s.identity_id,
          lower(coalesce(iu.primary_email, iu.email)) AS email_normalized
        FROM public.auth_sessions s
        JOIN public.identity_users iu
          ON iu.identity_id = s.identity_id
        WHERE s.session_id = $1::uuid
          AND s.is_active = true
          AND s.expires_at > now()
        LIMIT 1
      ),
      auth_match AS (
        SELECT
          coalesce(u.user_id, om.legacy_user_id) AS user_id,
          om.org_id AS organization_id,
          si.identity_id,
          si.email_normalized,
          0 AS priority
        FROM session_identity si
        JOIN public.auth_users au
          ON au.email_normalized = si.email_normalized
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
        WHERE om.role IN ('RECRUITER', 'ORG_OWNER', 'ADMIN', 'INTERVIEWER')
      ),
      legacy_match AS (
        SELECT
          u.user_id,
          u.organization_id,
          si.identity_id,
          si.email_normalized,
          1 AS priority
        FROM session_identity si
        JOIN public.users u
          ON lower(u.email) = si.email_normalized
        WHERE u.role IN ('RECRUITER', 'ORG_OWNER', 'ADMIN')
          AND u.is_active = true
      )
      SELECT
        candidate.user_id,
        candidate.organization_id,
        candidate.identity_id,
        candidate.email_normalized
      FROM (
        SELECT * FROM auth_match
        UNION ALL
        SELECT * FROM legacy_match
      ) candidate
      WHERE candidate.user_id IS NOT NULL
        AND candidate.organization_id IS NOT NULL
      ORDER BY candidate.priority
      LIMIT 1
      `,
      [sessionId]
    );

    const recruiter = result.rows[0];

    if (!recruiter?.user_id || !recruiter.organization_id) {
      return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
    }

    return NextResponse.json({
      userId: recruiter.user_id,
      organizationId: recruiter.organization_id,
      identityId: recruiter.identity_id,
      email: recruiter.email_normalized,
    });
  } catch (error) {
    console.error("RECRUITER SESSION ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
