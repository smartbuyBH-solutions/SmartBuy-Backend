begin;

create extension if not exists pgtap
  with schema extensions;

set local search_path =
  public,
  extensions;

select plan(8);

insert into auth.users (
  id,
  email
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'operator-one@example.test'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'operator-two@example.test'
  );

insert into public.operator_profiles (
  user_id,
  display_name,
  role_code,
  status
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'Operator One',
    'operator',
    'active'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Operator Two',
    'operator',
    'active'
  );

insert into public.operator_capabilities (
  user_id,
  capability_code
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'overview:read'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'overview:read'
  );

set local role authenticated;

set local request.jwt.claim.sub =
  '11111111-1111-4111-8111-111111111111';

select is(
  auth.uid()::text,
  '11111111-1111-4111-8111-111111111111',
  'the first authenticated identity is active'
);

select is(
  (
    select count(*)::bigint
    from public.operator_profiles
  ),
  1::bigint,
  'the first operator sees only one profile'
);

select is(
  (
    select min(user_id::text)
    from public.operator_profiles
  ),
  '11111111-1111-4111-8111-111111111111',
  'the first operator sees only its own profile'
);

select is(
  (
    select count(*)::bigint
    from public.operator_capabilities
  ),
  1::bigint,
  'the first operator sees only its own capabilities'
);

set local request.jwt.claim.sub =
  '22222222-2222-4222-8222-222222222222';

select is(
  auth.uid()::text,
  '22222222-2222-4222-8222-222222222222',
  'the second authenticated identity is active'
);

select is(
  (
    select count(*)::bigint
    from public.operator_profiles
  ),
  1::bigint,
  'the second operator sees only one profile'
);

select is(
  (
    select min(user_id::text)
    from public.operator_profiles
  ),
  '22222222-2222-4222-8222-222222222222',
  'the second operator sees only its own profile'
);

select is(
  (
    select count(*)::bigint
    from public.operator_capabilities
  ),
  1::bigint,
  'the second operator sees only its own capabilities'
);

select *
from finish();

rollback;
