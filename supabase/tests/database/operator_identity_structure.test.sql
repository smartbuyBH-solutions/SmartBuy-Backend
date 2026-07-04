begin;

create extension if not exists pgtap
  with schema extensions;

set local search_path =
  public,
  extensions;

select plan(24);

select ok(
  to_regclass('public.operator_profiles') is not null,
  'operator_profiles exists'
);

select ok(
  to_regclass('public.operator_capabilities') is not null,
  'operator_capabilities exists'
);

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.operator_profiles'::regclass
  ),
  'operator_profiles has RLS enabled'
);

select ok(
  (
    select relforcerowsecurity
    from pg_class
    where oid = 'public.operator_profiles'::regclass
  ),
  'operator_profiles forces RLS'
);

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.operator_capabilities'::regclass
  ),
  'operator_capabilities has RLS enabled'
);

select ok(
  (
    select relforcerowsecurity
    from pg_class
    where oid = 'public.operator_capabilities'::regclass
  ),
  'operator_capabilities forces RLS'
);

select is(
  (
    select count(*)::bigint
    from pg_constraint
    where conrelid = 'public.operator_profiles'::regclass
      and contype = 'p'
  ),
  1::bigint,
  'operator_profiles has one primary key'
);

select is(
  (
    select count(*)::bigint
    from pg_constraint
    where conrelid = 'public.operator_capabilities'::regclass
      and contype = 'p'
  ),
  1::bigint,
  'operator_capabilities has one primary key'
);

select is(
  (
    select count(*)::bigint
    from pg_constraint
    where conrelid = 'public.operator_profiles'::regclass
      and confrelid = 'auth.users'::regclass
      and contype = 'f'
  ),
  1::bigint,
  'operator_profiles references auth.users'
);

select is(
  (
    select count(*)::bigint
    from pg_constraint
    where conrelid = 'public.operator_capabilities'::regclass
      and confrelid = 'public.operator_profiles'::regclass
      and contype = 'f'
  ),
  1::bigint,
  'operator_capabilities references operator_profiles'
);

select is(
  (
    select count(*)::bigint
    from pg_constraint
    where conrelid = 'public.operator_profiles'::regclass
      and contype = 'c'
      and conname in (
        'operator_profiles_display_name_valid',
        'operator_profiles_role_code_allowed',
        'operator_profiles_status_allowed',
        'operator_profiles_timestamps_valid'
      )
  ),
  4::bigint,
  'operator_profiles has the required checks'
);

select is(
  (
    select count(*)::bigint
    from pg_constraint
    where conrelid = 'public.operator_capabilities'::regclass
      and contype = 'c'
      and conname = 'operator_capabilities_code_valid'
  ),
  1::bigint,
  'operator_capabilities validates capability codes'
);

select is(
  (
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename = 'operator_profiles'
      and policyname = 'operator_profiles_select_own'
      and cmd = 'SELECT'
      and roles::text = '{authenticated}'
  ),
  1::bigint,
  'operator_profiles exposes only its own select policy'
);

select is(
  (
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename = 'operator_capabilities'
      and policyname = 'operator_capabilities_select_own'
      and cmd = 'SELECT'
      and roles::text = '{authenticated}'
  ),
  1::bigint,
  'operator_capabilities exposes only its own select policy'
);

select ok(
  has_table_privilege(
    'authenticated',
    'public.operator_profiles',
    'SELECT'
  ),
  'authenticated can select operator_profiles'
);

select ok(
  has_table_privilege(
    'authenticated',
    'public.operator_capabilities',
    'SELECT'
  ),
  'authenticated can select operator_capabilities'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.operator_profiles',
    'INSERT'
  ),
  'authenticated cannot insert operator_profiles'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.operator_profiles',
    'UPDATE'
  ),
  'authenticated cannot update operator_profiles'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.operator_profiles',
    'DELETE'
  ),
  'authenticated cannot delete operator_profiles'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.operator_capabilities',
    'INSERT'
  ),
  'authenticated cannot insert operator_capabilities'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.operator_capabilities',
    'UPDATE'
  ),
  'authenticated cannot update operator_capabilities'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.operator_capabilities',
    'DELETE'
  ),
  'authenticated cannot delete operator_capabilities'
);

select ok(
  not has_table_privilege(
    'anon',
    'public.operator_profiles',
    'SELECT'
  ),
  'anon cannot select operator_profiles'
);

select ok(
  not has_table_privilege(
    'anon',
    'public.operator_capabilities',
    'SELECT'
  ),
  'anon cannot select operator_capabilities'
);

select *
from finish();

rollback;
