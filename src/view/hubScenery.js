// Background scenery for the Undercroft — PURELY DECORATIVE, far away, NON-walkable.
// No collision, no pathing, never part of the play grid. It exists only so the
// player never sees black void past the walls: a distant silhouette of the dead
// kingdom (broken towers, rooftops, a fallen cathedral, dead trees) under a
// plague-green horizon glow with fog (design-doc §12 palette). Low detail on
// purpose — the close hero camera crops most of it; it just fills the gaps.
//
// Everything here lives in a single root entity (`scenery`) far outside the keep
// so it is trivially separable and cheap. Caller adds the returned entity to the
// scene root; hubWorld also sets the matching fog so silhouettes fade correctly.

import * as pc from "playcanvas";
import { PALETTE } from "../config/palette.js";

const col = (hex) => new pc.Color(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);

function flatMat(hex, emissive = 0) {
  const c = col(hex);
  const m = new pc.StandardMaterial();
  m.diffuse = c;
  m.useLighting = emissive <= 0 ? true : false; // glow bits ignore scene lights
  if (emissive > 0) {
    m.emissive = c;
    m.emissiveIntensity = emissive;
  }
  m.update();
  return m;
}

function box(parent, mat, x, y, z, sx, sy, sz, ry = 0) {
  const e = new pc.Entity();
  e.addComponent("render", { type: "box", castShadows: false, receiveShadows: false });
  if (e.render.meshInstances[0]) e.render.meshInstances[0].material = mat;
  e.setLocalScale(sx, sy, sz);
  e.setLocalPosition(x, y, z);
  if (ry) e.setLocalEulerAngles(0, ry, 0);
  parent.addChild(e);
  return e;
}

function cyl(parent, mat, x, y, z, d, h) {
  const e = new pc.Entity();
  e.addComponent("render", { type: "cylinder", castShadows: false, receiveShadows: false });
  if (e.render.meshInstances[0]) e.render.meshInstances[0].material = mat;
  e.setLocalScale(d, h, d);
  e.setLocalPosition(x, y, z);
  parent.addChild(e);
  return e;
}

// Deterministic tiny PRNG so the skyline is stable between loads.
function mulberry(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildScenery(app) {
  const root = new pc.Entity("scenery");
  app.root.addChild(root);

  // Silhouette materials: near-black with a faint cold/green cast so towers read
  // as black cutouts against the horizon glow.
  const silhouette = flatMat(0x0a120c);
  const silhouette2 = flatMat(0x0c1610);
  const deadWood = flatMat(0x141009);

  // --- Horizon plague-green glow band (sits behind the skyline) ---------------
  // A tall faint ring of emissive panels low on the horizon → the sickly dawn.
  const glowMat = flatMat(PALETTE.plague, 0.5);
  const glowRing = new pc.Entity("horizon-glow");
  root.addChild(glowRing);
  {
    const R = 150;
    const panels = 28;
    for (let i = 0; i < panels; i++) {
      const a = (i / panels) * Math.PI * 2;
      const x = Math.cos(a) * R;
      const z = Math.sin(a) * R;
      const p = box(glowRing, glowMat, x, 9, z, 36, 22, 0.5, (-a * 180) / Math.PI + 90);
      // dim it deliberately; fog will eat most of it into a band
    }
  }

  // --- Distant ruined-city skyline ring (broken towers + rooftops) ------------
  const rng = mulberry(1337);
  const city = new pc.Entity("dead-city");
  root.addChild(city);
  {
    const R = 95;
    const count = 70;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + (rng() - 0.5) * 0.05;
      const rr = R + (rng() - 0.5) * 22;
      const x = Math.cos(a) * rr;
      const z = Math.sin(a) * rr;
      const mat = rng() > 0.5 ? silhouette : silhouette2;
      const kind = rng();
      const ry = (-a * 180) / Math.PI;
      if (kind < 0.5) {
        // rooftop block (low, wide) — distant town houses
        const h = 6 + rng() * 8;
        box(city, mat, x, h / 2, z, 5 + rng() * 6, h, 5 + rng() * 6, ry);
      } else if (kind < 0.82) {
        // broken tower (tall, thin, often snapped at an angle)
        const h = 16 + rng() * 22;
        const t = box(city, mat, x, h / 2, z, 3 + rng() * 2, h, 3 + rng() * 2, ry);
        if (rng() > 0.5) t.setLocalEulerAngles((rng() - 0.5) * 10, ry, (rng() - 0.5) * 12); // leaning ruin
      } else {
        // spire / chimney
        const h = 20 + rng() * 18;
        box(city, mat, x, h / 2, z, 1.6 + rng(), h, 1.6 + rng(), ry);
      }
    }
  }

  // --- The fallen cathedral (a larger broken landmark on one side) ------------
  {
    const cx = -70;
    const cz = -70;
    const cm = silhouette2;
    // long nave (collapsed roof = gap left in the middle)
    box(city, cm, cx - 8, 9, cz, 7, 18, 26, 35);
    box(city, cm, cx + 8, 9, cz, 7, 18, 26, 35);
    // standing west front with a broken twin-tower
    box(city, cm, cx - 14, 16, cz - 12, 6, 32, 6, 35);
    box(city, cm, cx - 6, 12, cz - 16, 6, 24, 6, 35); // snapped second tower (shorter)
    // a hint of a rose-window arch via a tall thin block
    box(city, cm, cx - 11, 22, cz - 14, 7, 10, 1.2, 35);
  }

  // --- Dead trees scattered at mid distance (between walls and city) ----------
  const trees = new pc.Entity("dead-trees");
  root.addChild(trees);
  {
    const rng2 = mulberry(99);
    const n = 16;
    for (let i = 0; i < n; i++) {
      const a = rng2() * Math.PI * 2;
      const rr = 34 + rng2() * 24;
      const x = Math.cos(a) * rr;
      const z = Math.sin(a) * rr;
      const h = 5 + rng2() * 4;
      cyl(trees, deadWood, x, h / 2, z, 0.5 + rng2() * 0.4, h);
      // a few bare branches
      const branches = 2 + ((rng2() * 3) | 0);
      for (let b = 0; b < branches; b++) {
        const ba = rng2() * Math.PI * 2;
        const bx = x + Math.cos(ba) * 1.4;
        const bz = z + Math.sin(ba) * 1.4;
        const bb = box(trees, deadWood, bx, h * 0.8, bz, 0.25, 2.4 + rng2(), 0.25);
        bb.setLocalEulerAngles((rng2() - 0.5) * 80, (ba * 180) / Math.PI, (rng2() - 0.5) * 80);
      }
    }
  }

  // --- Dead ground plane far out, so there is no void under the silhouettes ---
  const ground = new pc.Entity("far-ground");
  ground.addComponent("render", { type: "plane", castShadows: false, receiveShadows: false });
  const gmat = flatMat(0x070b07);
  if (ground.render.meshInstances[0]) ground.render.meshInstances[0].material = gmat;
  ground.setLocalScale(400, 1, 400);
  ground.setLocalPosition(0, -0.5, 0);
  root.addChild(ground);

  return root;
}
