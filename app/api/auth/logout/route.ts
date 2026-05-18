import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPool } from "@/lib/db-admin";
import { getSharedCookieOptions } from "@/lib/auth/shared-cookie";

const AUTH_COOKIE_NAMES = [
  "hireveri_session",
  "authToken",
  "accessToken",
  "access_token",
  "token",
];
const COOKIE_DOMAINS = [undefined, ".hireveri.com", ".verihireai.work"];

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

  for (const name of AUTH_COOKIE_NAMES) {
    for (const domain of COOKIE_DOMAINS) {
      response.cookies.set(name, "", {
        ...expiredCookieOptions,
        ...(domain ? { domain } : {}),
      });
    }
  }
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

  const response = NextResponse.json(
    { success: true },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
      },
    }
  );
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
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  response.headers.set("Pragma", "no-cache");
  clearAuthCookies(response, req);

  return response;
}
