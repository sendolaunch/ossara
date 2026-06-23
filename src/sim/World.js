// OSSARA — pure game simulation (design doc §9 step 1).
// No DOM, no Three.js, no randomness: deterministic given the dt sequence, which
// makes it unit-testable headlessly in Node. The view layer reads this state and
// draws; input is fed in as a plain object. Keep it that way (§14: art/code split).

import { ENEMIES } from "../config/enemies.js";
import { TOWERS } from "../config/towers.js";
import { WAVES } from "../config/waves.js";
import { HERO } from "../config/hero.js";
import { CLASS_KITS } from "../config/kits.js";
import { buildLanePath, buildLanePaths, pointAtDistance, pathCellSet, gridToWorld, worldToGrid, cellKey, expandRects, getLevelLanes } from "./pathing.js";
import { Pool } from "./pool.js";
import { createEnemy, resetEnemy } from "./Enemy.js";
import { createProjectile, resetProjectile } from "./Projectile.js";
import { createTower } from "./Tower.js";
import { createHero } from "./Hero.js";

const dist2 = (ax, az, bx, bz) => {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
};

export class World {
  constructor(level, waves = WAVES, opts = {}) {
    this.level = level;
    this.waves = waves;
    this.heroDef = opts.hero || CLASS_KITS.warden.hero;
    this.availableTowers = opts.towers || Object.keys(TOWERS);
    this.bonuses = opts.bonuses || {};
    this.lanePaths = buildLanePaths(level);
    this.laneIds = Object.keys(this.lanePaths);
    this.defaultLaneId = this.laneIds[0] || "legacy";
    this.lane = this.lanePaths[this.defaultLaneId] || buildLanePath(level);
    this.pathSet = pathCellSet(level);
    this.occupied = new Set(); // cell keys with a tower on them

    // impassable ruins (obstacle rects minus any cell on the lane)
    this.blockedSet = new Set();
    const blockedZones = [...(level.obstacles || []), ...(level.blockedZones || [])];
    for (const cell of expandRects(blockedZones)) {
      const k = cellKey(cell.col, cell.row);
      if (!this.pathSet.has(k)) this.blockedSet.add(k);
    }

    this.enemyPool = new Pool(createEnemy, resetEnemy);
    this.projPool = new Pool(createProjectile, resetProjectile);
    this.towers = [];
    const heroDef = level.heroSpawn ? { ...this.heroDef, spawn: level.heroSpawn } : this.heroDef;
    this.hero = createHero(heroDef, level);
    const heroSpawnGrid = worldToGrid(this.hero._spawn.x, this.hero._spawn.z, level);
    this.reservedSet = new Set([
      cellKey(level.core.col, level.core.row),
      cellKey(heroSpawnGrid.col, heroSpawnGrid.row),
    ]);
    for (const lane of getLevelLanes(level)) {
      if (lane.spawn) this.reservedSet.add(cellKey(lane.spawn.col, lane.spawn.row));
    }
    if (level.breach) this.reservedSet.add(cellKey(level.breach.col, level.breach.row));
    for (const cell of expandRects(level.reservedZones || [])) this.reservedSet.add(cellKey(cell.col, cell.row));
    const _B = this.bonuses;
    this.hero.ability = { ...this.hero.ability };
    this.hero.attackDamage *= 1 + (_B.heroDamagePct || 0) / 100;
    this.hero.ability.damage *= 1 + (_B.heroDamagePct || 0) / 100;
    this.hero.maxHp = Math.round(this.hero.maxHp * (1 + (_B.heroHpPct || 0) / 100));
    this.hero.hp = this.hero.maxHp;
    this.hero.speed *= 1 + (_B.movePct || 0) / 100;
    this.hero.attackRate *= 1 + (_B.fireRatePct || 0) / 100;

    const _wardMul = 1 + (this.bonuses.wardPct || 0) / 100;
    const _coreHp = Math.round(level.coreHp * _wardMul);
    this.core = { hp: _coreHp, maxHp: _coreHp, ...gridToWorld(level.core.col, level.core.row, level) };
    this.marrow = level.startingMarrow;

    // Wave state machine.
    this.waveIndex = 0; // 0-based index into WAVES
    this.phase = "prep"; // prep | active | won | lost
    this.prepTimer = this.waves[0].prepTime;
    this.schedule = []; // [{type, time}] for the active wave
    this.spawnCursor = 0;
    this.waveElapsed = 0;

    this.status = "playing"; // playing | won | lost
    this._nextId = 1;

    // Transient per-frame events for the view (FX). Drained each update.
    this.events = [];

    // Map bounds for hero clamp (half a tile of margin past the outer cells).
    const t = level.tile;
    this.bounds = {
      minX: gridToWorld(0, 0, level).x - 0.5 * t,
      maxX: gridToWorld(level.cols - 1, 0, level).x + 0.5 * t,
      minZ: gridToWorld(0, 0, level).z - 0.5 * t,
      maxZ: gridToWorld(0, level.rows - 1, level).z + 0.5 * t,
    };

    this.stats = { kills: 0, leaked: 0 };
  }

