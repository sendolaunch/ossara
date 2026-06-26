// Placeholder art. THIS FILE IS THE SWAP POINT (design doc §14): every visible
// thing is built from cheap primitives here, keyed by the same ids the config
// uses. To upgrade art later, replace a create* function with a GLTF load that
// returns an Object3D of the same size/orientation — no other file changes.
//
// Geometries and materials are cached and SHARED across instances (low draw-cost,
// no per-spawn allocation), in line with the performance budget.

import * as THREE from "three";
import { PALETTE } from "../config/palette.js";
import { ENEMIES } from "../config/enemies.js";
import { TOWERS } from "../config/towers.js";

const matCache = new Map();
function mat(colorKey, { emissive = 0, metalness = 0.1, roughness = 0.8 } = {}) {
  const key = `${colorKey}|${emissive}|${metalness}|${roughness}`;
  if (matCache.has(key)) return matCache.get(key);
  const color = PALETTE[colorKey] ?? colorKey;
  const m = new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    metalness,
    roughness,
    emissive: emissive ? color : 0x000000,
    emissiveIntensity: emissive,
  });
  matCache.set(key, m);
  return m;
}

const geoCache = new Map();
const geo = (key, make) => {
  if (!geoCache.has(key)) geoCache.set(key, make());
  return geoCache.get(key);
};

// ---- ground & lane --------------------------------------------------------

export function createGround(level) {
  const w = level.cols * level.tile;
  const h = level.rows * level.tile;
  const g = new THREE.PlaneGeometry(w + 4, h + 4);
  const m = new THREE.MeshStandardMaterial({ color: PALETTE.void, roughness: 1, metalness: 0 });
  const mesh = new THREE.Mesh(g, m);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.05;
  mesh.receiveShadow = true;
  return mesh;
}

export function createLaneTile() {
  const g = geo("laneTile", () => new THREE.BoxGeometry(0.96, 0.08, 0.96));
  const mesh = new THREE.Mesh(g, mat("rot", { emissive: 0.25 }));
  mesh.position.y = 0.0;
  return mesh;
}

export function createBuildTile() {
  const g = geo("buildTile", () => new THREE.BoxGeometry(0.94, 0.04, 0.94));
  return new THREE.Mesh(g, mat("ash", { roughness: 1 }));
}

// Perimeter wall: a long stone run with crenellations on top. `len` is its
// length; `horizontal` true => runs along X, false => runs along Z.
export function createWall(len, horizontal) {
  const grp = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x23271d, roughness: 1, metalness: 0, flatShading: true });
  const body = new THREE.Mesh(new THREE.BoxGeometry(len, 1.6, 0.7), stone);
  body.position.y = 0.8;
  body.castShadow = true;
  body.receiveShadow = true;
  grp.add(body);
  // crenellations
  const n = Math.floor(len / 1.2);
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.7), stone);
    m.position.set(-len / 2 + 0.6 + i * 1.2, 1.8, 0);
    m.castShadow = true;
    grp.add(m);
  }
  if (!horizontal) grp.rotation.y = Math.PI / 2;
  return grp;
}

// Broken pillar / rubble prop for depth.
export function createPillar() {
  const grp = new THREE.Group();
  const stone = mat("ash", { roughness: 1 });
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 1.6, 7), stone);
  col.position.y = 0.8;
  col.castShadow = true;
  col.receiveShadow = true;
  grp.add(col);
  const cap = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), stone);
  cap.position.y = 1.7;
  cap.castShadow = true;
  grp.add(cap);
  // a faint moss/plague glow at the base
  const moss = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), mat("rot", { emissive: 0.5 }));
  moss.position.set(0.3, 0.2, 0.2);
  grp.add(moss);
  return grp;
}

// Single reusable hover highlight (moved around, recoloured).
export function createHover() {
  const g = geo("hover", () => new THREE.BoxGeometry(1, 0.12, 1));
  const m = new THREE.MeshBasicMaterial({ color: PALETTE.plague, transparent: true, opacity: 0.35 });
  const mesh = new THREE.Mesh(g, m);
  mesh.visible = false;
  return mesh;
}

// ---- core (the ward you defend) -------------------------------------------

export function createCore() {
  const grp = new THREE.Group();
  const g = geo("core", () => new THREE.OctahedronGeometry(0.55, 0));
  const m = new THREE.MeshStandardMaterial({
    color: PALETTE.plague,
    emissive: PALETTE.plague,
    emissiveIntensity: 1.2,
    flatShading: true,
    roughness: 0.4,
  });
  const crystal = new THREE.Mesh(g, m);
  crystal.position.y = 0.7;
  crystal.name = "crystal";
  grp.add(crystal);
  const base = new THREE.Mesh(geo("coreBase", () => new THREE.CylinderGeometry(0.5, 0.6, 0.4, 6)), mat("ash"));
  base.position.y = 0.2;
  grp.add(base);
  return grp;
}

// ---- enemies --------------------------------------------------------------

