// OSSARA — pure game simulation (design doc §9 step 1).
// No DOM, no Three.js, no randomness: deterministic given the dt sequence, which
// makes it unit-testable headlessly in Node. The view layer reads this state and
// draws; input is fed in as a plain object. Keep it that way (§14: art/code split).

import { ENEMIES } from "../config/enemies.js";
import { TOWERS } from "../config/towers.js";
import { WAVES } from "../config/waves.js";
import { HERO } from "../config/hero.js";
import { CLASS_KITS } from "../config/kits.js";
import { MISSION_DASH } from "../config/moves.js";
import { buildLanePath, buildLanePaths, pointAtDistance, pathCellSet, gridToWorld, worldToGrid, cellKey, expandRects, getLevelLanes } from "./pathing.js";
import {
  advanceEnemyAlongLane,
  applyEnemySeparation,
  chooseBlockadeAttackSlot,
  computeLanePosition,
  computeSpawnSpreadOffset,
  isBlockerNearLane,
  isEnemyInBlockerAttackContact,
  isEnemyInBlockerContact,
  isEnemyInBlockerPhysicalContact,
  isEnemyNearBlocker,
  moveToward,
  releaseAttackSlot,
} from "./enemyMovement.js";
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

const UPGRADE_MAX_LEVEL = 3;
const UPGRADE_COST = (baseCost, level) => Math.ceil(baseCost * (0.75 + (level - 1) * 0.5));
const SELL_REFUND = (baseCost) => Math.floor(baseCost * 0.5);
const REPAIR_COST = (baseCost, hp, maxHp) => {
  if (!maxHp || hp >= maxHp) return 0;
  return Math.max(1, Math.ceil(baseCost * 0.35 * ((maxHp - hp) / maxHp)));
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
    this.buildableSet = null;
    if (!level.openBuildable && Array.isArray(level.buildableZones) && level.buildableZones.length) {
      this.buildableSet = new Set(expandRects(level.buildableZones).map((cell) => cellKey(cell.col, cell.row)));
    }

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
    const def = typeId ? TOWERS[typeId] : null;
    if (typeId && !def) return { ok: false, reason: "unknown" };
    if (col < 0 || row < 0 || col >= this.level.cols || row >= this.level.rows) return { ok: false, reason: "bounds" };
    if (this.reservedSet.has(k)) return { ok: false, reason: "reserved" };
    if (this.pathSet.has(k) && !(def && (def.blocksEnemies || def.defenseType === "trap" || def.defenseType === "aura"))) return { ok: false, reason: "path" };
    if (this.blockedSet.has(k)) return { ok: false, reason: "blocked" };
    if (this.buildableSet && !this.buildableSet.has(k)) return { ok: false, reason: "buildable" };
    if (this.occupied.has(k)) return { ok: false, reason: "occupied" };
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
    tower.attackRate *= 1 + (this.bonuses.fireRatePct || 0) / 100;
    this._captureDefenseBaseStats(tower);
    this._refreshDefenseEconomy(tower);
    this.towers.push(tower);
    this.occupied.add(cellKey(col, row));
    this.events.push({ kind: "place", x: w.x, z: w.z });
    return { ok: true, tower };
  }

  towerAtCell(col, row) {
    return this.towers.find((t) => t.alive && t.col === col && t.row === row) || null;
  }

  towerById(id) {
    return this.towers.find((t) => t.id === id) || null;
  }

  upgradeTower(towerId) {
    const t = this.towerById(towerId);
    if (!t) return { ok: false, reason: "missing" };
    if (!t.alive) return { ok: false, reason: "dead", tower: t };
    if (t.level >= (t.maxLevel || UPGRADE_MAX_LEVEL)) return { ok: false, reason: "max", tower: t };
    this._refreshDefenseEconomy(t);
    if (this.marrow < t.upgradeCost) return { ok: false, reason: "marrow", tower: t, cost: t.upgradeCost };
    const cost = t.upgradeCost;
    this.marrow -= cost;
    t.level++;
    this._applyDefenseLevelStats(t);
    this._refreshDefenseEconomy(t);
    this.events.push({ kind: "towerUpgraded", id: t.id, x: t.x, z: t.z, level: t.level });
    return { ok: true, action: "upgrade", tower: t, cost };
  }

  repairTower(towerId) {
    const t = this.towerById(towerId);
    if (!t) return { ok: false, reason: "missing" };
    if (!t.alive) return { ok: false, reason: "dead", tower: t };
    if (!t.physical || t.maxHp <= 0) return { ok: false, reason: "unsupported", tower: t };
    this._refreshDefenseEconomy(t);
    if (t.hp >= t.maxHp) return { ok: false, reason: "full", tower: t };
    if (this.marrow < t.repairCost) return { ok: false, reason: "marrow", tower: t, cost: t.repairCost };
    const cost = t.repairCost;
    this.marrow -= cost;
    t.hp = t.maxHp;
    this._refreshDefenseEconomy(t);
    this.events.push({ kind: "towerRepaired", id: t.id, x: t.x, z: t.z });
    return { ok: true, action: "repair", tower: t, cost };
  }

  sellTower(towerId) {
    const t = this.towerById(towerId);
    if (!t) return { ok: false, reason: "missing" };
    if (!t.alive) return { ok: false, reason: "dead", tower: t };
    this._refreshDefenseEconomy(t);
    const refund = t.sellRefund;
    this.marrow += refund;
    this._disableDefense(t, "towerSold");
    return { ok: true, action: "sell", tower: t, refund };
  }

  _captureDefenseBaseStats(t) {
    t.maxLevel = UPGRADE_MAX_LEVEL;
    t.baseMaxHp = t.maxHp || 0;
    t.baseDamage = t.damage || 0;
    t.baseRange = t.range || 0;
    t.baseContactDamage = t.contactDamage || 0;
    t.baseAttackRate = t.attackRate || t.fireRate || 1;
    t.baseFireRate = t.fireRate || t.attackRate || 1;
    t.baseTriggerRadius = t.triggerRadius ?? null;
    t.baseCharges = t.maxCharges ?? t.charges ?? null;
    t.baseDuration = t.duration ?? null;
  }

  _applyDefenseLevelStats(t) {
    const tier = Math.max(0, (t.level || 1) - 1);
    const hpBefore = t.hp || 0;
    const maxBefore = t.maxHp || 0;
    if (t.defenseType === "blockade") {
      t.maxHp = Math.round(t.baseMaxHp * (1 + tier * 0.35));
      t.hp = Math.min(t.maxHp, hpBefore + Math.max(0, t.maxHp - maxBefore));
      t.contactDamage = t.baseContactDamage * (1 + tier * 0.2);
    } else if (t.defenseType === "turret") {
      t.damage = t.baseDamage * (1 + tier * 0.25);
      t.range = t.baseRange * (1 + tier * 0.1);
      t.attackRate = t.baseAttackRate * (1 + tier * 0.1);
      t.fireRate = t.baseFireRate * (1 + tier * 0.1);
      t.maxHp = Math.round(t.baseMaxHp * (1 + tier * 0.15));
      t.hp = Math.min(t.maxHp, hpBefore + Math.max(0, t.maxHp - maxBefore));
    } else if (t.defenseType === "trap") {
      const oldMaxCharges = t.maxCharges || 0;
      t.damage = t.baseDamage * (1 + tier * 0.25);
      t.triggerRadius = t.baseTriggerRadius == null ? t.triggerRadius : t.baseTriggerRadius * (1 + tier * 0.1);
      if (t.baseCharges != null) {
        t.maxCharges = t.baseCharges + tier;
        t.charges = Math.max(0, (t.charges || 0) + Math.max(0, t.maxCharges - oldMaxCharges));
      }
    } else if (t.defenseType === "aura") {
      const oldDuration = t.duration || 0;
      t.damage = t.baseDamage * (1 + tier * 0.25);
      t.range = t.baseRange * (1 + tier * 0.1);
      if (t.baseDuration != null) {
        t.duration = t.baseDuration * (1 + tier * 0.15);
        t.remainingDuration = Math.max(0, (t.remainingDuration ?? t.duration) + Math.max(0, t.duration - oldDuration));
      }
    }
  }

  _refreshDefenseEconomy(t) {
    t.upgradeCost = t.level >= (t.maxLevel || UPGRADE_MAX_LEVEL) ? 0 : UPGRADE_COST(t.baseCost || 0, t.level || 1);
    t.repairCost = t.alive && t.physical ? REPAIR_COST(t.baseCost || 0, t.hp || 0, t.maxHp || 0) : 0;
    t.sellRefund = t.alive ? SELL_REFUND(t.baseCost || 0) : 0;
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
    const id = this._nextId++;
    const lane = path.lane || {};
    const width = lane.spawnWidth ?? this.level.spawnWidth ?? 1.8;
    const offset = computeSpawnSpreadOffset(id, width);
    const fade = lane.spawnSpreadFade ?? this.level.spawnSpreadFade ?? 14;
    const start = computeLanePosition(path, 0, offset, { fadeNearCore: fade, corridorWidth: lane.corridorWidth ?? this.level.corridorWidth });
    this.enemyPool.acquire(def, id, start, path.id || laneId || this.defaultLaneId, { laneOffset: offset, laneOffsetFade: fade });
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
    this._updateTraps(dt);
    this._updateAuras(dt);
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
      e.hitFlash = Math.max(0, (e.hitFlash || 0) - dt);
      e.hpBarTimer = Math.max(0, (e.hpBarTimer || 0) - dt);
      e.attackCd -= dt;
      const blocker = this._findBlockingDefense(e);
      if (blocker) {
        e.blockingTargetId = blocker.id;
        const lane = this.lanePaths[e.laneId] || this.lane;
        const slot = chooseBlockadeAttackSlot(e, blocker, this.enemies, lane);
        const atSlot = slot ? moveToward(e, slot, e.speed * dt) : isEnemyInBlockerContact(e, blocker);
        e.attackingBlocker = !!(atSlot && isEnemyInBlockerAttackContact(e, blocker));
        if (e.attackingBlocker) {
          this._applyBlockadeContactDamage(blocker, e, dt);
          if (e.attackCd <= 0) {
            this._damageTower(blocker, e.attackDamage, e);
            e.attackCd = 1 / e.attackRate;
          }
        }
        continue;
      }
      releaseAttackSlot(e);
      const lane = this.lanePaths[e.laneId] || this.lane;
      const p = advanceEnemyAlongLane(e, lane, dt, { corridorWidth: lane.lane?.corridorWidth ?? this.level.corridorWidth });
      if (p.done && !e.counted) {
        e.counted = true;
        e.alive = false;
        e.reachedCore = true;
        this.core.hp -= e.leak;
        this.stats.leaked++;
        this.events.push({ kind: "leak", x: this.core.x, z: this.core.z, amount: e.leak });
      }
    }
    this._applyEnemySeparation(dt);
  }

  _findBlockingDefense(e) {
    let best = null;
    let bestD = Infinity;
    const lane = this.lanePaths[e.laneId] || this.lane;
    for (const t of this.towers) {
      if (!t.alive || t.defenseType !== "blockade" || !t.blocksEnemies || !t.targetableByEnemies || t.hp <= 0) continue;
      if (!isBlockerNearLane(e, t, lane)) continue;
      if (!isEnemyNearBlocker(e, t)) continue;
      const d = dist2(e.x, e.z, t.x, t.z);
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    return best;
  }

  _enemyInBlockerContact(e, t) {
    return isEnemyInBlockerContact(e, t);
  }

  _enemyInBlockerAttackContact(e, t) {
    return isEnemyInBlockerAttackContact(e, t);
  }

  _applyEnemySeparation(dt) {
    applyEnemySeparation(this.enemies, (e) => this.lanePaths[e.laneId] || this.lane, { dt, corridorWidth: this.level.corridorWidth ?? 2.6 });
  }

  _applyBlockadeContactDamage(t, e, dt) {
    if (!t.contactDamage || t.contactDamage <= 0 || !e.alive) return;
    if (!isEnemyInBlockerPhysicalContact(e, t)) return;
    t.contactCd = Math.max(0, (t.contactCd || 0) - dt);
    if (t.contactCd > 0) return;
    this._damageEnemy(e, t.contactDamage);
    t.contactCd = 1 / Math.max(0.01, t.contactTickRate || 1);
    this.events.push({ kind: "contactDamage", id: t.id, x: e.x, z: e.z, targetId: e.id, amount: t.contactDamage });
  }

  _damageTower(t, dmg, source = null) {
    if (!t || !t.alive || t.hp <= 0) return;
    t.hp -= dmg;
    this.events.push({ kind: "towerHit", id: t.id, x: t.x, z: t.z, amount: dmg, sourceId: source?.id || 0 });
    if (t.hp <= 0) {
      this._disableDefense(t, "towerDown");
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
    e.lastDamage = dmg;
    e.hitFlash = 0.35;
    e.hpBarTimer = 2.4;
    if (e.hp <= 0) this._killEnemy(e);
  }

  _bestTurretTarget(t) {
    let best = null;
    let bestProgress = -Infinity;
    let bestD = Infinity;
    const r2 = t.range * t.range;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = dist2(t.x, t.z, e.x, e.z);
      if (d > r2) continue;
      const lane = this.lanePaths[e.laneId] || this.lane;
      const progress = lane && lane.total > 0 ? e.dist / lane.total : e.dist;
      if (progress > bestProgress || (progress === bestProgress && d < bestD)) {
        best = e;
        bestProgress = progress;
        bestD = d;
      }
    }
    return best;
  }

  _updateTraps(dt) {
    for (const t of this.towers) {
      if (!t.alive || t.defenseType !== "trap") continue;
      if (t.charges !== null && t.charges <= 0) {
        this._disableDefense(t, "trapExpired");
        continue;
      }
      t.resetCd = Math.max(0, (t.resetCd || 0) - dt);
      if (t.resetCd > 0) continue;

      const radius = t.triggerRadius || t.range || 0;
      if (radius <= 0) continue;
      const r2 = radius * radius;
      let triggered = false;
      for (const e of this.enemies) {
        if (e.alive && dist2(t.x, t.z, e.x, e.z) <= r2) {
          triggered = true;
          break;
        }
      }
      if (!triggered) continue;

      for (const e of this.enemies) {
        if (e.alive && dist2(t.x, t.z, e.x, e.z) <= r2) this._damageEnemy(e, t.damage);
      }
      if (t.charges !== null) t.charges--;
      t.resetCd = t.resetTime || 0;
      this.events.push({ kind: "trapTrigger", id: t.id, x: t.x, z: t.z, range: radius, charges: t.charges });
      if (t.charges !== null && t.charges <= 0) this._disableDefense(t, "trapExpired");
    }
  }

  _updateAuras(dt) {
    for (const t of this.towers) {
      if (!t.alive || t.defenseType !== "aura") continue;

      if (t.remainingDuration !== null) {
        t.remainingDuration -= dt;
        if (t.remainingDuration <= 0) {
          this._disableDefense(t, "auraExpired");
          continue;
        }
      }

      t.tickCd = Math.max(0, (t.tickCd || 0) - dt);
      if (t.tickCd > 0) continue;

      const radius = t.radius || t.range || 0;
      if (radius <= 0) continue;
      const r2 = radius * radius;
      let hit = false;
      for (const e of this.enemies) {
        if (!e.alive || dist2(t.x, t.z, e.x, e.z) > r2) continue;
        this._damageEnemy(e, t.damage);
        hit = true;
      }
      t.tickCd = 1 / Math.max(0.01, t.tickRate || 1);
      if (hit) this.events.push({ kind: "auraTick", id: t.id, x: t.x, z: t.z, range: radius });
    }
  }

  _disableDefense(t, eventKind = "towerDown") {
    if (!t || !t.alive) return;
    t.hp = 0;
    t.alive = false;
    t.targetId = 0;
    for (const e of this.enemies) {
      if (e.blockingTargetId === t.id) releaseAttackSlot(e);
    }
    this.occupied.delete(cellKey(t.col, t.row));
    this._refreshDefenseEconomy(t);
    this.events.push({ kind: eventKind, id: t.id, x: t.x, z: t.z });
  }

  _enemyInHeroAttackArc(h, aimX, aimZ) {
    const hasAim = Number.isFinite(aimX) && Number.isFinite(aimZ);
    let fx = Math.sin(h.facing);
    let fz = Math.cos(h.facing);
    if (hasAim) {
      const ax = aimX - h.x;
      const az = aimZ - h.z;
      const am = Math.hypot(ax, az);
      if (am > 1e-4) {
        fx = ax / am;
        fz = az / am;
        h.facing = Math.atan2(fx, fz);
      }
    }

    let best = null;
    let bestScore = Infinity;
    let fallback = null;
    let fallbackScore = Infinity;
    const reach = h.attackRange + 0.35;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dx = e.x - h.x;
      const dz = e.z - h.z;
      const d = Math.hypot(dx, dz);
      if (d > reach + e.radius || d < 1e-5) continue;
      const dot = (dx / d) * fx + (dz / d) * fz;
      if (dot < 0.08) continue;
      const aimBias = hasAim ? Math.hypot(e.x - aimX, e.z - aimZ) * 0.2 : 0;
      const score = d + aimBias;
      if (dot >= 0.35 && score < bestScore) {
        bestScore = score;
        best = e;
      }
      if (score < fallbackScore) {
        fallbackScore = score;
        fallback = e;
      }
    }
    return best || fallback;
  }

  _heroAttack(h, input) {
    if (h.attackCd > 0) return false;
    const target = this._enemyInHeroAttackArc(h, input.attackX, input.attackZ);
    if (target) {
      this._damageEnemy(target, h.attackDamage);
      this.events.push({ kind: "heroHit", x: target.x, z: target.z, heroX: h.x, heroZ: h.z, facing: h.facing, range: h.attackRange });
    } else {
      this.events.push({ kind: "heroSwing", x: h.x, z: h.z, facing: h.facing, range: h.attackRange });
    }
    h.attackCd = 1 / h.attackRate;
    return true;
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

    h.dashCd = Math.max(0, (h.dashCd || 0) - dt);
    h.dashTimer = Math.max(0, (h.dashTimer || 0) - dt);

    // Movement (WASD-derived direction, normalized).
    let mx = input.moveX || 0;
    let mz = input.moveZ || 0;
    const m = Math.hypot(mx, mz);
    if (input.dash && h.dashCd <= 0) {
      if (m > 0) {
        h.dashX = mx / m;
        h.dashZ = mz / m;
      } else {
        h.dashX = Math.sin(h.facing);
        h.dashZ = Math.cos(h.facing);
      }
      h.dashTimer = MISSION_DASH.dashTime;
      h.dashCd = MISSION_DASH.dashCooldown;
      h.facing = Math.atan2(h.dashX, h.dashZ);
      this.events.push({ kind: "heroDash", x: h.x, z: h.z, range: 1.2 });
    }
    const dashing = h.dashTimer > 0;
    if (dashing) {
      mx = h.dashX;
      mz = h.dashZ;
    }
    const speedMul = dashing ? MISSION_DASH.dashMul : 1;
    if (dashing || m > 0) {
      const moveLen = Math.hypot(mx, mz);
      if (moveLen > 0) {
        mx /= moveLen;
        mz /= moveLen;
      }
      const step = h.speed * speedMul * dt;
      // per-axis move with obstacle collision (slides along ruins)
      const nx = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, h.x + mx * step));
      if (!this._blockedAt(nx, h.z)) h.x = nx;
      const nz = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, h.z + mz * step));
      if (!this._blockedAt(h.x, nz)) h.z = nz;
      h.facing = Math.atan2(mx, mz);
    }

    // Manual hero attack. The click command comes from input; no click means no swing.
    h.attackCd -= dt;
    if (input.attack) this._heroAttack(h, input);

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
      if (!t.alive) continue;
      if (t.defenseType !== "turret") {
        t.targetId = 0;
        continue;
      }
      t.cooldown -= dt;
      const target = this._bestTurretTarget(t);
      t.targetId = target ? target.id : 0;
      if (target) t.facing = Math.atan2(target.x - t.x, target.z - t.z);
      if (target && t.cooldown <= 0) {
        t.cooldown = 1 / Math.max(0.01, t.attackRate || t.fireRate || 1);
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
