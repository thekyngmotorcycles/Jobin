-- Disposable database only. This schema must never be exposed by PostgREST.
create schema jobeen_pilot;
revoke all on schema jobeen_pilot from public, anon, authenticated, service_role;

create table jobeen_pilot.intents (
  id uuid primary key,
  user_id uuid not null,
  session_id uuid not null,
  operation_id uuid not null,
  binding text not null,
  proof text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts between 0 and 5),
  state text not null default 'pending'
    check (state in ('pending', 'executing', 'complete', 'uncertain')),
  created_at timestamptz not null default clock_timestamp(),
  unique (user_id, operation_id)
);

create unique index pilot_single_execution on jobeen_pilot.intents (user_id)
  where state in ('executing', 'uncertain');
create index pilot_recent_intents on jobeen_pilot.intents (user_id, created_at);

-- A stand-in for an internal ledger. It deliberately has no payment-provider integration.
create table jobeen_pilot.ledger (
  intent_id uuid primary key references jobeen_pilot.intents(id),
  user_id uuid not null,
  kind text not null check (kind in ('payment', 'withdrawal')),
  amount_minor integer not null check (amount_minor > 0),
  currency text not null,
  destination text not null
);

create table jobeen_pilot.documents (
  id uuid primary key,
  owner_id uuid not null,
  reviewer_id uuid,
  bucket text not null,
  object_path text not null
);

alter table jobeen_pilot.intents enable row level security;
alter table jobeen_pilot.ledger enable row level security;
alter table jobeen_pilot.documents enable row level security;
