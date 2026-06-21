// Player profile: inventory, equipped gear, gold. Versioned save (R19) to
// localStorage in the browser; pure + node-safe for tests (localStorage guarded).
// Migrates to Supabase later (task #27) — same shape, different store.

import { SLOTS } from "../config/items.js";
import { aggregateBonuses } from "./loot.js";

const SAVE_KEY = "ossara.save";
const SAVE_VERSION = 1;

export function createProfile() {
  const equipped = {};
  for (const s of SLOTS) equipped[s] = null;
  return { version: SAVE_VERSION, name: "", classId: "warden", gold: 0, inventory: [], equipped };
}

export function addItem(profile, item) {
  profile.inventory.push(item);
  return profile;
}

// Equip by item id; any item already in that slot returns to inventory.
export function equip(profile, itemId) {
  const idx = profile.inventory.findIndex((i) => i.id === itemId);
  if (idx < 0) return false;
  const item = profile.inventory[idx];
  const cur = profile.equipped[item.slot] || null;
  profile.inventory.splice(idx, 1);
  if (cur) profile.inventory.push(cur);
  profile.equipped[item.slot] = item;
  return true;
}

export function unequip(profile, slot) {
  const cur = profile.equipped[slot];
  if (!cur) return false;
  profile.equipped[slot] = null;
  profile.inventory.push(cur);
  return true;
}

// Shred an inventory item into Gold (main item sink, §6.5).
export function salvage(profile, itemId) {
  const idx = profile.inventory.findIndex((i) => i.id === itemId);
  if (idx < 0) return 0;
  const item = profile.inventory.splice(idx, 1)[0];
  const dust = Math.max(1, Math.round((item.power || 1) / 4));
  profile.gold += dust;
  return dust;
}

export function getBonuses(profile) {
  return aggregateBonuses(profile.equipped);
}

export function loadProfile() {
  try {
    if (typeof localStorage === "undefined") return createProfile();
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createProfile();
    const data = JSON.parse(raw);
    if (!data || data.version !== SAVE_VERSION) return createProfile(); // R19: refuse stale, don't corrupt
    const p = createProfile();
    Object.assign(p, data);
    for (const s of SLOTS) if (!(s in p.equipped)) p.equipped[s] = null;
    return p;
  } catch (_) {
    return createProfile();
  }
}

export function saveProfile(profile) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(SAVE_KEY, JSON.stringify(profile));
  } catch (_) {}
}
