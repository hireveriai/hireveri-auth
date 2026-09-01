-- Store the email the OTP was requested for so user_otps is self-describing.
ALTER TABLE public.user_otps
  ADD COLUMN IF NOT EXISTS email text;

CREATE INDEX IF NOT EXISTS idx_user_otps_email
  ON public.user_otps (lower(email));
