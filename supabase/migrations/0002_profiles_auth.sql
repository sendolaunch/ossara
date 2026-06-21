-- OSSARA — 0002 profiles auth
-- Tie each profile row to the authenticated Web3 (Solana) user so the
-- owner-write RLS policies can be enforced. With Supabase "Sign in with Web3",
-- the player's Phantom signature creates an auth session (auth.uid()); a row is
-- writable only by the user that owns it. Public read stays (from 0001).

alter table public.profiles
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create unique index if not exists profiles_user_id_key on public.profiles(user_id);

-- owner-only writes (reads remain public via 0001's profiles_public_read)
drop policy if exists "profiles_owner_insert" on public.profiles;
create policy "profiles_owner_insert" on public.profiles
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "profiles_owner_update" on public.profiles;
create policy "profiles_owner_update" on public.profiles
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
