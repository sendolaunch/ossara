// Headless test for the 3-tier hub floor heights. Run: node test/hubFloor.test.mjs
import { floorHeightAt, tierFloorY, TIER } from "../src/sim/hubFloor.js";

let pass = 0, fail = 0;
const eq = (a, b, msg) => {
  if (Math.abs(a - b) < 1e-6) pass++;
  else { fail++; console.error("FAIL:", msg, "got", a, "want", b); }
};

// --- floorHeightAt (what the hero walks on) ---
eq(floorHeightAt(0, 12), TIER.entrance, "spawn (0,12) is entrance tier");
eq(floorHeightAt(0, 0), TIER.hall, "crystal (0,0) is hall tier");
eq(floorHeightAt(-3, -14), TIER.bar, "bar (-3,-14) is bar tier");
eq(floorHeightAt(14, -11), TIER.hall, "side forge stays hall");
eq(floorHeightAt(14, 11), TIER.hall, "side incinerator stays hall");
eq(floorHeightAt(-14, 0), TIER.hall, "side wardrobe stays hall");
eq(floorHeightAt(0, 6), (TIER.hall + TIER.entrance) / 2, "entrance step midpoint ramps");
eq(floorHeightAt(0, -6), (TIER.hall + TIER.bar) / 2, "grand stair midpoint ramps");
eq(floorHeightAt(8, -12), TIER.bar, "wide bar platform reaches |x|<=10");
eq(floorHeightAt(13, -12), TIER.hall, "side nook behind platform stays hall");
eq(floorHeightAt(0, -2), TIER.hall, "in front of stairs is hall");

// --- tierFloorY (flat seating for tiles/props) ---
eq(tierFloorY(0, 6), TIER.entrance, "step region tile snaps to entrance");
eq(tierFloorY(0, -6), TIER.bar, "stair region tile snaps to bar");
eq(tierFloorY(0, 0), TIER.hall, "hall tile stays hall");

console.log(`hubFloor: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
