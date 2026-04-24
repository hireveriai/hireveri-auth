import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-admin";

export async function GET() {
  try {
    const pool = getPool();
    const { rows } = await pool.query(
      `
      select
        name,
        iso_code as "isoCode",
        phone_code as "phoneCode",
        flag
      from public.hireveri_countries
      where is_active = true
      order by sort_order asc, name asc
      `
    );

    return NextResponse.json(rows);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load countries";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
