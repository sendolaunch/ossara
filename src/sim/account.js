// Glue between the cloud row (Supabase) and the local profile (sim/profile.js).
// On login we adopt the cloud save as the source of truth so progress follows
// the wallet across devices; a brand-new wallet (no cloud row) keeps local and
// gets pushed up. Pure data — no deps.

// Copy a remote profiles-row (snake_case DB columns) onto the local profile.
export function adoptRemote(local, remote) {
  if (!remote) return local; // first login on this wallet — keep local, it'll be pushed up
  local.name = remote.name ?? local.name;
  if (remote.heroes) local.heroes = remote.heroes;
  if (remote.stash) local.stash = remote.stash;
  if (remote.active_class) local.activeClass = remote.active_class;
  local.version = remote.save_version ?? local.version ?? 2;
  return local;
}
