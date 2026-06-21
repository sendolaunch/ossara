// Glue between the cloud row (Supabase) and the local profile (sim/profile.js).
// On login we adopt the cloud save as the source of truth so progress follows
// the wallet across devices; a brand-new wallet (no cloud row) keeps local and
// gets pushed up. Pure data — no deps.

// Copy a remote profiles-row (snake_case DB columns) onto the local profile.
export function adoptRemote(local, remote) {
  if (!remote) return local; // first login on this wallet — keep local, it'll be pushed up
  local.name = remote.name ?? local.name;
  local.classId = remote.class_id ?? local.classId;
  local.gold = remote.gold ?? local.gold ?? 0;
  local.level = remote.level ?? local.level ?? 1;
  local.xp = remote.xp ?? local.xp ?? 0;
  local.cleared = remote.cleared ?? local.cleared ?? [];
  local.inventory = remote.inventory ?? local.inventory ?? [];
  local.equipped = remote.equipped ?? local.equipped ?? {};
  local.version = remote.save_version ?? local.version ?? 1;
  return local;
}
