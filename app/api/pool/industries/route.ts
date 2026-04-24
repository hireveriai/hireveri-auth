import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-admin";
import { fallbackIndustries } from "@/lib/pools/fallback-pools";

export async function GET() {
  try {
    const pool = getPool();
    const { rows } = await pool.query(
      `
      select
        id,
        name,
        sort_order as "sortOrder"
      from public.hireveri_industries
      where is_active = true
      order by sort_order asc, name asc
      `
    );

    if (rows.length) {
      return NextResponse.json(rows);
    }
  } catch (error) {
    console.warn("POOL INDUSTRIES FALLBACK:", error);
  }

  return NextResponse.json(fallbackIndustries);
}
