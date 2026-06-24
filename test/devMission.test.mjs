import { canUseDevMissionRoute, devEnemyGalleryEnabled, devMissionIdFromLocation, isLocalDevHost } from "../src/dev/missionSmoke.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

ok(isLocalDevHost("localhost"), "localhost is treated as a local dev host");
ok(isLocalDevHost("127.0.0.1"), "127.0.0.1 is treated as a local dev host");
ok(isLocalDevHost("::1"), "IPv6 loopback is treated as a local dev host");
ok(!isLocalDevHost("ossara.vercel.app"), "production host is not treated as local dev");

ok(canUseDevMissionRoute({ DEV: true }, { hostname: "localhost" }), "dev mission route works in local dev");
ok(!canUseDevMissionRoute({ DEV: false }, { hostname: "localhost" }), "dev mission route is disabled in production builds");
ok(!canUseDevMissionRoute({ DEV: true }, { hostname: "ossara.vercel.app" }), "dev mission route is disabled on non-local hosts");

ok(
  devMissionIdFromLocation({ hostname: "localhost", search: "?devMission=first-breach" }, { DEV: true }) === "first-breach",
  "local dev query resolves mission id",
);
ok(
  devMissionIdFromLocation({ hostname: "localhost", search: "?devMission=first-breach" }, { DEV: false }) === null,
  "production build ignores dev mission query",
);
ok(
  devMissionIdFromLocation({ hostname: "ossara.vercel.app", search: "?devMission=first-breach" }, { DEV: true }) === null,
  "non-local host ignores dev mission query",
);
ok(
  devMissionIdFromLocation({ hostname: "localhost", search: "" }, { DEV: true }) === null,
  "missing dev mission query does not trigger route",
);
ok(
  devEnemyGalleryEnabled({ hostname: "localhost", search: "?devEnemyGallery=1" }, { DEV: true }),
  "local dev enemy gallery route is enabled",
);
ok(
  !devEnemyGalleryEnabled({ hostname: "localhost", search: "?devEnemyGallery=1" }, { DEV: false }),
  "production build ignores enemy gallery route",
);
ok(
  !devEnemyGalleryEnabled({ hostname: "ossara.vercel.app", search: "?devEnemyGallery=1" }, { DEV: true }),
  "non-local host ignores enemy gallery route",
);
ok(
  !devEnemyGalleryEnabled({ hostname: "localhost", search: "" }, { DEV: true }),
  "missing enemy gallery query does not trigger route",
);

console.log(`devMission: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
