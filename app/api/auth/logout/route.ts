import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPool } from "@/lib/db-admin";
import { getSharedCookieOptions } from "@/lib/auth/shared-cookie";

function getSafeNextPath(req: Request) {
  const next = new URL(req.url).searchParams.get("next");

  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }

  return "/recruiter-access";
}

function clearAuthCookies(response: NextResponse, req: Request) {
  const expiredCookieOptions = {
    ...getSharedCookieOptions(req),
    maxAge: 0,
  };

  response.cookies.set("hireveri_session", "", expiredCookieOptions);
  response.cookies.set("authToken", "", expiredCookieOptions);
}

async function deactivateCurrentSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("hireveri_session")?.value;

  if (!sessionId) {
    return;
  }

  const pool = getPool();

  await pool.query(
    `
    UPDATE public.auth_sessions
    SET is_active = false
    WHERE session_id = $1
    `,
    [sessionId]
  );
}

export async function POST(req: Request) {
  try {
    await deactivateCurrentSession();
  } catch (error) {
    console.error("AUTH LOGOUT ERROR:", error);
  }

  const response = NextResponse.json({ success: true });
  clearAuthCookies(response, req);

  return response;
}

export async function GET(req: Request) {
  try {
    await deactivateCurrentSession();
  } catch (error) {
    console.error("AUTH LOGOUT ERROR:", error);
  }

  const redirectUrl = new URL(getSafeNextPath(req), req.url);
  const response = NextResponse.redirect(redirectUrl);
  clearAuthCookies(response, req);

  return response;
}
