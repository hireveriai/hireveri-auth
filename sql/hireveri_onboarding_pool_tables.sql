create extension if not exists pgcrypto;

create table if not exists public.hireveri_industries (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  sort_order int not null default 0
);

create index if not exists idx_hireveri_industries_active_sort
  on public.hireveri_industries (is_active, sort_order);

create table if not exists public.hireveri_company_sizes (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  min int not null,
  max int,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create index if not exists idx_hireveri_company_sizes_active_sort
  on public.hireveri_company_sizes (is_active, sort_order);

create table if not exists public.hireveri_recruiter_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  legacy_role_id smallint unique,
  is_active boolean not null default true,
  sort_order int not null default 0
);

alter table if exists public.hireveri_recruiter_roles
  add column if not exists legacy_role_id smallint;

create unique index if not exists idx_hireveri_recruiter_roles_legacy_role_id
  on public.hireveri_recruiter_roles (legacy_role_id)
  where legacy_role_id is not null;

create index if not exists idx_hireveri_recruiter_roles_active_sort
  on public.hireveri_recruiter_roles (is_active, sort_order);

create table if not exists public.hireveri_countries (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  iso_code text not null unique,
  phone_code text not null,
  flag text,
  is_active boolean not null default true,
  sort_order int not null default 0
);

create index if not exists idx_hireveri_countries_active_sort
  on public.hireveri_countries (is_active, sort_order);

insert into public.hireveri_industries (name, is_active, sort_order)
values
  ('Technology', true, 1),
  ('Financial Services', true, 2),
  ('Healthcare', true, 3),
  ('Manufacturing', true, 4),
  ('Retail & E-commerce', true, 5),
  ('Education', true, 6),
  ('Consulting', true, 7),
  ('Logistics & Supply Chain', true, 8),
  ('Media & Entertainment', true, 9),
  ('Energy & Utilities', true, 10)
on conflict (name) do update
set
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

insert into public.hireveri_recruiter_roles (name, legacy_role_id, is_active, sort_order)
values
  ('Talent Acquisition', 1, true, 1),
  ('HR Business Partner', 2, true, 2),
  ('Founder / CEO', 3, true, 3),
  ('Hiring Manager', 4, true, 4),
  ('Recruitment Operations', 5, true, 5),
  ('People Operations', 6, true, 6)
on conflict (name) do update
set
  legacy_role_id = excluded.legacy_role_id,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

insert into public.hireveri_company_sizes (label, min, max, sort_order, is_active)
values
  ('1-10', 1, 10, 1, true),
  ('11-50', 11, 50, 2, true),
  ('51-200', 51, 200, 3, true),
  ('201-1000', 201, 1000, 4, true),
  ('1000+', 1001, null, 5, true)
on conflict (label) do update
set
  min = excluded.min,
  max = excluded.max,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.hireveri_countries (
  name,
  iso_code,
  phone_code,
  flag,
  is_active,
  sort_order
)
values
  ('India', 'IN', '+91', '🇮🇳', true, 1),
  ('United States', 'US', '+1', '🇺🇸', true, 2),
  ('United Kingdom', 'GB', '+44', '🇬🇧', true, 3),
  ('Canada', 'CA', '+1', '🇨🇦', true, 4),
  ('Australia', 'AU', '+61', '🇦🇺', true, 5),
  ('Germany', 'DE', '+49', '🇩🇪', true, 6),
  ('France', 'FR', '+33', '🇫🇷', true, 7),
  ('Singapore', 'SG', '+65', '🇸🇬', true, 8),
  ('United Arab Emirates', 'AE', '+971', '🇦🇪', true, 9),
  ('Saudi Arabia', 'SA', '+966', '🇸🇦', true, 10),
  ('South Africa', 'ZA', '+27', '🇿🇦', true, 11),
  ('Japan', 'JP', '+81', '🇯🇵', true, 12),
  ('South Korea', 'KR', '+82', '🇰🇷', true, 13),
  ('Indonesia', 'ID', '+62', '🇮🇩', true, 14),
  ('Malaysia', 'MY', '+60', '🇲🇾', true, 15),
  ('Thailand', 'TH', '+66', '🇹🇭', true, 16),
  ('Vietnam', 'VN', '+84', '🇻🇳', true, 17),
  ('Brazil', 'BR', '+55', '🇧🇷', true, 18),
  ('Mexico', 'MX', '+52', '🇲🇽', true, 19),
  ('Netherlands', 'NL', '+31', '🇳🇱', true, 20),
  ('Ireland', 'IE', '+353', '🇮🇪', true, 21),
  ('Italy', 'IT', '+39', '🇮🇹', true, 22),
  ('Spain', 'ES', '+34', '🇪🇸', true, 23),
  ('Sweden', 'SE', '+46', '🇸🇪', true, 24),
  ('Switzerland', 'CH', '+41', '🇨🇭', true, 25),
  ('Nigeria', 'NG', '+234', '🇳🇬', true, 26),
  ('Kenya', 'KE', '+254', '🇰🇪', true, 27),
  ('Philippines', 'PH', '+63', '🇵🇭', true, 28),
  ('New Zealand', 'NZ', '+64', '🇳🇿', true, 29),
  ('Poland', 'PL', '+48', '🇵🇱', true, 30)
on conflict (iso_code) do update
set
  name = excluded.name,
  phone_code = excluded.phone_code,
  flag = excluded.flag,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;
