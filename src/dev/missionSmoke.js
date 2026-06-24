const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", ""]);

// Local browser smoke helper only. Production builds and non-local hosts must
// never honor ?devMission=... because real auth/profile flow owns production.
export function isLocalDevHost(hostname = "") {
  return LOCAL_HOSTS.has(hostname);
}

export function canUseDevMissionRoute(env = {}, location = globalThis.location) {
  return !!env.DEV && isLocalDevHost(location?.hostname || "");
}

export function devMissionIdFromLocation(location = globalThis.location, env = {}) {
  if (!canUseDevMissionRoute(env, location)) return null;
  const params = new URLSearchParams(location?.search || "");
  const id = params.get("devMission");
  return id && id.trim() ? id.trim() : null;
}
