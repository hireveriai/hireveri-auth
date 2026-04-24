import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-admin";
import { fallbackCountries } from "@/lib/pools/fallback-pools";

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

    if (rows.length) {
      return NextResponse.json(rows);
    }
  } catch (error) {
    console.warn("POOL COUNTRIES FALLBACK:", error);
  }

  return NextResponse.json(fallbackCountries);
}
