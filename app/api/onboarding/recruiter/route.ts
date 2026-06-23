import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-admin";
import { sendEmail } from "@/lib/email";
import { requireSession } from "@/lib/session/requireSession";
import { fallbackRecruiterRoles } from "@/lib/pools/fallback-pools";

const recruiterApp =
  process.env.RECRUITER_APP_URL || "https://recruiter.hireveri.com";
const recruiterAppTemplate = process.env.RECRUITER_APP_URL_TEMPLATE;
const organizationSignupAlertRecipient =
  process.env.ORGANIZATION_SIGNUP_ALERT_EMAIL || "jatin.singh@hireveri.com";

function buildRecruiterAppUrl(params: {
  organizationId?: string | null;
  userId?: string | null;
  nextPath?: string | null;
}) {
  const { organizationId, userId } = params;
  const safeNextPath = getSafeRecruiterNextPath(params.nextPath);

  if (recruiterAppTemplate && safeNextPath === "/") {
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

  const url = new URL(safeNextPath, recruiterApp);

  if (organizationId) {
    url.searchParams.set("organizationId", organizationId);
  }

  if (userId) {
    url.searchParams.set("userId", userId);
  }

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

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDetailValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function buildOrganizationSignupEmail(params: {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: unknown;
  companyName: string;
  recruiterRole?: unknown;
  recruiterRoleName?: unknown;
  industryId?: unknown;
  industryName?: unknown;
  companySizeId?: unknown;
  companySizeLabel?: unknown;
  country?: unknown;
  organizationId?: unknown;
  userId?: unknown;
}) {
  const details = [
    ["Organization", params.companyName],
    ["Organization ID", params.organizationId],
    ["Recruiter name", params.fullName],
    ["First name", params.firstName],
    ["Last name", params.lastName],
    ["Work email", params.email],
    ["Phone", params.phone],
    ["Recruiter role ID", params.recruiterRole],
    ["Recruiter role", params.recruiterRoleName],
    ["Industry ID", params.industryId],
    ["Industry", params.industryName],
    ["Company size ID", params.companySizeId],
    ["Company size", params.companySizeLabel],
    ["Country", params.country],
    ["User ID", params.userId],
    ["Signed up at", new Date().toISOString()],
  ] as const;

  const text = [
    "A new HireVeri organization signed up.",
    "",
    ...details.map(([label, value]) => `${label}: ${formatDetailValue(value)}`),
  ].join("\n");

  const rows = details
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f8fafc">${escapeHtml(label)}</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb">${escapeHtml(formatDetailValue(value))}</td>
        </tr>
      `
    )
    .join("");

  return {
    to: organizationSignupAlertRecipient,
    subject: `New HireVeri organization signup: ${params.companyName}`,
    text,
    idempotencyKey: `organization-signup-${params.organizationId || params.email}`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#0f172a">
        <h2>New HireVeri organization signup</h2>
        <p>A new organization has completed recruiter onboarding.</p>
        <table style="border-collapse:collapse;width:100%;max-width:720px">${rows}</table>
      </div>
    `,
  };
}

async function hasExistingRecruiterWorkspace(pool: ReturnType<typeof getPool>, email: string) {
  const existingRes = await pool.query(
    `
    WITH auth_match AS (
      SELECT 1
      FROM public.auth_users au
      JOIN public.organization_memberships om
        ON om.auth_user_id = au.id
      JOIN public.organizations o
        ON o.organization_id = om.org_id
       AND coalesce(o.is_active, true) = true
      WHERE au.email_normalized = $1::text
        AND om.role IN ('RECRUITER', 'ORG_OWNER', 'ADMIN', 'INTERVIEWER')
      LIMIT 1
    ),
    legacy_match AS (
      SELECT 1
      FROM public.users u
      JOIN public.organizations o
        ON o.organization_id = u.organization_id
       AND coalesce(o.is_active, true) = true
      WHERE lower(u.email) = $1::text
        AND u.role IN ('RECRUITER', 'ORG_OWNER', 'ADMIN')
        AND u.is_active = true
      LIMIT 1
    )
    SELECT 1
    FROM (
      SELECT * FROM auth_match
      UNION ALL
      SELECT * FROM legacy_match
    ) existing
    LIMIT 1
    `,
    [email]
  );

  return existingRes.rows.length > 0;
}

async function pruneOrphanedRecruiterWorkspaceRefs(pool: ReturnType<typeof getPool>, email: string) {
  await pool.query(
    `
    WITH target_auth AS (
      SELECT id
      FROM public.auth_users
      WHERE email_normalized = $1::text
    )
    DELETE FROM public.organization_memberships om
    USING target_auth ta
    WHERE om.auth_user_id = ta.id
      AND om.role IN ('RECRUITER', 'ORG_OWNER', 'ADMIN', 'INTERVIEWER')
      AND NOT EXISTS (
        SELECT 1
        FROM public.organizations o
        WHERE o.organization_id = om.org_id
      )
    `,
    [email]
  );

  await pool.query(
    `
    UPDATE public.users u
    SET is_active = false
    WHERE lower(u.email) = $1::text
      AND u.role IN ('RECRUITER', 'ORG_OWNER', 'ADMIN')
      AND u.is_active = true
      AND NOT EXISTS (
        SELECT 1
        FROM public.organizations o
        WHERE o.organization_id = u.organization_id
      )
    `,
    [email]
  );
}

function shouldSendOrganizationSignupAlert(result: Record<string, unknown> | null, hadExistingWorkspace: boolean) {
  if (typeof result?.created_new === "boolean") {
    return result.created_new;
  }

  if (typeof result?.organization_created === "boolean") {
    return result.organization_created;
  }

  return !hadExistingWorkspace;
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
      phone,
      industryId,
      industryName,
      companySizeId,
      companySizeLabel,
      country,
      next,
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
    await pruneOrphanedRecruiterWorkspaceRefs(pool, email);
    const hadExistingWorkspace = await hasExistingRecruiterWorkspace(pool, email);

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

    if (shouldSendOrganizationSignupAlert(result, hadExistingWorkspace)) {
      try {
        await sendEmail(
          buildOrganizationSignupEmail({
            firstName,
            lastName,
            fullName,
            email,
            phone,
            companyName,
            recruiterRole,
            recruiterRoleName,
            industryId,
            industryName,
            companySizeId,
            companySizeLabel,
            country,
            organizationId: result?.organization_id,
            userId: result?.user_id,
          })
        );
      } catch (emailError) {
        console.warn("ORGANIZATION SIGNUP ALERT EMAIL FAILED:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      result,
      nextRoute: buildRecruiterAppUrl({
        organizationId: result?.organization_id,
        userId: result?.user_id,
        nextPath: getSafeRecruiterNextPath(next),
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
