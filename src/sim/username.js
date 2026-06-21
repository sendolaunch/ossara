// Pure username rules — node-testable, shared by the claim flow (web3/heronames.js)
// and the set-name UI. Mirrors the DB CHECK in supabase/migrations/0004_hero_names.sql
// so the client rejects bad names before hitting the server (and the server is the
// final authority on uniqueness + format).
//
// Rules: 3–16 chars, letters / numbers / underscore / hyphen. Case-insensitive for
// uniqueness (the key is the lowercased form). A short reserved list blocks the
// obvious impersonation handles; the server's global-unique index does the rest.

export const USERNAME_RE = /^[A-Za-z0-9_-]{3,16}$/;

const RESERVED = new Set([
  "admin", "administrator", "mod", "moderator", "ossara", "system", "root",
  "support", "staff", "official", "null", "undefined",
]);

export function normalizeUsername(s) {
  return String(s == null ? "" : s).trim();
}

export function usernameKey(s) {
  return normalizeUsername(s).toLowerCase();
}

// Returns { ok:true, value, key } or { ok:false, reason }.
export function validateUsername(s) {
  const v = normalizeUsername(s);
  if (v.length === 0) return { ok: false, reason: "Enter a name." };
  if (v.length < 3) return { ok: false, reason: "Too short — at least 3 characters." };
  if (v.length > 16) return { ok: false, reason: "Too long — 16 characters max." };
  if (!USERNAME_RE.test(v)) return { ok: false, reason: "Letters, numbers, _ or - only." };
  if (RESERVED.has(v.toLowerCase())) return { ok: false, reason: "That name is reserved." };
  return { ok: true, value: v, key: v.toLowerCase() };
}
