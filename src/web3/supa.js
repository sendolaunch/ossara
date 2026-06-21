// Supabase account layer — wallet identity via native "Sign in with Web3"
// (Solana). All reads use the public anon key (RLS allows read); writes require
// the player's auth session (RLS: owner-only), so saves can't be forged. No
// custom server needed.
//
// Env (Vite, build-time): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY. If they're
// absent (e.g. local dev without .env.local), `supa` is null and every function
// degrades gracefully so the game still runs on the local save (sim/profile.js).

import { createClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supa = URL && ANON ? createClient(URL, ANON) : null;
export const accountsEnabled = () => !!supa;

// Sign in with the connected Solana wallet (Phantom). Supabase pops the wallet's
// "Confirm Sign In" prompt and verifies the signature server-side.
export async function signInWithWallet() {
  if (!supa) return { ok: false, reason: "no-config" };
  try {
    const { data, error } = await supa.auth.signInWithWeb3({
      chain: "solana",
      statement: "Sign in to OSSARA — hold the breach, loot the dead.",
    });
    if (error) return { ok: false, error: error.message };
    const address = data?.user?.user_metadata?.address || data?.user?.user_metadata?.custom_claims?.address || null;
    return { ok: true, userId: data?.user?.id || null, address };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function getSession() {
  if (!supa) return null;
  const { data } = await supa.auth.getSession();
  return data?.session || null;
}

// Read a profile row by wallet (public read). Returns the row or null.
export async function loadRemoteProfile(wallet) {
  if (!supa || !wallet) return null;
  const { data, error } = await supa.from("profiles").select("*").eq("wallet", wallet).maybeSingle();
  if (error) {
    console.warn("[supa] loadRemoteProfile", error.message);
    return null;
  }
  return data || null;
}

// Upsert the signed-in player's profile (owner-only RLS enforces ownership).
export async function saveRemoteProfile(profile, { userId, wallet }) {
  if (!supa || !userId || !wallet) return { ok: false, reason: "not-signed-in" };
  const row = {
    user_id: userId,
    wallet,
    name: profile.name || null,
    class_id: profile.classId || null,
    level: profile.level || 1,
    xp: profile.xp || 0,
    gold: profile.gold || 0,
    cleared: profile.cleared || [],
    inventory: profile.inventory || [],
    equipped: profile.equipped || {},
    save_version: profile.version || 1,
  };
  const { error } = await supa.from("profiles").upsert(row, { onConflict: "user_id" });
  if (error) {
    console.warn("[supa] saveRemoteProfile", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
