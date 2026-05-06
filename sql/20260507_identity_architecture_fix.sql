-- Enterprise identity boundary fix
-- --------------------------------
-- Auth users are platform login identities. Candidates are interview
-- participants. Candidate/interview email addresses must never reserve a
-- platform login email globally.

create extension if not exists pgcrypto;

/* 1. Platform auth identity and organization membership model */

create table if not exists public.auth_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text not null,
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_auth_users_email_normalized
  on public.auth_users (email_normalized);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references public.auth_users(id) on delete cascade,
  org_id uuid not null references public.organizations(organization_id) on delete cascade,
  role text not null check (
    role in ('RECRUITER', 'ORG_OWNER', 'ADMIN', 'INTERVIEWER', 'SYSTEM')
  ),
  legacy_user_id uuid references public.users(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_organization_memberships_auth_org_role
  on public.organization_memberships (auth_user_id, org_id, role);

create index if not exists idx_organization_memberships_org_role
  on public.organization_memberships (org_id, role);

alter table public.users
  add column if not exists auth_user_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_auth_user_id_fkey'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_auth_user_id_fkey
      foreign key (auth_user_id)
      references public.auth_users(id)
      on delete set null;
  end if;
end $$;

/* 2. Remove legacy global uniqueness from role/profile tables */

alter table public.users
  drop constraint if exists users_email_unique;

alter table public.users
  drop constraint if exists users_identity_id_key;

alter table public.identity_users
  drop constraint if exists identity_users_email_unique;

drop index if exists public.users_email_unique;
drop index if exists public.users_identity_id_key;
drop index if exists public.identity_users_email_unique;

create index if not exists idx_users_email_lookup
  on public.users (lower(email));

create index if not exists idx_users_identity_lookup
  on public.users (identity_id)
  where identity_id is not null;

create index if not exists idx_identity_users_email_lookup
  on public.identity_users (lower(coalesce(primary_email, email)))
  where coalesce(primary_email, email) is not null;

create index if not exists idx_identity_users_email_intent_lookup
  on public.identity_users (lower(coalesce(primary_email, email)), intent)
  where coalesce(primary_email, email) is not null;

/* 3. Backfill platform auth users and memberships from existing non-candidate users */

insert into public.auth_users (
  id,
  email,
  email_normalized,
  password_hash,
  created_at,
  updated_at
)
select distinct on (lower(u.email))
  u.user_id,
  lower(u.email),
  lower(u.email),
  u.password_hash,
  u.created_at,
  now()
from public.users u
where u.role <> 'CANDIDATE'
  and u.email is not null
order by lower(u.email), u.created_at asc
on conflict (email_normalized) do update
set
  password_hash = coalesce(public.auth_users.password_hash, excluded.password_hash),
  updated_at = now();

update public.users u
set auth_user_id = au.id
from public.auth_users au
where u.auth_user_id is null
  and u.role <> 'CANDIDATE'
  and lower(u.email) = au.email_normalized;

insert into public.organization_memberships (
  auth_user_id,
  org_id,
  role,
  legacy_user_id
)
select
  u.auth_user_id,
  u.organization_id,
  u.role,
  u.user_id
from public.users u
where u.auth_user_id is not null
  and u.role in ('RECRUITER', 'ORG_OWNER', 'ADMIN', 'SYSTEM')
on conflict (auth_user_id, org_id, role) do update
set
  legacy_user_id = coalesce(
    public.organization_memberships.legacy_user_id,
    excluded.legacy_user_id
  ),
  updated_at = now();

/* 4. Candidate profile storage that is independent of platform auth users */

alter table public.candidates
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists primary_role_id uuid,
  add column if not exists experience_level_code text;

do $$
begin
  if to_regclass('public.global_role_pool') is not null
    and not exists (
      select 1
      from pg_constraint
      where conname = 'candidates_primary_role_id_fkey'
        and conrelid = 'public.candidates'::regclass
    )
  then
    alter table public.candidates
      add constraint candidates_primary_role_id_fkey
      foreign key (primary_role_id)
      references public.global_role_pool(role_pool_id);
  end if;

  if to_regclass('public.experience_level_pool') is not null
    and not exists (
      select 1
      from pg_constraint
      where conname = 'candidates_experience_level_code_fkey'
        and conrelid = 'public.candidates'::regclass
    )
  then
    alter table public.candidates
      add constraint candidates_experience_level_code_fkey
      foreign key (experience_level_code)
      references public.experience_level_pool(code);
  end if;
end $$;

create table if not exists public.candidate_identity_links (
  identity_id uuid not null references public.identity_users(identity_id) on delete cascade,
  candidate_id uuid not null references public.candidates(candidate_id) on delete cascade,
  purpose text not null default 'practice',
  created_at timestamptz not null default now(),
  primary key (identity_id, candidate_id)
);

create index if not exists idx_candidate_identity_links_identity
  on public.candidate_identity_links (identity_id, purpose, created_at desc);

create index if not exists idx_candidate_identity_links_candidate
  on public.candidate_identity_links (candidate_id);

create table if not exists public.candidate_primary_skills (
  candidate_id uuid not null references public.candidates(candidate_id) on delete cascade,
  skill_id uuid not null references public.global_skill_pool(skill_id),
  confidence_score int,
  created_at timestamptz not null default now(),
  primary key (candidate_id, skill_id)
);

create index if not exists idx_candidates_org_email_lookup
  on public.candidates (organization_id, lower(email))
  where email is not null;

create index if not exists idx_interview_invites_candidate_email_lookup
  on public.interview_invites (lower(coalesce(candidate_email, email)))
  where coalesce(candidate_email, email) is not null;

/* 5. Role-aware auth lookup helper */

create or replace function public.fn_find_existing_recruiter_user(
  p_identity_id uuid,
  p_email text
)
returns table (
  user_id uuid,
  organization_id uuid,
  full_name text,
  recruiter_profile_exists boolean
)
language sql
stable
as $function$
  with normalized as (
    select lower(nullif(btrim(p_email), '')) as email
  ),
  auth_match as (
    select au.id as auth_user_id
    from public.auth_users au
    cross join normalized n
    where n.email is not null
      and au.email_normalized = n.email
    limit 1
  ),
  membership_match as (
    select
      coalesce(u.user_id, om.legacy_user_id, am.auth_user_id) as user_id,
      coalesce(u.organization_id, om.org_id) as organization_id,
      u.full_name,
      (rp.recruiter_id is not null) as recruiter_profile_exists,
      0 as priority,
      om.created_at
    from auth_match am
    join public.organization_memberships om
      on om.auth_user_id = am.auth_user_id
     and om.role = 'RECRUITER'
    left join public.users u
      on (
        u.user_id = om.legacy_user_id
        or (
          u.auth_user_id = am.auth_user_id
          and u.organization_id = om.org_id
          and u.role = 'RECRUITER'
        )
      )
     and u.is_active = true
    left join public.recruiter_profiles rp
      on rp.recruiter_id = u.user_id
  ),
  legacy_match as (
    select
      u.user_id,
      u.organization_id,
      u.full_name,
      (rp.recruiter_id is not null) as recruiter_profile_exists,
      case when p_identity_id is not null and u.identity_id = p_identity_id then 1 else 2 end as priority,
      u.created_at
    from public.users u
    cross join normalized n
    left join public.recruiter_profiles rp
      on rp.recruiter_id = u.user_id
    where u.role = 'RECRUITER'
      and u.is_active = true
      and (
        (p_identity_id is not null and u.identity_id = p_identity_id)
        or
        (n.email is not null and lower(u.email) = n.email)
      )
  )
  select
    x.user_id,
    x.organization_id,
    x.full_name,
    x.recruiter_profile_exists
  from (
    select * from membership_match
    union all
    select * from legacy_match
  ) x
  order by x.priority, x.created_at asc nulls last
  limit 1;
$function$;

/* 6. Candidate practice no longer creates platform auth users */

create or replace function public.sp_create_practice_candidate(
  p_identity_id uuid,
  p_email text,
  p_full_name text default null::text
)
returns table (
  user_id uuid,
  organization_id uuid,
  created_new boolean
)
language plpgsql
as $function$
declare
  v_candidate_id uuid;
  v_org_id uuid;
  v_email text := lower(nullif(btrim(p_email), ''));
  v_full_name text := coalesce(nullif(btrim(p_full_name), ''), 'Practice Candidate');
  v_created_new boolean := false;
begin
  if p_identity_id is null then
    raise exception 'IDENTITY_REQUIRED: identity_id is required';
  end if;

  if v_email is null then
    raise exception 'EMAIL_REQUIRED: email is required';
  end if;

  insert into public.identity_users (
    identity_id,
    email,
    primary_email,
    intent,
    is_verified
  )
  values (
    p_identity_id,
    v_email,
    v_email,
    'candidate_practice',
    true
  )
  on conflict (identity_id) do update
  set
    email = excluded.email,
    primary_email = excluded.primary_email,
    intent = 'candidate_practice',
    is_verified = true;

  select o.organization_id
  into v_org_id
  from public.organizations o
  where lower(o.organization_name) in ('practice arena', 'practice')
  order by case when lower(o.organization_name) = 'practice arena' then 0 else 1 end
  limit 1;

  if v_org_id is null then
    insert into public.organizations (
      organization_name,
      is_active
    )
    values (
      'Practice Arena',
      true
    )
    returning organizations.organization_id into v_org_id;
  end if;

  select c.candidate_id
  into v_candidate_id
  from public.candidate_identity_links cil
  join public.candidates c
    on c.candidate_id = cil.candidate_id
  where cil.identity_id = p_identity_id
    and c.organization_id = v_org_id
  order by cil.created_at desc
  limit 1;

  if v_candidate_id is null then
    insert into public.candidates (
      organization_id,
      full_name,
      email,
      status
    )
    values (
      v_org_id,
      v_full_name,
      v_email,
      'INVITED'
    )
    returning candidates.candidate_id into v_candidate_id;

    v_created_new := true;
  else
    update public.candidates
    set
      email = v_email,
      full_name = coalesce(nullif(v_full_name, 'Practice Candidate'), full_name),
      updated_at = now()
    where candidate_id = v_candidate_id;
  end if;

  insert into public.candidate_identity_links (
    identity_id,
    candidate_id,
    purpose
  )
  values (
    p_identity_id,
    v_candidate_id,
    'practice'
  )
  on conflict (identity_id, candidate_id) do nothing;

  return query
  select v_candidate_id, v_org_id, v_created_new;
end;
$function$;

create or replace function public.sp_create_practice_candidate(
  p_email text,
  p_identity_id uuid
)
returns uuid
language plpgsql
as $function$
declare
  v_candidate_id uuid;
begin
  select r.user_id
  into v_candidate_id
  from public.sp_create_practice_candidate(
    p_identity_id,
    p_email,
    null::text
  ) r
  limit 1;

  return v_candidate_id;
end;
$function$;

create or replace function public.sp_complete_practice_candidate_onboarding(
  p_identity_id uuid,
  p_first_name text,
  p_last_name text,
  p_role_id uuid,
  p_experience_code text,
  p_skill_ids uuid[]
)
returns void
language plpgsql
as $function$
declare
  v_candidate_id uuid;
  v_org_id uuid;
  v_email text;
  v_full_name text := btrim(concat_ws(' ', nullif(p_first_name, ''), nullif(p_last_name, '')));
  v_legacy_user_id uuid;
begin
  select lower(coalesce(i.primary_email, i.email))
  into v_email
  from public.identity_users i
  where i.identity_id = p_identity_id
  limit 1;

  if v_email is null then
    raise exception 'Identity email not found for %', p_identity_id;
  end if;

  select c.candidate_id, c.organization_id
  into v_candidate_id, v_org_id
  from public.candidate_identity_links cil
  join public.candidates c
    on c.candidate_id = cil.candidate_id
  where cil.identity_id = p_identity_id
  order by cil.created_at desc
  limit 1;

  if v_candidate_id is null then
    select r.user_id, r.organization_id
    into v_candidate_id, v_org_id
    from public.sp_create_practice_candidate(
      p_identity_id,
      v_email,
      nullif(v_full_name, '')
    ) r
    limit 1;
  end if;

  update public.candidates
  set
    first_name = nullif(p_first_name, ''),
    last_name = nullif(p_last_name, ''),
    full_name = coalesce(nullif(v_full_name, ''), full_name),
    primary_role_id = p_role_id,
    experience_level_code = p_experience_code,
    updated_at = now()
  where candidate_id = v_candidate_id;

  delete from public.candidate_primary_skills
  where candidate_id = v_candidate_id;

  insert into public.candidate_primary_skills (
    candidate_id,
    skill_id
  )
  select distinct v_candidate_id, unnest(coalesce(p_skill_ids, '{}'::uuid[]));

  -- Compatibility only: update existing legacy candidate-user records without
  -- creating any new candidate auth users.
  select u.user_id
  into v_legacy_user_id
  from public.users u
  where u.role = 'CANDIDATE'
    and (
      u.identity_id = p_identity_id
      or lower(u.email) = v_email
    )
  order by case when u.identity_id = p_identity_id then 0 else 1 end, u.created_at asc
  limit 1;

  if v_legacy_user_id is not null then
    update public.users
    set
      first_name = nullif(p_first_name, ''),
      last_name = nullif(p_last_name, ''),
      full_name = coalesce(nullif(v_full_name, ''), full_name),
      primary_role_id = p_role_id,
      experience_level_code = p_experience_code
    where user_id = v_legacy_user_id;

    insert into public.candidate_profiles (
      candidate_id,
      career_track_id,
      experience_level_id
    )
    select
      v_legacy_user_id,
      1,
      el.experience_level_id
    from public.experience_level_pool el
    where el.code = p_experience_code
    on conflict (candidate_id) do nothing;

    delete from public.user_primary_skills
    where user_id = v_legacy_user_id;

    insert into public.user_primary_skills (
      user_id,
      skill_id
    )
    select distinct v_legacy_user_id, unnest(coalesce(p_skill_ids, '{}'::uuid[]));
  end if;
end;
$function$;

/* 7. Recruiter signup checks platform auth identity, then creates membership */

create or replace function public.sp_onboard_recruiter(
  p_identity_id uuid,
  p_email text,
  p_full_name text,
  p_company_name text,
  p_recruiter_role_id smallint default null::smallint
)
returns table (
  user_id uuid,
  organization_id uuid,
  created_new boolean
)
language plpgsql
as $function$
declare
  v_email text := lower(nullif(btrim(p_email), ''));
  v_auth_user_id uuid;
  v_existing_user_id uuid;
  v_existing_org_id uuid;
  v_org_id uuid;
  v_user_id uuid;
begin
  if p_identity_id is null then
    raise exception 'IDENTITY_REQUIRED: identity_id is required';
  end if;

  if v_email is null then
    raise exception 'EMAIL_REQUIRED: email is required';
  end if;

  insert into public.identity_users (
    identity_id,
    email,
    primary_email,
    intent,
    is_verified
  )
  values (
    p_identity_id,
    v_email,
    v_email,
    'recruiter_login',
    true
  )
  on conflict (identity_id) do update
  set
    email = excluded.email,
    primary_email = excluded.primary_email,
    intent = 'recruiter_login',
    is_verified = true;

  select au.id
  into v_auth_user_id
  from public.auth_users au
  where au.email_normalized = v_email
  limit 1;

  if v_auth_user_id is null then
    begin
      insert into public.auth_users (
        email,
        email_normalized
      )
      values (
        v_email,
        v_email
      )
      returning id into v_auth_user_id;
    exception
      when unique_violation then
        select au.id
        into v_auth_user_id
        from public.auth_users au
        where au.email_normalized = v_email
        limit 1;
    end;
  end if;

  select u.user_id, om.org_id
  into v_existing_user_id, v_existing_org_id
  from public.organization_memberships om
  left join public.users u
    on (
      u.user_id = om.legacy_user_id
      or (
        u.auth_user_id = om.auth_user_id
        and u.organization_id = om.org_id
        and u.role = 'RECRUITER'
      )
    )
   and u.is_active = true
  where om.auth_user_id = v_auth_user_id
    and om.role = 'RECRUITER'
  order by om.created_at asc
  limit 1;

  if v_existing_org_id is not null then
    if v_existing_user_id is null then
      insert into public.users (
        organization_id,
        auth_user_id,
        full_name,
        email,
        role,
        is_active,
        is_email_verified,
        identity_id
      )
      values (
        v_existing_org_id,
        v_auth_user_id,
        nullif(p_full_name, ''),
        v_email,
        'RECRUITER',
        true,
        true,
        p_identity_id
      )
      returning users.user_id into v_existing_user_id;
    else
      update public.users
      set
        auth_user_id = coalesce(auth_user_id, v_auth_user_id),
        identity_id = coalesce(identity_id, p_identity_id),
        full_name = coalesce(nullif(p_full_name, ''), full_name),
        email = v_email,
        is_email_verified = true
      where user_id = v_existing_user_id;
    end if;

    update public.organization_memberships
    set
      legacy_user_id = coalesce(legacy_user_id, v_existing_user_id),
      updated_at = now()
    where auth_user_id = v_auth_user_id
      and org_id = v_existing_org_id
      and role = 'RECRUITER';

    insert into public.recruiter_profiles (
      recruiter_id,
      company_name,
      recruiter_role_id,
      organization_id
    )
    values (
      v_existing_user_id,
      coalesce(nullif(p_company_name, ''), 'Organization'),
      p_recruiter_role_id,
      v_existing_org_id
    )
    on conflict (recruiter_id) do nothing;

    return query
    select v_existing_user_id, v_existing_org_id, false;
    return;
  end if;

  select x.user_id, x.organization_id
  into v_existing_user_id, v_existing_org_id
  from public.fn_find_existing_recruiter_user(p_identity_id, v_email) x;

  if v_existing_user_id is not null then
    update public.users
    set
      auth_user_id = coalesce(auth_user_id, v_auth_user_id),
      identity_id = coalesce(identity_id, p_identity_id),
      full_name = coalesce(nullif(p_full_name, ''), full_name),
      email = v_email,
      is_email_verified = true
    where user_id = v_existing_user_id;

    insert into public.organization_memberships (
      auth_user_id,
      org_id,
      role,
      legacy_user_id
    )
    values (
      v_auth_user_id,
      v_existing_org_id,
      'RECRUITER',
      v_existing_user_id
    )
    on conflict (auth_user_id, org_id, role) do update
    set
      legacy_user_id = coalesce(
        public.organization_memberships.legacy_user_id,
        excluded.legacy_user_id
      ),
      updated_at = now();

    insert into public.recruiter_profiles (
      recruiter_id,
      company_name,
      recruiter_role_id,
      organization_id
    )
    values (
      v_existing_user_id,
      coalesce(nullif(p_company_name, ''), 'Organization'),
      p_recruiter_role_id,
      v_existing_org_id
    )
    on conflict (recruiter_id) do nothing;

    return query
    select v_existing_user_id, v_existing_org_id, false;
    return;
  end if;

  insert into public.organizations (
    organization_name,
    is_active
  )
  values (
    coalesce(nullif(p_company_name, ''), coalesce(nullif(p_full_name, ''), 'Recruiter Organization')),
    true
  )
  returning organizations.organization_id into v_org_id;

  insert into public.organization_memberships (
    auth_user_id,
    org_id,
    role
  )
  values (
    v_auth_user_id,
    v_org_id,
    'RECRUITER'
  );

  insert into public.users (
    organization_id,
    auth_user_id,
    full_name,
    email,
    role,
    is_active,
    is_email_verified,
    identity_id
  )
  values (
    v_org_id,
    v_auth_user_id,
    nullif(p_full_name, ''),
    v_email,
    'RECRUITER',
    true,
    true,
    p_identity_id
  )
  returning users.user_id into v_user_id;

  update public.organization_memberships
  set
    legacy_user_id = v_user_id,
    updated_at = now()
  where auth_user_id = v_auth_user_id
    and org_id = v_org_id
    and role = 'RECRUITER';

  insert into public.recruiter_profiles (
    recruiter_id,
    company_name,
    recruiter_role_id,
    organization_id
  )
  values (
    v_user_id,
    coalesce(nullif(p_company_name, ''), 'Organization'),
    p_recruiter_role_id,
    v_org_id
  );

  return query
  select v_user_id, v_org_id, true;
end;
$function$;

create or replace function public.sp_onboard_recruiter(
  p_session_id uuid,
  p_company_name text,
  p_first_name text,
  p_last_name text,
  p_phone text
)
returns table (
  user_id uuid,
  organization_id uuid,
  already_exists boolean
)
language plpgsql
as $function$
declare
  v_identity_id uuid;
  v_email text;
  v_full_name text := btrim(concat_ws(' ', nullif(p_first_name, ''), nullif(p_last_name, '')));
  v_result record;
begin
  select iu.identity_id, lower(coalesce(iu.primary_email, iu.email))
  into v_identity_id, v_email
  from public.auth_sessions s
  join public.identity_users iu
    on iu.identity_id = s.identity_id
  where s.session_id = p_session_id
    and s.is_active = true
    and s.expires_at > now()
  limit 1;

  if v_identity_id is null then
    raise exception 'Invalid or expired session';
  end if;

  for v_result in
    select *
    from public.sp_onboard_recruiter(
      v_identity_id,
      v_email,
      nullif(v_full_name, ''),
      p_company_name,
      null::smallint
    )
  loop
    update public.users
    set
      first_name = nullif(p_first_name, ''),
      last_name = nullif(p_last_name, ''),
      phone = nullif(p_phone, '')
    where users.user_id = v_result.user_id;

    return query
    select
      v_result.user_id,
      v_result.organization_id,
      not v_result.created_new;
    return;
  end loop;
end;
$function$;
