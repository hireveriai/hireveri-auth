/**
 * Recruiter session idle timeout
 * ------------------------------
 * auth_sessions.expires_at is the hard ceiling (30 days). This is the softer
 * inactivity ceiling: a session whose last_seen_at is older than this is
 * treated as dead, deactivated, and the recruiter is sent back to the recruiter
 * login screen rather than shown a "workspace access blocked" interstitial.
 *
 * last_seen_at is stamped on every validated request — see
 * lib/session/requireSession.ts here and
 * recruiter-dashboard/lib/server/auth-context.ts.
 */
export const IDLE_SESSION_TIMEOUT_HOURS = 12;
