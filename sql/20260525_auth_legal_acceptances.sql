-- Optional auth consent metadata for HireVeri legal acceptance.
-- The auth API records into this table only when it exists, so deployments can roll this out safely.

create extension if not exists pgcrypto;

create table if not exists public.auth_legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  identity_id uuid not null,
  email_normalized text not null,
  accepted_at timestamptz not null,
  terms_version text not null,
  privacy_version text not null,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint auth_legal_acceptances_identity_versions_unique
    unique (identity_id, terms_version, privacy_version)
);

create index if not exists idx_auth_legal_acceptances_email
  on public.auth_legal_acceptances (email_normalized, accepted_at desc);

create index if not exists idx_auth_legal_acceptances_identity
  on public.auth_legal_acceptances (identity_id, accepted_at desc);
