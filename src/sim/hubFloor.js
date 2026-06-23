// THE UNDERCROFT — single source of truth for floor elevation (Stage A redesign).
//
// Pure (x,z) -> y, node-testable, shared by the renderer (seats floor/props at the
// right height) and hub3d (lifts the hero + camera). Changing TIER here auto-propagates
// to the crystal (TIER.hall), the bar (TIER.bar) and every station marker (tierFloorY).
//
// Coord note: south / entrance = +z (spawn ~ +12), north / bar = -z, crystal at centre.
// Dramatic 3-tier verticality, front (low) -> back (high):
//   Tier 1  Threshold  entrance, front, y = 0      (spawn)
//   Tier 2  Ward Hall   big open middle + sides, y = 2.5   (crystal, station alcoves)
//   Tier 3  High Bar    raised back platform, y = 7        (+4.5 up a grand staircase)

export const TIER = { entry: 0, hall: 2.5, bar: 7 };

// Threshold: flat 0 for z >= zFlat; a short step-ramp up to the hall over [zRamp, zFlat].
export const ENTRY = { zFlat: 8, zRamp: 6 };
// Bar platform: flat 7 for z <= zFlat within |x| <= halfX. The ONLY way up is the central
// grand staircase (|x| <= stairHalfX), ramping hall -> bar over [zRamp, zFlat].
export const BARP = { zFlat: -6, zRamp: -2, halfX: 15, stairHalfX: 5 };

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const lerp = (a, b, t) => a + (b - a) * clamp01(t);

// Smooth height the HERO + camera ride (ramps included).
export function floorHeightAt(x, z) {
  if (z >= ENTRY.zFlat) return TIER.entry;                       // threshold (full width front)
  if (z >= ENTRY.zRamp)
    return lerp(TIER.hall, TIER.entry, (z - ENTRY.zRamp) / (ENTRY.zFlat - ENTRY.zRamp));
  if (z <= BARP.zFlat && Math.abs(x) <= BARP.halfX) return TIER.bar;             // bar platform
  if (Math.abs(x) <= BARP.stairHalfX && z <= BARP.zRamp)                          // grand staircase
    return lerp(TIER.hall, TIER.bar, (BARP.zRamp - z) / (BARP.zRamp - BARP.zFlat));
  return TIER.hall;                                              // the big open hall + sides
}

// FLAT tier height (no ramps) — seats floor tiles / props level while the hero ramps.
export function tierFloorY(x, z) {
  if (z >= ENTRY.zRamp) return TIER.entry;
  if (z <= BARP.zFlat && Math.abs(x) <= BARP.halfX) return TIER.bar;
  if (Math.abs(x) <= BARP.stairHalfX && z <= BARP.zRamp) return TIER.bar;
  return TIER.hall;
}
