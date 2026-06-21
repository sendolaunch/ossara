// Three.js view. Reads the pure World each frame and draws it. Owns the scene,
// a THIRD-PERSON follow camera (Dungeon-Defenders style), the dungeon
// environment, per-entity mesh pools, and transient FX. No game rules here.

import * as THREE from "three";
import { PALETTE } from "../config/palette.js";
import { gridToWorld, worldToGrid } from "../sim/pathing.js";
import {
  createGround,
  createLaneTile,
  createCore,
  createHover,
  createEnemyMesh,
  createTowerMesh,
  createHeroMesh,
  createProjectileMesh,
  createRing,
  createSpark,
  createWall,
  createPillar,
} from "./meshFactory.js";
import { loadCharacter, pickClip } from "./assets.js";
import { MODELS } from "../config/models.js";

export class Renderer {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(PALETTE.void, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    this.domElement = this.renderer.domElement;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(PALETTE.void, 16, 46);

    // ---- third-person camera state ----
    this.camYaw = 0.6; // rotation around hero (radians); player-controllable
    this.camPitch = 0.46; // ~26° tilt — low, behind-the-shoulder (Dungeon Defenders feel)
    this.camDist = 7.5; // close so the hero is big in frame
    this.camMinDist = 4;
    this.camMaxDist = 22;
    this.camTarget = new THREE.Vector3(0, 1.1, 0); // look at the hero's upper body
    this._initCamera();
    this._initLights();

    this.staticGroup = new THREE.Group();
    this.entityGroup = new THREE.Group();
    this.fxGroup = new THREE.Group();
    this.scene.add(this.staticGroup, this.entityGroup, this.fxGroup);

    this.enemyMeshes = new Map();
    this.enemyPools = new Map();
    this.projMeshes = new Map();
    this.projPool = [];
    this.towerMeshes = new Map();
    this.fx = [];

    // real character model (loaded async; falls back to primitive)
    this.heroModel = null;
    this.heroMixer = null;

    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    window.addEventListener("resize", () => this._onResize());
  }

