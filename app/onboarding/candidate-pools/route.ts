import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-admin";

export async function GET() {
  const pool = getPool();

  const { rows } = await pool.query(
    `select sp_get_practice_candidate_onboarding_pools() as data`
  );

  return NextResponse.json(rows[0].data);
}
