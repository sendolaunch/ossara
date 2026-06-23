// Headless test for the redesigned 3-tier hub floor (0 / +2.5 / +7).
// Run: node test/hubFloor.test.mjs
import { floorHeightAt, tierFloorY, TIER } from "../src/sim/hubFloor.js";

let pass = 0, fail = 0;
const eq = (a, b, msg) => {
  if (Math.abs(a - b) < 1e-6) pass++;
  else { fail++; console.error("FAIL:", msg, "got", a, "want", b); }
};

// floorHeightAt (hero ride height)
eq(floorHeightAt(0, 12), TIER.entry, "spawn is threshold (0)");
eq(floorHeightAt(0, 0), TIER.hall, "crystal is hall (2.5)");
eq(floorHeightAt(0, -14), TIER.bar, "bar is high tier (7)");
eq(floorHeightAt(-16, -2), TIER.hall, "forge side stays hall");
eq(floorHeightAt(16, 4), TIER.hall, "incinerator side stays hall");
eq(floorHeightAt(-9, 12), TIER.entry, "bounty on threshold");
eq(floorHeightAt(0, 7), 1.25, "entrance ramp midpoint");
eq(floorHeightAt(0, -4), 4.75, "grand staircase midpoint");
eq(floorHeightAt(4.5, -4), TIER.hall, "outside narrowed stair lane stays hall");
eq(floorHeightAt(8, -10), TIER.bar, "wide platform reaches |x|<=15");
eq(floorHeightAt(0, -6), TIER.bar, "platform front edge is bar");

// tierFloorY (flat seating)
eq(tierFloorY(0, 7), TIER.entry, "step tile snaps to threshold");
eq(tierFloorY(0, -4), TIER.bar, "stair tile snaps to bar");
eq(tierFloorY(4.5, -4), TIER.hall, "side floor beside narrowed stair stays hall");
eq(tierFloorY(0, 0), TIER.hall, "hall tile stays hall");

console.log(`hubFloor: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
