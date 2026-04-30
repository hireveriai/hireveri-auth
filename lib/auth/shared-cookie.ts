const SESSION_COOKIE_DOMAIN = process.env.SESSION_COOKIE_DOMAIN;
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getRequestHostname(req: Request) {
  const forwardedHost = req.headers.get("x-forwarded-host");

  if (forwardedHost) {
    return forwardedHost.split(",")[0]?.trim().split(":")[0] || null;
  }

  const host = req.headers.get("host");

  if (host) {
    return host.split(":")[0] || null;
  }

  try {
    return new URL(req.url).hostname;
  } catch {
    return null;
  }
}

function isIpAddress(hostname: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":");
}

function deriveCookieDomain(hostname: string) {
  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    isIpAddress(hostname)
  ) {
    return undefined;
  }

  const parts = hostname.split(".").filter(Boolean);

  if (parts.length < 2) {
    return undefined;
  }

  return `.${parts.slice(-2).join(".")}`;
}

function hostnameMatchesCookieDomain(hostname: string, cookieDomain: string) {
  const normalizedDomain = cookieDomain.replace(/^\./, "");

  return (
    hostname === normalizedDomain || hostname.endsWith(`.${normalizedDomain}`)
  );
}

export function resolveSharedCookieDomain(req: Request) {
  if (process.env.NODE_ENV !== "production") {
    return undefined;
  }

  const requestHostname = getRequestHostname(req);
  const configuredDomain = SESSION_COOKIE_DOMAIN?.trim();

  if (
    configuredDomain &&
    requestHostname &&
    hostnameMatchesCookieDomain(requestHostname, configuredDomain)
  ) {
    return configuredDomain;
  }

  if (requestHostname) {
    return deriveCookieDomain(requestHostname);
  }

  return configuredDomain || undefined;
}

export function getSharedCookieOptions(
  req: Request,
  maxAge = AUTH_COOKIE_MAX_AGE_SECONDS
) {
  return {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    domain: resolveSharedCookieDomain(req),
    maxAge,
  } as const;
}
