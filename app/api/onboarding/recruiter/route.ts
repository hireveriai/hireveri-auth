import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPool } from "@/lib/db-admin";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("hireveri_session")?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const {
    firstName,
    lastName,
    phone,
    companyName,
    recruiterRole,
    industry,
    country,
    companySize,
  } = await req.json();

  if (!firstName || !lastName || !companyName) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const res = await pool.query(
  `
  SELECT *
  FROM sp_onboard_recruiter(
    $1::uuid,
    $2::text,
    $3::text,
    $4::text,
    $5::text
  )
  `,
  [
    sessionId,
    companyName,
    firstName,
    lastName,
    phone || null,
  ]
);


    return NextResponse.json({
      success: true,
      result: res.rows[0] ?? null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Recruiter onboarding failed" },
      { status: 500 }
    );
  }
}
