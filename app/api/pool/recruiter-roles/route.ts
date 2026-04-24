import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-admin";
import { fallbackRecruiterRoles } from "@/lib/pools/fallback-pools";

export async function GET() {
  try {
    const pool = getPool();
    const { rows } = await pool.query(
      `
      select
        id,
        name,
        sort_order as "sortOrder"
      from public.hireveri_recruiter_roles
      where is_active = true
      order by sort_order asc, name asc
      `
    );

    if (rows.length) {
      return NextResponse.json(rows);
    }
  } catch (error) {
    console.warn("POOL RECRUITER ROLES FALLBACK:", error);
  }

  return NextResponse.json(
    fallbackRecruiterRoles.map(({ legacyRoleId: _legacyRoleId, ...role }) => role)
  );
}
