import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-admin";

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

    return NextResponse.json(rows);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load recruiter roles";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
