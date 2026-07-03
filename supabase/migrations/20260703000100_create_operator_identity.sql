create table public.operator_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  role_code text not null default 'operator',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint operator_profiles_display_name_valid
    check (
      char_length(btrim(display_name)) between 1 and 120
    ),

  constraint operator_profiles_role_code_allowed
    check (
      role_code = 'operator'
    ),

  constraint operator_profiles_status_allowed
    check (
      status in ('active', 'inactive')
    ),

  constraint operator_profiles_timestamps_valid
    check (
      updated_at >= created_at
    )
);

create table public.operator_capabilities (
  user_id uuid not null
    references public.operator_profiles (user_id)
    on delete cascade,

  capability_code text not null,
  created_at timestamptz not null default now(),

  constraint operator_capabilities_pkey
    primary key (user_id, capability_code),

  constraint operator_capabilities_code_valid
    check (
      capability_code ~
        '^[a-z][a-z0-9_-]{0,63}:[a-z][a-z0-9_-]{0,63}$'
    )
);

alter table public.operator_profiles
  enable row level security;

alter table public.operator_profiles
  force row level security;

alter table public.operator_capabilities
  enable row level security;

alter table public.operator_capabilities
  force row level security;

revoke all
  on table public.operator_profiles
  from anon, authenticated;

revoke all
  on table public.operator_capabilities
  from anon, authenticated;

grant select
  on table public.operator_profiles
  to authenticated;

grant select
  on table public.operator_capabilities
  to authenticated;

create policy operator_profiles_select_own
  on public.operator_profiles
  for select
  to authenticated
  using (
    (select auth.uid()) = user_id
  );

create policy operator_capabilities_select_own
  on public.operator_capabilities
  for select
  to authenticated
  using (
    (select auth.uid()) = user_id
  );

comment on table public.operator_profiles is
  'Minimal operational identity linked to Supabase Auth.';

comment on table public.operator_capabilities is
  'Minimal capabilities assigned to an authorized operator.';
