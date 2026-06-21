-- OSSARA — 0003 multi-hero accounts (save v2)
-- The account now holds up to four heroes (one per order) plus a SHARED stash.
-- Gold, level, xp, cleared and equipped gear are per-hero and live inside the
-- `heroes` blob; `stash` carries unequipped relics across every hero.
--
-- Non-destructive (R19): the legacy single-hero columns from 0001
-- (class_id, level, xp, gold, cleared, inventory, equipped) are LEFT IN PLACE so
-- old rows still read. New clients write the v2 columns below; save_version = 2.
-- RLS owner-write from 0002 is unchanged and covers the whole row.

alter table public.profiles
  add column if not exists heroes       jsonb not null default '{}'::jsonb,  -- { classId: hero }
  add column if not exists stash        jsonb not null default '[]'::jsonb,  -- shared [ item, ... ]
  add column if not exists active_class text;

-- Backfill any existing v1 rows into the v2 shape so they survive the upgrade.
-- Fold the old single hero (class_id + its stats/equipped) into heroes[class_id],
-- promote inventory -> stash, and point active_class at it. Only touches rows
-- still on save_version 1 that haven't been migrated yet.
update public.profiles p
set
  heroes = jsonb_build_object(
    coalesce(nullif(p.class_id, ''), 'warden'),
    jsonb_build_object(
      'classId', coalesce(nullif(p.class_id, ''), 'warden'),
      'level',   p.level,
      'xp',      p.xp,
      'gold',    p.gold,
      'cleared', to_jsonb(p.cleared),
      'equipped', coalesce(p.equipped, '{}'::jsonb)
    )
  ),
  stash = coalesce(p.inventory, '[]'::jsonb),
  active_class = coalesce(nullif(p.class_id, ''), 'warden'),
  save_version = 2
where p.save_version = 1;