  get enemies() {
    return this.enemyPool.active;
  }
  get projectiles() {
    return this.projPool.active;
  }
  get totalWaves() {
    return this.waves.length;
  }

  // ---- building -------------------------------------------------------------

  placementStatus(typeId, col, row, opts = {}) {
    const k = cellKey(col, row);
    if (typeId && !TOWERS[typeId]) return { ok: false, reason: "unknown" };
    if (col < 0 || row < 0 || col >= this.level.cols || row >= this.level.rows) return { ok: false, reason: "bounds" };
    if (this.reservedSet.has(k)) return { ok: false, reason: "reserved" };
    if (this.pathSet.has(k)) return { ok: false, reason: "path" };
    if (this.blockedSet.has(k)) return { ok: false, reason: "blocked" };
    if (this.occupied.has(k)) return { ok: false, reason: "occupied" };
    const def = typeId ? TOWERS[typeId] : null;
    if (!opts.ignoreCost && def && this.marrow < def.cost) return { ok: false, reason: "marrow" };
    return { ok: true, reason: "ok" };
  }

  buildableAt(col, row) {
    return this.placementStatus(null, col, row, { ignoreCost: true }).ok;
  }

  _blockedAt(x, z) {
    const g = worldToGrid(x, z, this.level);
    return this.blockedSet.has(cellKey(g.col, g.row));
  }

  tryPlaceTower(typeId, col, row, opts = {}) {
    const def = TOWERS[typeId];
    if (!def) return { ok: false, reason: "unknown tower" };
    const status = this.placementStatus(typeId, col, row);
    if (!status.ok) return { ok: false, reason: status.reason === "unknown" ? "unknown tower" : status.reason };
    this.marrow -= def.cost;
    const w = gridToWorld(col, row, this.level);
    const tower = createTower(def, col, row, w, { facing: opts.facing || 0 });
    tower.damage *= 1 + (this.bonuses.towerDamagePct || 0) / 100;
    tower.range *= 1 + (this.bonuses.rangePct || 0) / 100;
    tower.fireRate *= 1 + (this.bonuses.fireRatePct || 0) / 100;
    this.towers.push(tower);
    this.occupied.add(cellKey(col, row));
    this.events.push({ kind: "place", x: w.x, z: w.z });
    return { ok: true, tower };
  }

  // ---- wave control ---------------------------------------------------------

  startWave() {
    if (this.phase !== "prep") return false;
    const wave = this.waves[this.waveIndex];
    this.schedule = [];
    for (const g of wave.groups) {
      for (let i = 0; i < g.count; i++) {
        this.schedule.push({ type: g.type, laneId: g.laneId || this.defaultLaneId, time: g.delay + i * g.interval });
      }
    }
    this.schedule.sort((a, b) => a.time - b.time);
    this.spawnCursor = 0;
    this.waveElapsed = 0;
    this.phase = "active";
    return true;
  }

  _spawnEnemy(typeId, laneId = this.defaultLaneId) {
    const def = ENEMIES[typeId];
    const path = this.lanePaths[laneId] || this.lane;
    const start = pointAtDistance(path, 0);
    this.enemyPool.acquire(def, this._nextId++, start, path.id || laneId || this.defaultLaneId);
  }

  // ---- main tick ------------------------------------------------------------

