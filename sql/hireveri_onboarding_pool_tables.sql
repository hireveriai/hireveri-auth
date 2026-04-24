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
