// Claim + look up globally-unique, permanent per-hero usernames against Supabase
// (table + RLS in supabase/migrations/0004_hero_names.sql). Client-side format
// checks come from sim/username.js; the server is the final authority on
// uniqueness (PK on the lowercased key) and permanence (no update/delete policy).
//
// Claiming requires an authenticated session (wallet sign-in). In Dev-Enter /
// offline mode there is no session, so claims are refused with a clear reason —
// a global, locked name can only exist once it's registered server-side.

import { supa } from "./supa.js";
import { validateUsername } from "../sim/username.js";

const PG_UNIQUE_VIOLATION = "23505";

// Is this name free? { ok:true, available:boolean } or { ok:false, reason }.
export async function isNameAvailable(raw) {
  const v = validateUsername(raw);
  if (!v.ok) return { ok: false, reason: v.reason };
  if (!supa) return { ok: false, reason: "Accounts are offline." };
  const { data, error } = await supa
    .from("hero_names")
    .select("username_key")
    .eq("username_key", v.key)
    .maybeSingle();
  if (error) return { ok: false, reason: error.message };
  return { ok: true, available: !data, value: v.value };
}

// Permanently claim `raw` for this account's `classId` hero.
// { ok:true, username } or { ok:false, reason }.
export async function claimHeroName(classId, raw) {
  const v = validateUsername(raw);
  if (!v.ok) return { ok: false, reason: v.reason };
  if (!supa) return { ok: false, reason: "Connect your wallet to claim a name." };

  const { data: sess } = await supa.auth.getUser();
  const user = sess && sess.user;
  if (!user) return { ok: false, reason: "Connect your wallet to claim a name." };

  const { error } = await supa.from("hero_names").insert({
    username_key: v.key,
    username: v.value,
    owner: user.id,
    class_id: classId,
  });
  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      // could be the name OR the (owner,class) one-per-hero index
      return { ok: false, reason: "That name is taken — choose another." };
    }
    return { ok: false, reason: error.message };
  }
  return { ok: true, username: v.value };
}

// All names this account already owns: { [classId]: username }.
export async function loadMyHeroNames() {
  if (!supa) return {};
  const { data: sess } = await supa.auth.getUser();
  const user = sess && sess.user;
  if (!user) return {};
  const { data, error } = await supa
    .from("hero_names")
    .select("class_id, username")
    .eq("owner", user.id);
  if (error || !data) return {};
  const out = {};
  for (const row of data) out[row.class_id] = row.username;
  return out;
}
