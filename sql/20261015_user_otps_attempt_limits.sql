-- OTP brute-force limits.
--
-- failed_attempts: wrong guesses against a code. verify-otp increments it in a
--   single UPDATE and voids the code (used_at) once it reaches the limit, so a
--   6-digit code can no longer be guessed without bound.
-- created_at: when the code was issued. request-otp counts codes issued per
--   identity in a rolling window to cap how many codes (and emails) one
--   identity can be sent.
--
-- Additive and safe to apply before the app deploy: the current code ignores
-- both columns. Rollback: 20261015_user_otps_attempt_limits_rollback.sql.

ALTER TABLE public.user_otps
  ADD COLUMN IF NOT EXISTS failed_attempts smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Existing rows would otherwise all read as issued at migration time and could
-- trip the request cap for the first window. Codes have always been issued
-- with a 5-minute expiry, so that is the best available issue time.
UPDATE public.user_otps
SET created_at = expires_at - interval '5 minutes'
WHERE expires_at IS NOT NULL
  AND created_at > expires_at - interval '5 minutes';

-- verify-otp (latest live code) and request-otp (codes issued in the window)
-- both look up by identity; there was no index on identity_id at all.
CREATE INDEX IF NOT EXISTS idx_user_otps_identity_created
  ON public.user_otps (identity_id, created_at DESC);
