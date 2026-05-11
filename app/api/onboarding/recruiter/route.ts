import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-admin";
import { requireSession } from "@/lib/session/requireSession";
import { fallbackRecruiterRoles } from "@/lib/pools/fallback-pools";

const recruiterApp =
  process.env.RECRUITER_APP_URL || "https://recruiter.hireveri.com";
const recruiterAppTemplate = process.env.RECRUITER_APP_URL_TEMPLATE;

function buildRecruiterAppUrl(params: {
  organizationId?: string | null;
  userId?: string | null;
}) {
  const { organizationId, userId } = params;

  if (recruiterAppTemplate) {
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
    const { identity_id } = await requireSession();
    const {
      firstName,
      lastName,
      companyName,
      recruiterRole,
      recruiterRoleName,
    } = await req.json();

    if (!firstName || !lastName || !companyName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const pool = getPool();
    const identityRes = await pool.query(
      `
      SELECT lower(coalesce(primary_email, email)) AS email
      FROM identity_users
      WHERE identity_id = $1
      `,
      [identity_id]
    );

    const email = identityRes.rows[0]?.email;

    if (!email) {
      return NextResponse.json(
        { error: "Authenticated email not found" },
        { status: 400 }
      );
    }

    const fullName = `${firstName} ${lastName}`.trim();
    let recruiterRoleId: number | null = null;

    if (typeof recruiterRole === "string" && recruiterRole.trim()) {
      const roleLookup = await pool.query(
        `
        select legacy_role_id
        from public.hireveri_recruiter_roles
        where id = $1::uuid
          and is_active = true
        limit 1
        `,
        [recruiterRole]
      );

      recruiterRoleId = roleLookup.rows[0]?.legacy_role_id ?? null;

      if (recruiterRoleId === null && Number.isFinite(Number(recruiterRole))) {
        recruiterRoleId = Number(recruiterRole);
      }
    }

    if (
      recruiterRoleId === null &&
      typeof recruiterRoleName === "string" &&
      recruiterRoleName.trim()
    ) {
      recruiterRoleId =
        fallbackRecruiterRoles.find(
          (role) => role.name.toLowerCase() === recruiterRoleName.trim().toLowerCase()
        )?.legacyRoleId ?? null;
    }

    const res = await pool.query(
      `
      SELECT *
      FROM sp_onboard_recruiter(
        $1::uuid,
        $2::text,
        $3::text,
        $4::text,
        $5::smallint
      )
      `,
      [
        identity_id,
        email,
        fullName,
        companyName,
        recruiterRoleId,
      ]
    );


    const result = res.rows[0] ?? null;

    return NextResponse.json({
      success: true,
      result,
      nextRoute: buildRecruiterAppUrl({
        organizationId: result?.organization_id,
        userId: result?.user_id,
      }),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Recruiter onboarding failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