export function createEnemyMesh(typeId) {
  const def = ENEMIES[typeId];
  const r = def.radius;
  let g;
  switch (typeId) {
    case "sprinter":
      g = geo("e_sprinter", () => new THREE.ConeGeometry(1, 2, 5));
      break;
    case "bonebow":
      g = geo("e_bonebow", () => new THREE.ConeGeometry(0.85, 1.65, 5));
      break;
    case "plaguewick":
      g = geo("e_plaguewick", () => new THREE.ConeGeometry(0.78, 1.5, 5));
      break;
    case "brute":
    case "gravebreaker":
      g = geo("e_brute", () => new THREE.IcosahedronGeometry(1, 0));
      break;
    case "herald":
      g = geo("e_herald", () => new THREE.DodecahedronGeometry(1, 0));
      break;
    default: // rotling / legacy husk
      g = geo("e_husk", () => new THREE.BoxGeometry(1.2, 1.6, 1.2));
  }
  const m = mat(def.color, { emissive: def.boss ? 0.6 : 0.0, roughness: 0.9 });
  const mesh = new THREE.Mesh(g, m);
  const s = r * 1.6;
  mesh.scale.set(s, s, s);
  mesh.position.y = r;
  mesh.castShadow = true;
  mesh.userData.baseScale = s;
  return mesh;
}

// ---- towers ---------------------------------------------------------------

export function createTowerMesh(typeId) {
  const def = TOWERS[typeId];
  const grp = new THREE.Group();
  const base = new THREE.Mesh(geo("t_base", () => new THREE.CylinderGeometry(0.34, 0.42, 0.3, 6)), mat("ash"));
  base.position.y = 0.15;
  grp.add(base);

  const head = new THREE.Group();
  head.position.y = 0.35;
  head.name = "head"; // rotated to face the target
  grp.add(head);

  if (typeId === "spikegate") {
    for (let i = 0; i < 5; i++) {
      const spike = new THREE.Mesh(geo("t_spike", () => new THREE.ConeGeometry(0.12, 0.5, 4)), mat(def.color));
      const a = (i / 5) * Math.PI * 2;
      spike.position.set(Math.cos(a) * 0.18, 0.2, Math.sin(a) * 0.18);
      head.add(spike);
    }
  } else if (typeId === "ballista") {
    const arm = new THREE.Mesh(geo("t_arm", () => new THREE.BoxGeometry(0.12, 0.12, 0.7)), mat(def.color));
    arm.position.y = 0.18;
    head.add(arm);
    const bow = new THREE.Mesh(geo("t_bow", () => new THREE.BoxGeometry(0.6, 0.1, 0.1)), mat(def.color));
    bow.position.set(0, 0.18, 0.28);
    head.add(bow);
  } else {
    // spire
    const spire = new THREE.Mesh(geo("t_spire", () => new THREE.ConeGeometry(0.26, 1.0, 6)), mat(def.color, { emissive: 0.7 }));
    spire.position.y = 0.5;
    head.add(spire);
  }
  return grp;
}

// ---- hero -----------------------------------------------------------------

export function createHeroMesh() {
  const grp = new THREE.Group();
  const body = new THREE.Mesh(geo("h_body", () => new THREE.CylinderGeometry(0.26, 0.3, 0.7, 8)), mat("bone", { metalness: 0.3, roughness: 0.5 }));
  body.position.y = 0.45;
  grp.add(body);
  const head = new THREE.Mesh(geo("h_head", () => new THREE.SphereGeometry(0.2, 10, 8)), mat("bone"));
  head.position.y = 0.95;
  grp.add(head);
  // a plague-green visor/eye and a facing nub
  const visor = new THREE.Mesh(geo("h_visor", () => new THREE.BoxGeometry(0.22, 0.08, 0.12)), mat("plague", { emissive: 0.9 }));
  visor.position.set(0, 0.95, 0.16);
  grp.add(visor);
  const nub = new THREE.Mesh(geo("h_nub", () => new THREE.ConeGeometry(0.1, 0.25, 4)), mat("plague", { emissive: 0.4 }));
  nub.rotation.x = Math.PI / 2;
  nub.position.set(0, 0.45, 0.34);
  grp.add(nub);
  return grp;
}

// ---- projectile -----------------------------------------------------------

export function createProjectileMesh(colorKey) {
  const g = geo("proj", () => new THREE.SphereGeometry(0.12, 6, 6));
  return new THREE.Mesh(g, mat(colorKey || "bone", { emissive: 0.8 }));
}

// ---- transient FX ----------------------------------------------------------

export function createRing(colorKey) {
  const g = geo("ring", () => new THREE.RingGeometry(0.6, 0.75, 24));
  const m = new THREE.MeshBasicMaterial({ color: PALETTE[colorKey] ?? PALETTE.plague, transparent: true, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, m);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

export function createSpark(colorKey) {
  const g = geo("spark", () => new THREE.TetrahedronGeometry(0.15, 0));
  const m = new THREE.MeshBasicMaterial({ color: PALETTE[colorKey] ?? PALETTE.bone, transparent: true });
  return new THREE.Mesh(g, m);
}
