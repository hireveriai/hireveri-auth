import { NextResponse } from "next/server";
import { verifyRecruiterJwt } from "@/lib/auth/jwt";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json({ error: "Bearer token is required" }, { status: 401 });
  }

  const token = authorization.slice(7).trim();
  const claims = verifyRecruiterJwt(token);

  if (!claims) {
    return NextResponse.json({ error: "Invalid recruiter token" }, { status: 401 });
  }

  return NextResponse.json({
    userId: claims.userId,
    organizationId: claims.orgId,
    email: claims.email ?? null,
  });
}
