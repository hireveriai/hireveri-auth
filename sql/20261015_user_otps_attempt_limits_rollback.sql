-- Rollback for 20261015_user_otps_attempt_limits.sql.
--
-- Deploy the previous auth app first: the attempt-limit code reads and writes
-- these columns. The columns can also simply be left in place after a code
-- rollback; older code ignores them.

DROP INDEX IF EXISTS public.idx_user_otps_identity_created;

ALTER TABLE public.user_otps
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS failed_attempts;
