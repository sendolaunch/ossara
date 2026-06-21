-- 0004_hero_names.sql — globally-unique, PERMANENT per-hero usernames.
--
-- Each hero (one per Order, per account) claims one display name. Names are:
--   • globally unique across ALL players (no two heroes anywhere share a name),
--   • case-insensitive unique (lower(username) is the key),
--   • immutable once claimed — there is no UPDATE/DELETE policy, so a claimed
--     name is locked forever (matches "can't be copied", "locked").
--
-- Reads are public (names show to everyone). Claims require an authenticated
-- session (wallet sign-in) and may only be made for yourself. Real-money / wallet
-- economy is unaffected (design-doc §6/§11) — this is identity only.

create table if not exists public.hero_names (
  username_key text primary key,                          -- lower(username) — the global unique key
  username     text not null,                             -- display form, exactly as entered
  owner        uuid not null references auth.users(id) on delete cascade,
  class_id     text not null,                             -- which Order this name belongs to
  created_at   timestamptz not null default now(),
  constraint hero_names_format
    check (username ~ '^[A-Za-z0-9_-]{3,16}$' and username_key = lower(username)),
  constraint hero_names_class
    check (class_id in ('warden','hunter','stormcaller','plaguedoctor'))
);

-- one claimed name per (account, Order): a hero can't hold two names
create unique index if not exists hero_names_owner_class_idx
  on public.hero_names (owner, class_id);

alter table public.hero_names enable row level security;

-- public read: names are visible to all players
drop policy if exists hero_names_read on public.hero_names;
create policy hero_names_read on public.hero_names
  for select using (true);

-- claim (insert) only for yourself; uniqueness is enforced by the PK
drop policy if exists hero_names_claim on public.hero_names;
create policy hero_names_claim on public.hero_names
  for insert to authenticated
  with check (owner = auth.uid());

-- NOTE: intentionally NO update or delete policy => names are permanent + locked.
