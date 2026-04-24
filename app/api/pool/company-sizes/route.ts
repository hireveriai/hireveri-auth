import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-admin";
import { fallbackCompanySizes } from "@/lib/pools/fallback-pools";

export async function GET() {
  try {
    const pool = getPool();
    const { rows } = await pool.query(
      `
      select
        id,
        label,
        min,
        max,
        sort_order as "sortOrder"
      from public.hireveri_company_sizes
      where is_active = true
      order by sort_order asc, label asc
      `
    );

    if (rows.length) {
      return NextResponse.json(rows);
    }
  } catch (error) {
    console.warn("POOL COMPANY SIZES FALLBACK:", error);
  }

  return NextResponse.json(fallbackCompanySizes);
}
