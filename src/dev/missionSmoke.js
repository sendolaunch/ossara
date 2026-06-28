const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", ""]);
const SHOWCASE_MISSIONS = new Set(["first-breach"]);

// Local browser smoke helper only. Production builds and non-local hosts must
// never honor ?devMission=... because real auth/profile flow owns production.
export function isLocalDevHost(hostname = "") {
  return LOCAL_HOSTS.has(hostname);
}

export function canUseDevMissionRoute(env = {}, location = globalThis.location) {
  return !!env.DEV && isLocalDevHost(location?.hostname || "");
}

export function devMissionIdFromLocation(location = globalThis.location, env = {}) {
  if (showcaseMissionIdFromLocation(location)) return null;
  if (!canUseDevMissionRoute(env, location)) return null;
  const params = new URLSearchParams(location?.search || "");
  const id = params.get("devMission");
  return id && id.trim() ? id.trim() : null;
}

export function showcaseMissionIdFromLocation(location = globalThis.location) {
  const params = new URLSearchParams(location?.search || "");
  const id = (params.get("showcase") || "").trim();
  return SHOWCASE_MISSIONS.has(id) ? id : null;
}

export function devEnemyGalleryEnabled(location = globalThis.location, env = {}) {
  if (showcaseMissionIdFromLocation(location)) return false;
  if (!canUseDevMissionRoute(env, location)) return false;
  const params = new URLSearchParams(location?.search || "");
  return params.get("devEnemyGallery") === "1";
}

export function devHeroAttackClassFromLocation(location = globalThis.location, env = {}) {
  if (showcaseMissionIdFromLocation(location)) return null;
  if (!canUseDevMissionRoute(env, location)) return null;
  const params = new URLSearchParams(location?.search || "");
  const id = params.get("devHeroAttack");
  return id && id.trim() ? id.trim() : null;
}

export function devLootEnabled(location = globalThis.location, env = {}) {
  if (showcaseMissionIdFromLocation(location)) return false;
  if (!canUseDevMissionRoute(env, location)) return false;
  const params = new URLSearchParams(location?.search || "");
  return params.get("devLoot") === "1";
}
