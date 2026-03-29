import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-admin";
import { requireSession } from "@/lib/session/requireSession";

export async function POST(req: Request) {
  try {
    const { identity_id } = await requireSession();
    const {
      firstName,
      lastName,
      companyName,
      recruiterRole,
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
    const recruiterRoleId = Number.isFinite(Number(recruiterRole))
      ? Number(recruiterRole)
      : null;

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


    return NextResponse.json({
      success: true,
      result: res.rows[0] ?? null,
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
