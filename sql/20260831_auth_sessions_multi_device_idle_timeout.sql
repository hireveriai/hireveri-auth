-- Recruiter sessions: allow multiple concurrent devices + 12h idle timeout
-- =======================================================================
--
-- 1. Multi-device login
--    ux_signup_session_per_identity was a partial UNIQUE index that allowed
--    exactly one active recruiter session (auth_intent_id = 2) per identity.
--    Signing in on a second device collided with it, which is why the app had
--    to retire every live session on each verify-otp — logging the first device
--    out. Dropping the uniqueness lets one identity hold many active sessions;
--    the plain index keeps the "active sessions for this identity" lookups fast.
--
-- 2. Idle timeout
--    auth_sessions only tracked issued_at/expires_at (30 days), so a session
--    stayed valid regardless of use. last_seen_at is stamped by the recruiter
--    apps on every validated request; a session untouched for 12 hours is
--    deactivated and the recruiter is sent back to the login screen.

begin;

-- 1. Multi-device -----------------------------------------------------------

drop index if exists public.ux_signup_session_per_identity;

create index if not exists idx_auth_sessions_identity_active
  on public.auth_sessions (identity_id)
  where (is_active = true);

-- 2. Idle timeout -----------------------------------------------------------

alter table public.auth_sessions
  add column if not exists last_seen_at timestamptz;

update public.auth_sessions
set last_seen_at = coalesce(issued_at, now())
where last_seen_at is null;

alter table public.auth_sessions
  alter column last_seen_at set default now();

alter table public.auth_sessions
  alter column last_seen_at set not null;

create index if not exists idx_auth_sessions_last_seen_at
  on public.auth_sessions (last_seen_at)
  where (is_active = true);

commit;

-- 3. Legacy single-device stored procedure ----------------------------------
--
-- The 4-argument overload of sp_verify_otp_and_issue_session (purpose/TTL
-- based, superseded by the 5-argument email/ip/user-agent overload the auth app
-- calls) still deactivated every session for the identity on each login. Left
-- in place it would silently re-impose single-device login on any caller that
-- uses it, so it now only retires sessions that are already past expiry.

create or replace function public.sp_verify_otp_and_issue_session(
  p_identity_id uuid,
  p_otp_plain text,
  p_purpose text,
  p_session_ttl_seconds integer default 900
)
returns table(session_id uuid, identity_id uuid, auth_intent_id smallint, expires_at timestamptz)
language plpgsql
as $function$
DECLARE
    v_otp_hash TEXT;
    v_otp RECORD;
    v_session_id UUID := gen_random_uuid();
    v_auth_intent_id SMALLINT;
BEGIN
    -- Map purpose -> auth_intent_id (STEP 1: assign)
    v_auth_intent_id := CASE upper(p_purpose)
        WHEN 'SIGNUP' THEN 1
        WHEN 'LOGIN'  THEN 2
        WHEN 'RESET'  THEN 3
        ELSE NULL
    END;

    -- STEP 2: validate
    IF v_auth_intent_id IS NULL THEN
        RAISE EXCEPTION 'Invalid purpose: %', p_purpose;
    END IF;

    -- Hash incoming OTP
    v_otp_hash := encode(digest(p_otp_plain, 'sha256'), 'hex');

    -- Fetch latest valid OTP
    SELECT uo.*
    INTO v_otp
    FROM user_otps uo
    WHERE uo.identity_id = p_identity_id
      AND uo.purpose = upper(p_purpose)
      AND uo.used_at IS NULL
      AND uo.expires_at > now()
    ORDER BY uo.expires_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired OTP';
    END IF;

    -- Compare hash
    IF v_otp.otp_code <> v_otp_hash THEN
        RAISE EXCEPTION 'Invalid or expired OTP';
    END IF;

    -- Mark OTP as used
    UPDATE user_otps
    SET used_at = now()
    WHERE otp_id = v_otp.otp_id;

    -- Retire only sessions that are already dead. Sessions still live on other
    -- devices are intentionally left active: multi-device login is allowed.
    UPDATE auth_sessions s
    SET is_active = false
    WHERE s.identity_id = p_identity_id
      AND s.is_active = true
      AND s.expires_at <= now();

    INSERT INTO auth_sessions (
      session_id,
      identity_id,
      issued_at,
      expires_at,
      is_active,
      auth_intent_id,
      last_seen_at
    )
    VALUES (
      v_session_id,
      p_identity_id,
      now(),
      now() + make_interval(secs => p_session_ttl_seconds),
      true,
      v_auth_intent_id,
      now()
    );

    RETURN QUERY
    SELECT
        v_session_id,
        p_identity_id,
        v_auth_intent_id,
        now() + make_interval(secs => p_session_ttl_seconds);
END;
$function$;
