// THE UNDERCROFT — single source of truth for floor elevation (the 3-tier bowl).
//
// Pure (x,z) -> y so it is node-testable AND shared by both:
//   - the renderer (tavernWorld places visible floor/props at the right height), and
//   - hub3d (lifts the hero + camera to match the floor under the player's feet).
//
// Coordinate note: south / entrance = +z (spawn at +12), north / bar = -z,
// the Ward-Crystal sits at the centre (0,0). Three tiers, front (low) -> back (high):
//   Tier 1  "Threshold"  entrance, front-centre, y = 0      (spawn here)
//   Tier 2  "Ward Hall"  main floor + side nooks, y = 1.5   (crystal + gear stations)
//   Tier 3  "High Bar"   raised back-centre platform, y = 3 (reached by the grand stairs)
//
// Only the CENTRE column changes height. The side nooks (|x| >= SIDE_X) stay on the
// hall tier so the side stations are always reachable on the flat.

export const TIER = { entrance: 0, hall: 1.5, bar: 3.0 };

export const SIDE_X = 11; // |x| >= SIDE_X  => side nooks, always hall level
// front-centre entrance tier: flat for z >= zFlat, ramps up to the hall over [zStepTop, zFlat]
export const ENTRANCE = { zFlat: 7, zStepTop: 5 };
// back-centre bar platform: the raised platform is the band z <= zFlat, |x| <= platHalfX.
// The grand staircase (the only way up) is the central corridor |x| <= halfX, ramping over
// [zStepTop, zFlat]. Platform sides outside the stairs are walled off (riser + collider).
export const BARP = { zFlat: -8, zStepTop: -4, halfX: 4, platHalfX: 11 };

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const lerp = (a, b, t) => a + (b - a) * clamp01(t);

// Smooth height the HERO walks on (ramps included). Use for the player + camera.
export function floorHeightAt(x, z) {
  if (Math.abs(x) >= SIDE_X) return TIER.hall; // side nooks stay mid
  // entrance (front-centre) + its step up to the hall
  if (z >= ENTRANCE.zFlat) return TIER.entrance;
  if (z >= ENTRANCE.zStepTop)
    return lerp(TIER.hall, TIER.entrance, (z - ENTRANCE.zStepTop) / (ENTRANCE.zFlat - ENTRANCE.zStepTop));
  // raised bar platform (back-centre)
  if (z <= BARP.zFlat && Math.abs(x) <= BARP.platHalfX) return TIER.bar;
  // grand staircase up the centre (the only walkable way onto the platform)
  if (Math.abs(x) <= BARP.halfX && z <= BARP.zStepTop)
    return lerp(TIER.hall, TIER.bar, (BARP.zStepTop - z) / (BARP.zStepTop - BARP.zFlat));
  return TIER.hall;
}

// FLAT tier height (no ramps) — used to seat floor tiles & props on a level surface,
// while the hero ramps smoothly between them via floorHeightAt().
export function tierFloorY(x, z) {
  if (Math.abs(x) >= SIDE_X) return TIER.hall;
  if (z >= ENTRANCE.zStepTop) return TIER.entrance;            // entrance + step snaps down
  if (z <= BARP.zFlat && Math.abs(x) <= BARP.platHalfX) return TIER.bar;  // platform
  if (Math.abs(x) <= BARP.halfX && z <= BARP.zStepTop) return TIER.bar;   // stairs snap up
  return TIER.hall;
}
