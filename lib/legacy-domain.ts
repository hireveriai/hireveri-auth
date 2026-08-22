// lib/legacy-domain.ts

/**
 * Safety net for the VerisNova rebrand.
 *
 * Several *_APP_URL variables are still set to the retired verihireai.work
 * hosts in deployed environments. Those deployments no longer exist, so a
 * stale value sends users to a Vercel DEPLOYMENT_NOT_FOUND page - which is
 * how the post-login redirect broke.
 *
 * This rewrites those hosts forward at read time. It is deliberately a
 * stopgap, not a fix: the environment variables should be corrected. Every
 * rewrite logs a warning naming the variable, so the drift stays visible
 * instead of being silently papered over.
 */

const LEGACY_SUFFIX = "verihireai.work";
const CURRENT_SUFFIX = "verisnova.com";

/** Marketing traffic is canonical on www; apps are on bare subdomains. */
const APEX_REPLACEMENT = `www.${CURRENT_SUFFIX}`;

const warned = new Set<string>();

function warnOnce(source: string, from: string, to: string) {
  const key = `${source}:${from}`;

  if (warned.has(key)) {
    return;
  }

  warned.add(key);
  console.warn(
    `[legacy-domain] ${source} points at the retired ${LEGACY_SUFFIX} domain ` +
      `(${from}). Rewriting to ${to}. Update this variable in the deployment.`
  );
}

function isLegacyHost(hostname: string) {
  return hostname === LEGACY_SUFFIX || hostname.endsWith(`.${LEGACY_SUFFIX}`);
}

/**
 * Map a retired host onto its VerisNova counterpart, preserving the subdomain
 * label and dropping any leading `www.` on a subdomain (www.auth.* -> auth.*).
 * A bare apex becomes www.verisnova.com.
 */
function rewriteHostname(hostname: string) {
  if (hostname === LEGACY_SUFFIX) {
    return APEX_REPLACEMENT;
  }

  let label = hostname.slice(0, -(LEGACY_SUFFIX.length + 1));

  if (label === "www") {
    return APEX_REPLACEMENT;
  }

  if (label.startsWith("www.")) {
    label = label.slice(4);
  }

  return `${label}.${CURRENT_SUFFIX}`;
}

/**
 * Returns the value unchanged unless it is a URL on the retired domain.
 * Non-URL and empty values pass through untouched, so callers can wrap an
 * env read directly without extra guarding.
 */
export function rewriteLegacyDomain<T extends string | null | undefined>(
  value: T,
  source = "URL"
): T {
  if (!value) {
    return value;
  }

  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.toLowerCase();

    if (!isLegacyHost(hostname)) {
      return value;
    }

    url.hostname = rewriteHostname(hostname);
    url.protocol = "https:";

    const rewritten = url.toString();
    warnOnce(source, value, rewritten);

    return rewritten as T;
  } catch {
    // Not a parseable URL - leave it for the caller to deal with.
    return value;
  }
}

/** Read an environment variable and rewrite a retired host if present. */
export function readAppUrlEnv(name: string) {
  return rewriteLegacyDomain(process.env[name], name);
}
