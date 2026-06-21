// Thin storage adapter over the v2 multi-hero account model. The actual model
// (account/heroes/shared stash) lives in sim/heroes.js — this file just bridges
// it to localStorage and re-exports the API surface other modules consume.

export {
  createAccount,
  createHero,
  ensureHero,
  getActiveHero,
  setActive,
  hasHero,
  addItem,
  equip,
  unequip,
  salvage,
  getBonuses,
  migrate,
  SAVE_VERSION,
} from "./heroes.js";

import { createAccount, migrate } from "./heroes.js";

const SAVE_KEY = "ossara.save";

export function loadProfile() {
  try {
    if (typeof localStorage === "undefined") return createAccount();
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createAccount();
    return migrate(JSON.parse(raw));
  } catch (_) {
    return createAccount();
  }
}

export function saveProfile(acct) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(SAVE_KEY, JSON.stringify(acct));
  } catch (_) {}
}
