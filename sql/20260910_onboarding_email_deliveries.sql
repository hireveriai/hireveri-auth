-- Welcome / onboarding email delivery log.
--
-- Purpose is idempotency, not analytics. Sending a welcome email must happen
-- exactly once per identity per email type, and the existing signup path has
-- several legitimate ways to run twice: a page refresh mid-onboarding, a
-- retried POST, a re-submitted server action, a restored session.
--
-- interview_notification_deliveries already exists but cannot serve this: its
-- organization_id / interview_id / attempt_id columns are NOT NULL, so it is
-- structurally interview-scoped. This is the smallest table that covers
-- signup-time onboarding mail, and it is shaped to accept further onboarding
-- emails later by widening email_type rather than adding tables.
--
-- The unique constraint is the guard itself: the sender INSERTs first with
-- ON CONFLICT DO NOTHING and only sends when it claimed the row, so two
-- concurrent requests cannot both send.

create table if not exists public.onboarding_email_deliveries (
  delivery_id     uuid primary key default gen_random_uuid(),
  identity_id     uuid not null,
  email_type      text not null,
  audience        text not null,
  recipient_email text not null,
  status          text not null default 'PENDING',
  attempts        integer not null default 0,
  last_error      text,
  created_at      timestamptz not null default now(),
  sent_at         timestamptz,
  constraint ux_onboarding_email_once unique (identity_id, email_type),
  constraint ck_onboarding_email_status
    check (status in ('PENDING', 'SENT', 'FAILED'))
);

create index if not exists ix_onboarding_email_deliveries_status
  on public.onboarding_email_deliveries (status, created_at desc);

comment on table public.onboarding_email_deliveries is
  'One row per onboarding email per identity. The unique (identity_id, email_type) constraint is what prevents duplicate welcome emails on refresh/retry.';
