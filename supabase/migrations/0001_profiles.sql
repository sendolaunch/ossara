-- OSSARA — 0001 profiles
-- Account = Solana wallet address (design doc §6.9). One row per player holds
-- their progress, gear, and gold. Versioned save (R19): bump save_version and
-- migrate, never break old rows silently.
--
-- Security: RLS ON. Anyone may READ a profile (enables future leaderboards;
-- profiles hold no secrets). NOBODY may write via the public/anon key — writes
-- happen only through the signature-verified serverless function using the
-- service-role key, which bypasses RLS. So saves can't be forged from the client.

create table if not exists public.profiles (
  wallet        text primary key,                       -- Solana address = identity
  name          text,
  class_id      text,
  level         integer     not null default 1,
  xp            integer     not null default 0,
  gold          integer     not null default 0,
  cleared       text[]      not null default '{}',       -- breach ids cleared
  inventory     jsonb       not null default '[]'::jsonb, -- [ item, ... ]
  equipped      jsonb       not null default '{}'::jsonb, -- { slot: item }
  save_version  integer     not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- public read (no secrets here); supports leaderboards later
drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read" on public.profiles
  for select using (true);

-- NOTE: intentionally no insert/update/delete policy for anon/authenticated.
-- All writes go through the serverless function (service-role key) after it
-- verifies a Phantom signature proving wallet ownership.

-- keep updated_at fresh on writes
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
