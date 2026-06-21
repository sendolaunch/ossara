// Multi-hero account model (save v2). One hero per class; a SHARED stash carries
// unequipped relics across every hero. Gold, level, XP, cleared breaches and
// equipped gear are all PER-HERO (design decision S-multi-hero). Pure + node-safe
// (no DOM, no localStorage) so the headless sim test can drive it.
//
// Shape:
//   account = {
//     version: 2,
//     name:    string,            // account/player handle
//     wallet:  string | null,
//     stash:   Item[],            // SHARED across all heroes
//     heroes:  { [classId]: Hero }, // created lazily, one per class
//     activeClass: classId | null
//   }
//   Hero = { classId, level, xp, gold, cleared: string[], equipped: {slot:Item|null} }

import { SLOTS } from "../config/items.js";
import { CLASS_ORDER } from "../config/classes.js";
import { aggregateBonuses } from "./loot.js";

export const SAVE_VERSION = 2;

export function emptyEquipped() {
  const e = {};
  for (const s of SLOTS) e[s] = null;
  return e;
}

export function createHero(classId) {
  return { classId, level: 1, xp: 0, gold: 0, cleared: [], equipped: emptyEquipped() };
}

export function createAccount() {
  return { version: SAVE_VERSION, name: "", wallet: null, stash: [], heroes: {}, activeClass: null };
}

// Lazily create + normalise the hero for a class, then return it.
export function ensureHero(acct, classId) {
  if (!CLASS_ORDER.includes(classId)) return null;
  if (!acct.heroes[classId]) acct.heroes[classId] = createHero(classId);
  const h = acct.heroes[classId];
  if (!h.equipped || typeof h.equipped !== "object") h.equipped = emptyEquipped();
  for (const s of SLOTS) if (!(s in h.equipped)) h.equipped[s] = null;
  if (!Array.isArray(h.cleared)) h.cleared = [];
  return h;
}

export function hasHero(acct, classId) {
  return !!(acct.heroes && acct.heroes[classId]);
}

export function getActiveHero(acct) {
  if (!acct.activeClass) return null;
  return acct.heroes[acct.activeClass] || null;
}

// Select (and create if needed) the hero a player will take into the Undercroft.
export function setActive(acct, classId) {
  const h = ensureHero(acct, classId);
  if (h) acct.activeClass = classId;
  return h;
}

// ---- shared stash + per-hero equip ------------------------------------------

export function addItem(acct, item) {
  acct.stash.push(item);
  return acct;
}

// Equip a stash item onto a specific hero. Anything already in that slot returns
// to the SHARED stash (so it can be moved to another hero later).
export function equip(acct, classId, itemId) {
  const h = ensureHero(acct, classId);
  if (!h) return false;
  const idx = acct.stash.findIndex((i) => i.id === itemId);
  if (idx < 0) return false;
  const item = acct.stash[idx];
  const cur = h.equipped[item.slot] || null;
  acct.stash.splice(idx, 1);
  if (cur) acct.stash.push(cur);
  h.equipped[item.slot] = item;
  return true;
}

export function unequip(acct, classId, slot) {
  const h = ensureHero(acct, classId);
  if (!h) return false;
  const cur = h.equipped[slot];
  if (!cur) return false;
  h.equipped[slot] = null;
  acct.stash.push(cur);
  return true;
}

// Shred a SHARED-stash relic into Gold for the ACTIVE hero (main item sink, §6.5).
export function salvage(acct, itemId) {
  const idx = acct.stash.findIndex((i) => i.id === itemId);
  if (idx < 0) return 0;
  const item = acct.stash.splice(idx, 1)[0];
  const dust = Math.max(1, Math.round((item.power || 1) / 4));
  const h = getActiveHero(acct);
  if (h) h.gold += dust;
  return dust;
}

// Equipped-gear bonuses for one hero (falls back to "nothing equipped").
export function getBonuses(acct, classId) {
  const h = acct.heroes[classId];
  return aggregateBonuses(h ? h.equipped : emptyEquipped());
}

// ---- migration --------------------------------------------------------------
// Accepts whatever was in storage and returns a valid v2 account. v1 saves
// (single hero: {classId, level, xp, gold, cleared, inventory, equipped}) are
// folded into heroes[classId] with their inventory promoted to the shared stash.
// Anything newer/unknown is refused and replaced with a fresh account (R19).
export function migrate(data) {
  if (!data || typeof data !== "object") return createAccount();

  if (data.version === SAVE_VERSION) {
    const a = createAccount();
    a.name = data.name || "";
    a.wallet = data.wallet || null;
    a.stash = Array.isArray(data.stash) ? data.stash : [];
    a.heroes = data.heroes && typeof data.heroes === "object" ? data.heroes : {};
    a.activeClass = data.activeClass || null;
    for (const cid of Object.keys(a.heroes)) ensureHero(a, cid);
    if (a.activeClass && !a.heroes[a.activeClass]) a.activeClass = null;
    return a;
  }

  if (data.version === 1) {
    const a = createAccount();
    a.name = data.name || "";
    a.wallet = data.wallet || null;
    a.stash = Array.isArray(data.inventory) ? data.inventory : [];
    const cid = CLASS_ORDER.includes(data.classId) ? data.classId : "warden";
    const h = createHero(cid);
    h.gold = data.gold || 0;
    h.xp = data.xp || 0;
    h.level = data.level || 1;
    h.cleared = Array.isArray(data.cleared) ? data.cleared : [];
    if (data.equipped && typeof data.equipped === "object") {
      for (const s of SLOTS) h.equipped[s] = data.equipped[s] || null;
    }
    a.heroes[cid] = h;
    a.activeClass = cid;
    return a;
  }

  return createAccount(); // unknown/newer version — refuse, don't corrupt
}
