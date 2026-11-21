\set ON_ERROR_STOP on
begin;
\ir ../supabase/security-review/company-verification-privacy.sql

insert into auth.users(id, raw_user_meta_data) values
 ('a1111111-1111-4111-8111-111111111111', '{"display_name":"Verified A"}'),
 ('b2222222-2222-4222-8222-222222222222', '{"display_name":"Revoked B"}'),
 ('c3333333-3333-4333-8333-333333333333', '{"display_name":"Expired C"}');
insert into public.companies(profile_id, legal_name)
select id, raw_user_meta_data->>'display_name' from auth.users
where id in ('a1111111-1111-4111-8111-111111111111', 'b2222222-2222-4222-8222-222222222222',
             'c3333333-3333-4333-8333-333333333333');
insert into public.company_verification_requests(company_id, submitted_by, industry, municipality, state)
select profile_id, profile_id, 'Trade', 'Miami', 'FL' from public.companies
where profile_id in ('a1111111-1111-4111-8111-111111111111', 'b2222222-2222-4222-8222-222222222222',
                     'c3333333-3333-4333-8333-333333333333');
insert into public.company_verifications(company_id, request_id, verified_by, verified_at, valid_until, revoked_at)
select company_id, id, 'c3333333-3333-4333-8333-333333333333', now() - interval '2 days',
 case when company_id = 'c3333333-3333-4333-8333-333333333333' then now() - interval '1 day'
      else now() + interval '1 day' end,
 case when company_id = 'b2222222-2222-4222-8222-222222222222' then now() end
from public.company_verification_requests
where company_id in ('a1111111-1111-4111-8111-111111111111', 'b2222222-2222-4222-8222-222222222222',
                     'c3333333-3333-4333-8333-333333333333');

create function pg_temp.verification_assert() returns void language plpgsql as $$
begin
 if has_any_column_privilege(current_user, 'public.company_verifications', 'SELECT') then
  raise exception 'Internal company verification columns remain readable';
 end if;
 if (select array_agg(company_id) from public.verified_companies
     where company_id in ('a1111111-1111-4111-8111-111111111111', 'b2222222-2222-4222-8222-222222222222',
                          'c3333333-3333-4333-8333-333333333333'))
    is distinct from array['a1111111-1111-4111-8111-111111111111'::uuid] then
  raise exception 'Public badges must include only current verifications';
 end if;
end;
$$;

set local role anon;
select pg_temp.verification_assert();
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b2222222-2222-4222-8222-222222222222', true);
select pg_temp.verification_assert();
rollback;