  update(dt, input = {}) {
    if (this.status !== "playing") return;
    this.events.length = 0;

    if (this.phase === "prep") {
      this.prepTimer -= dt;
      if (input.startWave || this.prepTimer <= 0) this.startWave();
    }

    if (this.phase === "active") {
      this.waveElapsed += dt;
      while (this.spawnCursor < this.schedule.length && this.schedule[this.spawnCursor].time <= this.waveElapsed) {
        const spawn = this.schedule[this.spawnCursor];
        this._spawnEnemy(spawn.type, spawn.laneId);
        this.spawnCursor++;
      }
    }

    this._updateEnemies(dt);
    this._updateHero(dt, input);
    this._updateTowers(dt);
    this._updateProjectiles(dt);

    // Reap dead objects back into their pools.
    this.enemyPool.sweep((e) => !e.alive);
    this.projPool.sweep((p) => !p.alive);

    this._checkWaveProgress();
    this._checkEndStates();
  }

  _updateEnemies(dt) {
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.dist += e.speed * dt;
      const lane = this.lanePaths[e.laneId] || this.lane;
      const p = pointAtDistance(lane, e.dist);
      e.x = p.x;
      e.z = p.z;
      if (p.done && !e.counted) {
        e.counted = true;
        e.alive = false;
        e.reachedCore = true;
        this.core.hp -= e.leak;
        this.stats.leaked++;
        this.events.push({ kind: "leak", x: this.core.x, z: this.core.z, amount: e.leak });
      }
    }
  }

  _killEnemy(e) {
    if (!e.alive || e.counted) return;
    e.counted = true;
    e.alive = false;
    this.marrow += Math.round(e.bounty * (1 + (this.bonuses.marrowPct || 0) / 100));
    this.stats.kills++;
    this.events.push({ kind: "kill", x: e.x, z: e.z, bounty: e.bounty, boss: e.boss });
  }

  _damageEnemy(e, dmg) {
    if (!e.alive) return;
    e.hp -= dmg;
    if (e.hp <= 0) this._killEnemy(e);
  }

  _nearestEnemyWithin(x, z, range) {
    let best = null;
    let bestD = range * range;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = dist2(x, z, e.x, e.z);
      if (d <= bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  _enemyById(id) {
    for (const e of this.enemies) if (e.id === id && e.alive) return e;
    return null;
  }

  _updateHero(dt, input) {
    const h = this.hero;
    if (!h.alive) {
      h.respawnTimer -= dt;
      if (h.respawnTimer <= 0) {
        h.alive = true;
        h.hp = h.maxHp;
        h.x = h._spawn.x;
        h.z = h._spawn.z;
      }
      return;
    }

    // Movement (WASD-derived direction, normalized).
    let mx = input.moveX || 0;
    let mz = input.moveZ || 0;
    const m = Math.hypot(mx, mz);
    if (m > 0) {
      mx /= m;
      mz /= m;
      const step = h.speed * dt;
      // per-axis move with obstacle collision (slides along ruins)
      const nx = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, h.x + mx * step));
      if (!this._blockedAt(nx, h.z)) h.x = nx;
      const nz = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, h.z + mz * step));
      if (!this._blockedAt(h.x, nz)) h.z = nz;
      h.facing = Math.atan2(mx, mz);
    }

    // Auto-attack nearest enemy in melee range.
    h.attackCd -= dt;
    if (h.attackCd <= 0) {
      const target = this._nearestEnemyWithin(h.x, h.z, h.attackRange + 0.3);
      if (target) {
        this._damageEnemy(target, h.attackDamage);
        h.attackCd = 1 / h.attackRate;
        h.facing = Math.atan2(target.x - h.x, target.z - h.z);
        this.events.push({ kind: "heroHit", x: target.x, z: target.z });
      }
    }

    // Signature ability (Q) — behaviour depends on the class kit.
    h.abilityCd -= dt;
    if (input.slam && h.abilityCd <= 0) {
      this._useAbility(h);
      h.abilityCd = h.ability.cooldown;
    }

    // Contact damage: enemies hurt the hero only if he body-blocks them.
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const rr = (e.radius + h.radius) * (e.radius + h.radius);
      if (dist2(h.x, h.z, e.x, e.z) <= rr) {
        h.hp -= e.leak * 6 * dt; // contact dps scales with how dangerous it is
      }
    }
    if (h.hp <= 0) {
      h.alive = false;
      h.hp = 0;
      h.respawnTimer = 4;
      this.events.push({ kind: "heroDown", x: h.x, z: h.z });
    }
  }

  _useAbility(h) {
    const ab = h.ability;
    const r2 = ab.range * ab.range;
    if (ab.type === "cone") {
      // forward arc in the hero's facing
      const fx = Math.sin(h.facing);
      const fz = Math.cos(h.facing);
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const dx = e.x - h.x;
        const dz = e.z - h.z;
        const d2 = dx * dx + dz * dz;
        if (d2 > r2 || d2 < 1e-6) continue;
        const d = Math.sqrt(d2);
        if ((dx / d) * fx + (dz / d) * fz > 0.5) this._damageEnemy(e, ab.damage); // ~60° cone
      }
    } else if (ab.type === "chain") {
      const inRange = this.enemies.filter((e) => e.alive && dist2(h.x, h.z, e.x, e.z) <= r2);
      inRange.sort((a, b) => dist2(h.x, h.z, a.x, a.z) - dist2(h.x, h.z, b.x, b.z));
      const n = Math.min(ab.chain || 5, inRange.length);
      for (let i = 0; i < n; i++) this._damageEnemy(inRange[i], ab.damage);
    } else {
      // radial / cloud — burst around the hero
      for (const e of this.enemies) {
        if (e.alive && dist2(h.x, h.z, e.x, e.z) <= r2) this._damageEnemy(e, ab.damage);
      }
      if (ab.type === "cloud" && ab.heal) h.hp = Math.min(h.maxHp, h.hp + ab.heal);
    }
    this.events.push({ kind: "slam", x: h.x, z: h.z, range: ab.range });
  }

  _updateTowers(dt) {
    for (const t of this.towers) {
      t.cooldown -= dt;
      // Re-acquire target if lost.
      let target = t.targetId ? this._enemyById(t.targetId) : null;
      if (!target || dist2(t.x, t.z, target.x, target.z) > t.range * t.range) {
        target = this._nearestEnemyWithin(t.x, t.z, t.range);
        t.targetId = target ? target.id : 0;
      }
      if (target) t.facing = Math.atan2(target.x - t.x, target.z - t.z);
      if (target && t.cooldown <= 0) {
        t.cooldown = 1 / t.fireRate;
        if (t.projSpeed === Infinity) {
          // Hitscan.
          this._applyHit(target, t.x, t.z, t.damage, t.splash);
          this.events.push({ kind: "beam", x1: t.x, z1: t.z, x2: target.x, z2: target.z, color: t.color });
        } else {
          this.projPool.acquire(this._nextId++, { x: t.x, z: t.z }, target.id, t);
        }
      }
    }
  }

  _applyHit(target, ix, iz, dmg, splash) {
    if (splash > 0) {
      const r2 = splash * splash;
      // impact centred on the target's position
      const cx = target ? target.x : ix;
      const cz = target ? target.z : iz;
      for (const e of this.enemies) {
        if (e.alive && dist2(cx, cz, e.x, e.z) <= r2) this._damageEnemy(e, dmg);
      }
      this.events.push({ kind: "splash", x: cx, z: cz, range: splash });
    } else if (target) {
      this._damageEnemy(target, dmg);
      this.events.push({ kind: "impact", x: target.x, z: target.z });
    }
  }

  _updateProjectiles(dt) {
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      const target = this._enemyById(p.targetId);
      if (!target) {
        p.alive = false; // target gone — fizzle
        continue;
      }
      const dx = target.x - p.x;
      const dz = target.z - p.z;
      const d = Math.hypot(dx, dz);
      const step = p.speed * dt;
      const hitDist = 0.25 + target.radius;
      if (d <= hitDist || d <= step) {
        this._applyHit(target, p.x, p.z, p.damage, p.splash);
        p.alive = false;
      } else {
        p.x += (dx / d) * step;
        p.z += (dz / d) * step;
      }
    }
  }

  _checkWaveProgress() {
    if (this.phase !== "active") return;
    const allSpawned = this.spawnCursor >= this.schedule.length;
    const noneLive = this.enemyPool.liveCount === 0;
    if (allSpawned && noneLive) {
      this.marrow += this.waves[this.waveIndex].reward;
      this.events.push({ kind: "waveCleared", wave: this.waveIndex + 1, reward: this.waves[this.waveIndex].reward });
      this.waveIndex++;
      if (this.waveIndex >= this.waves.length) {
        this.phase = "won";
        this.status = "won";
      } else {
        this.phase = "prep";
        this.prepTimer = this.waves[this.waveIndex].prepTime;
      }
    }
  }

  _checkEndStates() {
    if (this.core.hp <= 0 && this.status === "playing") {
      this.core.hp = 0;
      this.status = "lost";
      this.phase = "lost";
    }
  }
}