  _initCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(52, aspect, 0.1, 200);
    this.camera.position.set(10, 12, 14);
    this.camera.lookAt(0, 1, 0);
  }

  _initLights() {
    const hemi = new THREE.HemisphereLight(0x6e8a5a, 0x0a0a06, 0.5);
    this.scene.add(hemi);
    const amb = new THREE.AmbientLight(0x2a3326, 0.5);
    this.scene.add(amb);

    const dir = new THREE.DirectionalLight(0xdfeac6, 1.05);
    dir.position.set(10, 18, 8);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.near = 1;
    dir.shadow.camera.far = 60;
    const s = 18;
    dir.shadow.camera.left = -s;
    dir.shadow.camera.right = s;
    dir.shadow.camera.top = s;
    dir.shadow.camera.bottom = -s;
    this.scene.add(dir);

    const corePoint = new THREE.PointLight(PALETTE.plague, 1.6, 14, 2);
    corePoint.position.set(0, 2, 0);
    this.corePoint = corePoint;
  }

  // ---- camera control (called by Input) ------------------------------------

  orbit(dyaw) {
    this.camYaw += dyaw;
  }
  zoomBy(dz) {
    this.camDist = Math.max(this.camMinDist, Math.min(this.camMaxDist, this.camDist + dz));
  }
  // ground-plane forward/right for the current yaw, so WASD is camera-relative
  getBasis() {
    const y = this.camYaw;
    return {
      fwd: { x: -Math.sin(y), z: -Math.cos(y) },
      right: { x: Math.cos(y), z: -Math.sin(y) },
    };
  }

  _followCamera(hero, dt) {
    // smooth the look-at toward the hero
    const tx = hero.x;
    const tz = hero.z;
    const k = 1 - Math.pow(0.001, dt); // frame-rate independent lerp
    this.camTarget.x += (tx - this.camTarget.x) * k;
    this.camTarget.y += (1.1 - this.camTarget.y) * k;
    this.camTarget.z += (tz - this.camTarget.z) * k;

    const cp = Math.cos(this.camPitch);
    const sp = Math.sin(this.camPitch);
    const cx = this.camTarget.x + this.camDist * cp * Math.sin(this.camYaw);
    const cy = this.camTarget.y + this.camDist * sp;
    const cz = this.camTarget.z + this.camDist * cp * Math.cos(this.camYaw);
    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(this.camTarget);
  }

  // ---- static map + environment --------------------------------------------

  buildStatic(world) {
    const level = world.level;
    this.staticGroup.add(createGround(level));

    // lane tiles
    for (const key of world.pathSet) {
      const [col, row] = key.split(",").map(Number);
      const w = gridToWorld(col, row, level);
      const tile = createLaneTile();
      tile.position.set(w.x, 0, w.z);
      this.staticGroup.add(tile);
    }

    // core / ward
    this.coreMesh = createCore();
    const cw = gridToWorld(level.core.col, level.core.row, level);
    this.coreMesh.position.set(cw.x, 0, cw.z);
    this.coreCrystal = this.coreMesh.getObjectByName("crystal");
    this.corePoint.position.set(cw.x, 2, cw.z);
    this.staticGroup.add(this.coreMesh, this.corePoint);

    this._buildEnvironment(level);

    this.hover = createHover();
    this.staticGroup.add(this.hover);
    this._time = 0;

    this._loadHeroModel();
  }

  async _loadHeroModel() {
    const cfg = MODELS.hero;
    const res = await loadCharacter(cfg.file);
    if (!res) return; // file not present yet — keep the primitive Warden
    const m = res.scene;

    // Auto-fit: scale ANY model to a sensible height, plant feet on the ground,
    // and centre it — so the source model's original size/origin doesn't matter.
    const targetH = (cfg.targetHeight || 1.8) * (cfg.scale || 1);
    const box1 = new THREE.Box3().setFromObject(m);
    const size = new THREE.Vector3();
    box1.getSize(size);
    if (size.y > 0.0001) m.scale.setScalar(targetH / size.y);
    const box2 = new THREE.Box3().setFromObject(m);
    m.position.y -= box2.min.y; // feet to y=0
    m.position.x -= (box2.min.x + box2.max.x) / 2; // centre horizontally
    m.position.z -= (box2.min.z + box2.max.z) / 2;

    // Wrap so we can move/rotate the character by a clean origin at its feet.
    const wrap = new THREE.Group();
    wrap.add(m);
    this.entityGroup.add(wrap);
    this.heroModelCfg = cfg;

    if (res.animations.length) {
      this.heroMixer = new THREE.AnimationMixer(m);
      const clip = pickClip(res.animations, "idle", "stand");
      if (clip) this.heroMixer.clipAction(clip).play();
    }
    if (this.heroMesh) this.heroMesh.visible = false; // hide placeholder
    this.heroModel = wrap;
    console.log("[assets] hero model loaded (auto-fit).");
  }

  _buildEnvironment(level) {
    const t = level.tile;
    const halfW = (level.cols * t) / 2;
    const halfH = (level.rows * t) / 2;

    // perimeter walls (four runs of crenellated blocks)
    const wallY = 0;
    const addWall = (x, z, len, horizontal) => {
      const w = createWall(len, horizontal);
      w.position.set(x, wallY, z);
      this.staticGroup.add(w);
    };
    addWall(0, -halfH - 0.5, level.cols * t + 2, true);
    addWall(0, halfH + 0.5, level.cols * t + 2, true);
    addWall(-halfW - 0.5, 0, level.rows * t + 2, false);
    addWall(halfW + 0.5, 0, level.rows * t + 2, false);

    // scattered pillars/rubble off the lane for depth (deterministic placement)
    const spots = [
      [-halfW + 1.5, -halfH + 1.5],
      [halfW - 1.5, -halfH + 2.5],
      [-halfW + 2.5, halfH - 1.5],
      [halfW - 2.0, halfH - 2.0],
      [-1, -halfH + 1],
      [2, halfH - 1],
    ];
    for (const [x, z] of spots) {
      const p = createPillar();
      p.position.set(x, 0, z);
      this.staticGroup.add(p);
    }
  }

  // ---- input helper: screen -> grid cell ------------------------------------

  pointerToCell(clientX, clientY, level) {
    const rect = this.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.groundPlane, hit)) return null;
    const cell = worldToGrid(hit.x, hit.z, level);
    return { ...cell, x: hit.x, z: hit.z };
  }

  setHover(col, row, level, state) {
    if (col == null) {
      this.hover.visible = false;
      return;
    }
    const w = gridToWorld(col, row, level);
    this.hover.position.set(w.x, 0.06, w.z);
    this.hover.visible = true;
    this.hover.material.color.setHex(state === "ok" ? PALETTE.plague : PALETTE.blood);
    this.hover.material.opacity = state === "ok" ? 0.4 : 0.28;
  }

  // ---- per-frame sync -------------------------------------------------------

  update(world, dt) {
    this._time += dt;
    if (this.heroMixer) this.heroMixer.update(dt);
    this._followCamera(world.hero, dt);
    this._syncEnemies(world);
    this._syncProjectiles(world);
    this._syncTowers(world);
    this._syncHero(world);
    this._syncCore(world);
    this._spawnEventFx(world.events);
    this._updateFx(dt);
    this.renderer.render(this.scene, this.camera);
  }

  _acquireEnemyMesh(type) {
    const pool = this.enemyPools.get(type) || [];
    let mesh = pool.pop();
    if (!mesh) mesh = createEnemyMesh(type);
    this.entityGroup.add(mesh);
    mesh.visible = true;
    return mesh;
  }
  _releaseEnemyMesh(type, mesh) {
    this.entityGroup.remove(mesh);
    const pool = this.enemyPools.get(type) || [];
    pool.push(mesh);
    this.enemyPools.set(type, pool);
  }

  _syncEnemies(world) {
    const seen = new Set();
    for (const e of world.enemies) {
      if (!e.alive) continue;
      seen.add(e.id);
      let rec = this.enemyMeshes.get(e.id);
      if (!rec) {
        rec = { type: e.type, mesh: this._acquireEnemyMesh(e.type) };
        this.enemyMeshes.set(e.id, rec);
      }
      rec.mesh.position.set(e.x, 0, e.z);
      // bob/spin for a little life
      rec.mesh.rotation.y += (e.boss ? 0.6 : 1.2) * (1 / 60);
    }
    for (const [id, rec] of this.enemyMeshes) {
      if (!seen.has(id)) {
        this._releaseEnemyMesh(rec.type, rec.mesh);
        this.enemyMeshes.delete(id);
      }
    }
  }

  _syncProjectiles(world) {
    const seen = new Set();
    for (const p of world.projectiles) {
      if (!p.alive) continue;
      seen.add(p.id);
      let mesh = this.projMeshes.get(p.id);
      if (!mesh) {
        mesh = this.projPool.pop() || createProjectileMesh(p.color);
        this.entityGroup.add(mesh);
        this.projMeshes.set(p.id, mesh);
      }
      mesh.position.set(p.x, 0.6, p.z);
    }
    for (const [id, mesh] of this.projMeshes) {
      if (!seen.has(id)) {
        this.entityGroup.remove(mesh);
        this.projPool.push(mesh);
        this.projMeshes.delete(id);
      }
    }
  }

  _syncTowers(world) {
    for (const t of world.towers) {
      let mesh = this.towerMeshes.get(t.id);
      if (!mesh) {
        mesh = createTowerMesh(t.type);
        mesh.position.set(t.x, 0, t.z);
        this.entityGroup.add(mesh);
        this.towerMeshes.set(t.id, mesh);
      }
      const head = mesh.getObjectByName("head");
      if (head) head.rotation.y = t.facing;
    }
  }

  _syncHero(world) {
    const h = world.hero;
    if (this.heroModel) {
      const cfg = this.heroModelCfg || {};
      this.heroModel.position.set(h.x, cfg.y || 0, h.z);
      this.heroModel.rotation.y = h.facing + (cfg.yaw || 0);
      this.heroModel.visible = h.alive;
      return;
    }
    if (!this.heroMesh) {
      this.heroMesh = createHeroMesh();
      this.entityGroup.add(this.heroMesh);
    }
    this.heroMesh.position.set(h.x, 0, h.z);
    this.heroMesh.rotation.y = h.facing;
    this.heroMesh.visible = h.alive;
  }

  _syncCore(world) {
    const ratio = Math.max(0, world.core.hp / world.core.maxHp);
    if (this.coreCrystal) {
      const c = new THREE.Color(PALETTE.plague).lerp(new THREE.Color(PALETTE.blood), 1 - ratio);
      this.coreCrystal.material.color.copy(c);
      this.coreCrystal.material.emissive.copy(c);
      this.coreCrystal.material.emissiveIntensity = 0.6 + 0.6 * (0.5 + 0.5 * Math.sin(this._time * 3));
      this.coreCrystal.rotation.y += 0.4 * (1 / 60);
    }
    if (this.corePoint) this.corePoint.intensity = 0.6 + 1.4 * ratio;
  }

  _spawnEventFx(events) {
    for (const ev of events) {
      switch (ev.kind) {
        case "slam":
          this._ring(ev.x, ev.z, ev.range, "plague", 0.4);
          break;
        case "splash":
          this._ring(ev.x, ev.z, ev.range, "plague", 0.3);
          break;
        case "place":
          this._ring(ev.x, ev.z, 0.9, "ash", 0.3);
          break;
        case "impact":
        case "beam":
          this._spark(ev.x ?? ev.x2, ev.z ?? ev.z2, "bone");
          break;
        case "heroHit":
          this._spark(ev.x, ev.z, "plague");
          break;
        case "kill":
          this._spark(ev.x, ev.z, ev.boss ? "blood" : "plague");
          this._ring(ev.x, ev.z, ev.boss ? 1.8 : 0.7, ev.boss ? "blood" : "rot", 0.4);
          break;
        case "leak":
          this._ring(this.coreMesh.position.x, this.coreMesh.position.z, 1.2, "blood", 0.3);
          break;
        default:
          break;
      }
    }
  }

  _ring(x, z, range, colorKey, life) {
    const mesh = createRing(colorKey);
    mesh.position.set(x, 0.1, z);
    mesh.scale.setScalar(0.3);
    this.fxGroup.add(mesh);
    this.fx.push({ mesh, life, maxLife: life, kind: "ring", targetScale: Math.max(0.4, range) });
  }

  _spark(x, z, colorKey) {
    const mesh = createSpark(colorKey);
    mesh.position.set(x, 0.5, z);
    this.fxGroup.add(mesh);
    this.fx.push({ mesh, life: 0.35, maxLife: 0.35, kind: "spark", vy: 1.8 });
  }

  _updateFx(dt) {
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      f.life -= dt;
      const t = Math.max(0, f.life / f.maxLife);
      if (f.kind === "ring") {
        const sc = f.targetScale * (1 - t) + 0.3 * t;
        f.mesh.scale.setScalar(sc);
        f.mesh.material.opacity = t;
      } else if (f.kind === "spark") {
        f.mesh.position.y += (f.vy || 0) * dt;
        f.mesh.rotation.x += dt * 8;
        f.mesh.rotation.y += dt * 8;
        f.mesh.material.opacity = t;
        f.mesh.scale.setScalar(0.5 + t);
      }
      if (f.life <= 0) {
        this.fxGroup.remove(f.mesh);
        this.fx.splice(i, 1);
      }
    }
  }

  reset() {
    for (const [, rec] of this.enemyMeshes) this._releaseEnemyMesh(rec.type, rec.mesh);
    this.enemyMeshes.clear();
    for (const [, mesh] of this.projMeshes) {
      this.entityGroup.remove(mesh);
      this.projPool.push(mesh);
    }
    this.projMeshes.clear();
    for (const [, mesh] of this.towerMeshes) this.entityGroup.remove(mesh);
    this.towerMeshes.clear();
    for (const f of this.fx) this.fxGroup.remove(f.mesh);
    this.fx.length = 0;
  }

  _onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
