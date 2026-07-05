// OSSARA — pure game simulation (design doc §9 step 1).
// No DOM, no Three.js, no randomness: deterministic given the dt sequence, which
// makes it unit-testable headlessly in Node. The view layer reads this state and
// draws; input is fed in as a plain object. Keep it that way (§14: art/code split).

import { ENEMIES } from "../config/enemies.js";
import { TOWERS } from "../config/towers.js";
import { WAVES } from "../config/waves.js";
import { HERO } from "../config/hero.js";
import { CLASS_KITS } from "../config/kits.js";
import { buildLanePath, buildLanePaths, pointAtDistance, gridToWorld, worldToGrid, cellKey } from "./pathing.js";
import {
  advanceEnemyAlongLane,
  applyEnemySeparation,
  chooseBlockadeAttackSlot,
  computeLanePosition,
  computeSpawnSpreadOffset,
  isEnemyInBlockerAttackContact,
  isEnemyInBlockerContact,
  moveToward,
  releaseAttackSlot,
} from "./enemyMovement.js";
import { isBomberEnemy, pointInExplosion, selectBomberTarget, startBomberFuse, tickBomberFuse } from "./enemyBomber.js";
import { applyCasterHealPulse, isCasterEnemy, selectCasterAttackTarget } from "./enemyCaster.js";
import { isRangedEnemy, selectEnemyRangedTarget } from "./enemyCombat.js";
import { Pool } from "./pool.js";
import { createEnemy, resetEnemy } from "./Enemy.js";
import { createProjectile, resetProjectile } from "./Projectile.js";
import { createTower } from "./Tower.js";
import { createHero } from "./Hero.js";
import {
  COMMAND_MAX_LEVEL,
  refreshDefenseEconomy,
  repairDefense,
  runCommandAction,
  sellDefense,
  upgradeDefense,
} from "./commandActions.js";
import {
  buildableAt as placementBuildableAt,
  createPlacementSets,
  placementStatus as checkPlacementStatus,
} from "./placementRules.js";
import {
  applyBlockadeContactDamage,
  applyDefenseHit,
  bestTurretTarget,
  damageDefense,
  findBlockingDefense,
  updateAuraDefense,
  updateTrapDefense,
} from "./defenseBehavior.js";
import {
  applyHeroEnemyContactDamage,
  heroAttack,
  heroDashSpeedMultiplier,
  isHeroDashing,
  selectHeroAttackTarget,
  tickHeroActionCooldowns,
  tickHeroDashTimers,
  tryStartHeroDash,
  tryUseHeroAbility,
  useHeroAbility,
} from "./heroCombat.js";
import {
  advancePrepTimer,
  advanceWaveSpawns,
  buildWaveSchedule,
  completeWave,
  isWaveCleared,
  shouldStartWave,
} from "./waveSpawner.js";

const UPGRADE_MAX_LEVEL = COMMAND_MAX_LEVEL;
export class World {
  constructor(level, waves = WAVES, opts = {}) {
    this.level = level;
    this.waves = waves;
    this.heroDef = opts.hero || CLASS_KITS.warden.hero;
    this.availableTowers = opts.towers || Object.keys(TOWERS);
    this.bonuses = opts.bonuses || {};
    this.equipmentStats = opts.equipmentStats || {};
    this.lanePaths = buildLanePaths(level);
    this.laneIds = Object.keys(this.lanePaths);
    this.defaultLaneId = this.laneIds[0] || "legacy";
    this.lane = this.lanePaths[this.defaultLaneId] || buildLanePath(level);
    this.occupied = new Set(); // cell keys with a tower on them

    this.enemyPool = new Pool(createEnemy, resetEnemy);
    this.projPool = new Pool(createProjectile, resetProjectile);
    this.towers = [];
    const heroDef = level.heroSpawn ? { ...this.heroDef, spawn: level.heroSpawn } : this.heroDef;
    this.hero = createHero(heroDef, level);
    const heroSpawnGrid = worldToGrid(this.hero._spawn.x, this.hero._spawn.z, level);
    const placementSets = createPlacementSets(level, heroSpawnGrid);
    this.pathSet = placementSets.pathSet;
    this.buildableSet = placementSets.buildableSet;
    this.blockedSet = placementSets.blockedSet;
    this.reservedSet = placementSets.reservedSet;
    // Walkable elevation (opt-in): the hero may DROP off any ledge but can only climb
    // where the rise is small or via stair terrain — one-way verticality.
    this._oneWayLedges = !!(opts.walkableElevation && level && typeof level.surfaceHeightAt === "function");
    this._climbMax = 0.5;
    const _B = this.bonuses;
    this.hero.ability = { ...this.hero.ability };
    this.hero.attackDamage *= 1 + (_B.heroDamagePct || 0) / 100;
    this.hero.ability.damage *= 1 + (_B.heroDamagePct || 0) / 100;
    this.hero.maxHp = Math.round(this.hero.maxHp * (1 + (_B.heroHpPct || 0) / 100));
    this._applyEquipmentHeroStats();
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
    this.holdStartActive = false; // round 1 build phase waits for a deliberate E-hold
    this.holdStartProgress = 0;
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
    return checkPlacementStatus(this._placementRuleState(), typeId, col, row, opts);
  }

  buildableAt(col, row) {
    return placementBuildableAt(this._placementRuleState(), col, row);
  }

  _placementRuleState() {
    return {
      level: this.level,
      towerDefs: TOWERS,
      marrow: this.marrow,
      pathSet: this.pathSet,
      reservedSet: this.reservedSet,
      blockedSet: this.blockedSet,
      buildableSet: this.buildableSet,
      occupied: this.occupied,
    };
  }

  _blockedAt(x, z) {
    const g = worldToGrid(x, z, this.level);
    return this.blockedSet.has(cellKey(g.col, g.row));
  }

  // Directional move check: absolute walls always block; with one-way ledges a move that
  // RISES more than _climbMax is blocked unless it enters or leaves stair terrain.
  _moveBlocked(fx, fz, tx, tz) {
    const to = worldToGrid(tx, tz, this.level);
    if (this.blockedSet.has(cellKey(to.col, to.row))) return true;
    if (!this._oneWayLedges) return false;
    const from = worldToGrid(fx, fz, this.level);
    if (from.col === to.col && from.row === to.row) return false;
    const rise = this.level.surfaceHeightAt(to.col, to.row) - this.level.surfaceHeightAt(from.col, from.row);
    if (rise <= this._climbMax) return false;
    const stair = this.level.stairTerrain ?? 7;
    const kind = this.level.terrainKindAt;
    if (typeof kind === "function" && (kind(to.col, to.row) === stair || kind(from.col, from.row) === stair)) return false;
    return true;
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
    this._applyEquipmentDefenseStats(tower);
    this._captureDefenseBaseStats(tower);
    this._refreshDefenseEconomy(tower);
    this.towers.push(tower);
    this.occupied.add(cellKey(col, row));
    this.events.push({ kind: "place", x: w.x, z: w.z });
    return { ok: true, tower };
  }

  _equipmentStat(key) {
    return Number(this.equipmentStats?.[key] || 0);
  }

  _applyEquipmentHeroStats() {
    const heroDamage = this._equipmentStat("heroDamage");
    const heroHealth = this._equipmentStat("heroHealth");
    const abilityPower = this._equipmentStat("abilityPower");
    if (heroDamage) this.hero.attackDamage = Math.max(0, this.hero.attackDamage + heroDamage);
    if (abilityPower && this.hero.ability) this.hero.ability.damage = Math.max(0, this.hero.ability.damage + abilityPower);
    if (heroHealth) this.hero.maxHp = Math.max(1, Math.round(this.hero.maxHp + heroHealth));
  }

  _applyEquipmentDefenseStats(tower) {
    const defenseHealth = this._equipmentStat("defenseHealth");
    const defenseDamage = this._equipmentStat("defenseDamage");
    if (defenseHealth && tower.maxHp > 0) {
      const hpBonus = Math.round(defenseHealth);
      tower.maxHp = Math.max(1, tower.maxHp + hpBonus);
      tower.hp = Math.max(1, tower.hp + hpBonus);
    }
    if (defenseDamage) {
      if (tower.damage > 0) tower.damage = Math.max(0, tower.damage + defenseDamage);
      if (tower.contactDamage > 0) tower.contactDamage = Math.max(0, tower.contactDamage + defenseDamage);
    }
  }

  towerAtCell(col, row) {
    return this.towers.find((t) => t.alive && t.col === col && t.row === row) || null;
  }

  towerById(id) {
    return this.towers.find((t) => t.id === id) || null;
  }

  upgradeTower(towerId) {
    const t = this.towerById(towerId);
    return upgradeDefense(this, t, this._commandActionHooks());
  }

  repairTower(towerId) {
    const t = this.towerById(towerId);
    return repairDefense(this, t, this._commandActionHooks());
  }

  sellTower(towerId) {
    const t = this.towerById(towerId);
    return sellDefense(this, t, this._commandActionHooks());
  }

  runTowerCommand(action, towerId) {
    return runCommandAction(this, action, this.towerById(towerId), this._commandActionHooks());
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
    refreshDefenseEconomy(t);
  }

  _commandActionHooks() {
    return {
      applyLevelStats: (tower) => this._applyDefenseLevelStats(tower),
      refreshEconomy: (tower) => this._refreshDefenseEconomy(tower),
      disableDefense: (tower, reason) => this._disableDefense(tower, reason),
      pushEvent: (event) => this.events.push(event),
    };
  }

  // ---- wave control ---------------------------------------------------------

  startWave() {
    if (this.phase !== "prep") return false;
    const wave = this.waves[this.waveIndex];
    this.schedule = buildWaveSchedule(wave, this.defaultLaneId);
    this.spawnCursor = 0;
    this.waveElapsed = 0;
    this.phase = "active";
    return true;
  }

  _spawnEnemy(typeId, laneId = this.defaultLaneId, opts = {}) {
    const def = ENEMIES[typeId];
    const path = this.lanePaths[laneId] || this.lane;
    const id = this._nextId++;
    const lane = path.lane || {};
    const width = lane.spawnWidth ?? this.level.spawnWidth ?? 1.8;
    const offset = computeSpawnSpreadOffset(id, width);
    const fade = lane.spawnSpreadFade ?? this.level.spawnSpreadFade ?? 14;
    const start = computeLanePosition(path, 0, offset, { fadeNearCore: fade, corridorWidth: lane.corridorWidth ?? this.level.corridorWidth });
    this.enemyPool.acquire(def, id, start, path.id || laneId || this.defaultLaneId, {
      laneOffset: offset,
      laneOffsetFade: fade,
      elite: !!opts.elite,
      eliteId: opts.eliteId || "",
      eliteName: opts.eliteName || "",
      eliteHpMultiplier: opts.eliteHpMultiplier,
      eliteScale: opts.eliteScale,
    });
  }

  // ---- main tick ------------------------------------------------------------

  update(dt, input = {}) {
    if (this.status !== "playing") return;
    this.events.length = 0;

    if (this.phase === "prep") {
      const holdGate = (this.waveIndex || 0) === 0; // round 1 must be hold-started (deliberate begin)
      this.holdStartActive = holdGate;
      this.holdStartProgress = holdGate ? Math.max(0, Math.min(1, input.holdProgress || 0)) : 0;
      if (!holdGate) this.prepTimer = advancePrepTimer(this.prepTimer, dt); // round 1 timer pauses until you hold E
      if (shouldStartWave(this.phase, this.prepTimer, input.startWave, { holdGate, holdReady: input.holdStart })) this.startWave();
    } else if (this.holdStartActive) {
      this.holdStartActive = false;
      this.holdStartProgress = 0;
    }

    if (this.phase === "active") {
      const next = advanceWaveSpawns(this.schedule, this.spawnCursor, this.waveElapsed, dt);
      this.waveElapsed = next.waveElapsed;
      this.spawnCursor = next.spawnCursor;
      for (const spawn of next.spawns) {
        this._spawnEnemy(spawn.type, spawn.laneId, spawn);
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
      e.casterHealCd = Math.max(0, (e.casterHealCd || 0) - dt);
      e.attackingBlocker = false;
      e.rangedAttacking = false;
      e.rangedTargetId = 0;
      e.rangedTargetKind = "";
      e.casterCasting = false;
      if (e.bomberFusing) {
        releaseAttackSlot(e);
        e.blockingTargetId = e.bomberTargetKind === "tower" ? e.bomberTargetId : 0;
        const fuse = tickBomberFuse(e, dt);
        if (fuse.ready) this._explodeBomber(e);
        continue;
      }
      const bomberTarget = this._selectBomberTarget(e);
      if (bomberTarget) {
        releaseAttackSlot(e);
        e.blockingTargetId = bomberTarget.kind === "tower" ? bomberTarget.id : 0;
        if (startBomberFuse(e, bomberTarget)) {
          this.events.push({
            kind: "bomberFuseStart",
            x: e.x,
            z: e.z,
            range: e.explosionRadius || 1.8,
            fuseTime: e.bomberFuseTimer,
            enemyId: e.id,
            type: e.type,
            targetKind: bomberTarget.kind,
            targetId: bomberTarget.id || 0,
          });
        }
        continue;
      }
      if (isCasterEnemy(e)) {
        const pulse = applyCasterHealPulse(e, this.enemies);
        if (pulse) {
          releaseAttackSlot(e);
          e.blockingTargetId = 0;
          e.casterCasting = true;
          this.events.push({
            kind: "casterHealPulse",
            x: pulse.x,
            z: pulse.z,
            range: pulse.range,
            amount: pulse.amount,
            enemyId: e.id,
            type: e.type,
            healed: pulse.healed,
          });
          continue;
        }
        const casterTarget = this._selectCasterAttackTarget(e);
        if (casterTarget) {
          releaseAttackSlot(e);
          e.blockingTargetId = casterTarget.kind === "tower" ? casterTarget.id : 0;
          e.rangedAttacking = true;
          e.casterCasting = true;
          e.rangedTargetId = casterTarget.id || 0;
          e.rangedTargetKind = casterTarget.kind;
          if (e.attackCd <= 0) {
            this._fireEnemyProjectile(e, casterTarget);
            e.attackCd = 1 / Math.max(0.01, e.attackRate || 1);
          }
          continue;
        }
      }
      const rangedTarget = this._selectEnemyRangedTarget(e);
      if (rangedTarget) {
        releaseAttackSlot(e);
        e.blockingTargetId = rangedTarget.kind === "tower" ? rangedTarget.id : 0;
        e.rangedAttacking = true;
        e.rangedTargetId = rangedTarget.id || 0;
        e.rangedTargetKind = rangedTarget.kind;
        if (e.attackCd <= 0) {
          this._fireEnemyProjectile(e, rangedTarget);
          e.attackCd = 1 / Math.max(0.01, e.attackRate || 1);
        }
        continue;
      }
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
      e.blockingTargetId = 0;
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
    return findBlockingDefense(e, this.towers, this.lanePaths[e.laneId] || this.lane);
  }

  _selectEnemyRangedTarget(e) {
    if (!isRangedEnemy(e)) return null;
    return selectEnemyRangedTarget(e, this.towers, this.core, this.lanePaths[e.laneId] || this.lane);
  }

  _selectBomberTarget(e) {
    if (!isBomberEnemy(e)) return null;
    return selectBomberTarget(e, this.towers, this.core, this.lanePaths[e.laneId] || this.lane);
  }

  _selectCasterAttackTarget(e) {
    if (!isCasterEnemy(e)) return null;
    return selectCasterAttackTarget(e, this.towers, this.core, this.lanePaths[e.laneId] || this.lane);
  }

  _explodeBomber(e) {
    if (!isBomberEnemy(e) || !e.alive || e.bomberExploded) return false;
    const radius = Math.max(0, e.explosionRadius || 0);
    const damage = Math.max(0, e.explosionDamage || e.attackDamage || 0);
    e.bomberExploded = true;
    e.bomberFusing = false;
    let towersHit = 0;
    for (const tower of this.towers) {
      if (!tower.alive || !tower.targetableByEnemies || tower.hp <= 0) continue;
      if (!pointInExplosion(tower, e.x, e.z, radius)) continue;
      if (this._damageTower(tower, damage, e)) towersHit++;
    }
    let coreHit = false;
    let coreAmount = 0;
    if (this.core.hp > 0 && pointInExplosion({ ...this.core, radius: this.core.radius || 0.75 }, e.x, e.z, radius)) {
      coreAmount = Math.max(1, e.coreExplosionDamage ?? Math.max(e.leak || 1, Math.round(damage / 12)));
      this.core.hp = Math.max(0, this.core.hp - coreAmount);
      coreHit = true;
    }
    e.counted = true;
    e.alive = false;
    releaseAttackSlot(e);
    this.events.push({
      kind: "bomberExplosion",
      x: e.x,
      z: e.z,
      range: radius,
      amount: damage,
      coreAmount,
      enemyId: e.id,
      type: e.type,
      towersHit,
      coreHit,
    });
    return true;
  }

  _fireEnemyProjectile(e, target) {
    if (!target) return null;
    const projectileDef = {
      projSpeed: e.projectileSpeed || 8,
      damage: e.attackDamage || 1,
      splash: 0,
      color: e.projectileColor || e.color || "bone",
      shape: e.projectileShape || "bolt",
    };
    const projectile = this.projPool.acquire(this._nextId++, { x: e.x, z: e.z }, target.id || 0, projectileDef, {
      targetKind: target.kind,
      targetX: target.x,
      targetZ: target.z,
      targetRadius: target.radius || 0.45,
      sourceKind: "enemy",
      sourceId: e.id,
      shape: e.projectileShape || "bolt",
    });
    this.events.push({ kind: "enemyShoot", x1: e.x, z1: e.z, x2: target.x, z2: target.z, targetKind: target.kind, targetId: target.id || 0, enemyId: e.id, type: e.type });
    return projectile;
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
    return applyBlockadeContactDamage(t, e, dt, this._defenseBehaviorHooks());
  }

  _damageTower(t, dmg, source = null) {
    return damageDefense(t, dmg, source, this._defenseBehaviorHooks());
  }

  _killEnemy(e) {
    if (!e.alive || e.counted) return;
    e.counted = true;
    e.alive = false;
    this.marrow += Math.round(e.bounty * (1 + (this.bonuses.marrowPct || 0) / 100));
    this.stats.kills++;
    this.events.push({ kind: "kill", x: e.x, z: e.z, bounty: e.bounty, boss: e.boss, elite: !!e.elite, eliteId: e.eliteId || "", enemyId: e.id, type: e.type });
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
    return bestTurretTarget(t, this.enemies, (enemy) => this.lanePaths[enemy.laneId] || this.lane);
  }

  _updateTraps(dt) {
    for (const t of this.towers) {
      updateTrapDefense(t, this.enemies, dt, this._defenseBehaviorHooks());
    }
  }

  _updateAuras(dt) {
    for (const t of this.towers) {
      updateAuraDefense(t, this.enemies, dt, this._defenseBehaviorHooks());
    }
  }

  _defenseBehaviorHooks() {
    return {
      damageEnemy: (enemy, amount) => this._damageEnemy(enemy, amount),
      disableDefense: (tower, reason) => this._disableDefense(tower, reason),
      pushEvent: (event) => this.events.push(event),
    };
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
    return selectHeroAttackTarget(h, this.enemies, aimX, aimZ);
  }

  _heroAttack(h, input) {
    return heroAttack(h, input, this.enemies, this._heroCombatHooks());
  }

  _enemyById(id) {
    for (const e of this.enemies) if (e.id === id && e.alive) return e;
    return null;
  }

  _projectileTarget(p) {
    if (p.targetKind === "tower") {
      const tower = this.towerById(p.targetId);
      return tower?.alive ? { kind: "tower", obj: tower, x: tower.x, z: tower.z, radius: tower.blockRadius || 0.45 } : null;
    }
    if (p.targetKind === "core") {
      return this.core.hp > 0 ? { kind: "core", obj: this.core, x: this.core.x, z: this.core.z, radius: p.targetRadius || 0.75 } : null;
    }
    const enemy = this._enemyById(p.targetId);
    return enemy ? { kind: "enemy", obj: enemy, x: enemy.x, z: enemy.z, radius: enemy.radius || 0.3 } : null;
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

    tickHeroDashTimers(h, dt);

    // Movement (WASD-derived direction, normalized).
    let mx = input.moveX || 0;
    let mz = input.moveZ || 0;
    const m = Math.hypot(mx, mz);
    tryStartHeroDash(h, mx, mz, input.dash, this._heroCombatHooks());
    const dashing = isHeroDashing(h);
    if (dashing) {
      mx = h.dashX;
      mz = h.dashZ;
    }
    const speedMul = heroDashSpeedMultiplier(h);
    if (dashing || m > 0) {
      const moveLen = Math.hypot(mx, mz);
      if (moveLen > 0) {
        mx /= moveLen;
        mz /= moveLen;
      }
      const step = h.speed * speedMul * dt;
      // per-axis move with obstacle collision (slides along ruins)
      const nx = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, h.x + mx * step));
      if (!this._moveBlocked(h.x, h.z, nx, h.z)) h.x = nx;
      const nz = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, h.z + mz * step));
      if (!this._moveBlocked(h.x, h.z, h.x, nz)) h.z = nz;
      h.facing = Math.atan2(mx, mz);
    }

    // Manual hero attack. The click command comes from input; no click means no swing.
    tickHeroActionCooldowns(h, dt);
    if (input.attack) this._heroAttack(h, input);

    // Signature ability (Q) — behaviour depends on the class kit.
    tryUseHeroAbility(h, input.slam, this.enemies, this._heroCombatHooks());

    // Contact damage: enemies hurt the hero only if he body-blocks them.
    applyHeroEnemyContactDamage(h, this.enemies, dt);
    if (h.hp <= 0) {
      h.alive = false;
      h.hp = 0;
      h.respawnTimer = 4;
      this.events.push({ kind: "heroDown", x: h.x, z: h.z });
    }
  }

  _useAbility(h) {
    useHeroAbility(h, this.enemies, this._heroCombatHooks());
  }

  _heroCombatHooks() {
    return {
      damageEnemy: (enemy, amount) => this._damageEnemy(enemy, amount),
      pushEvent: (event) => this.events.push(event),
    };
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
    applyDefenseHit(target, ix, iz, dmg, splash, this.enemies, this._defenseBehaviorHooks());
  }

  _updateProjectiles(dt) {
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      const target = this._projectileTarget(p);
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
        if (target.kind === "enemy") {
          this._applyHit(target.obj, p.x, p.z, p.damage, p.splash);
        } else if (target.kind === "tower") {
          this._damageTower(target.obj, p.damage, { id: p.sourceId || 0 });
          this.events.push({ kind: "enemyProjectileImpact", x: target.x, z: target.z, targetKind: "tower", targetId: target.obj.id, sourceId: p.sourceId || 0, amount: p.damage });
        } else if (target.kind === "core") {
          this.core.hp = Math.max(0, this.core.hp - p.damage);
          this.events.push({ kind: "enemyProjectileImpact", x: target.x, z: target.z, targetKind: "core", sourceId: p.sourceId || 0, amount: p.damage });
        }
        p.alive = false;
      } else {
        p.vx = dx / d;
        p.vz = dz / d;
        p.x += p.vx * step;
        p.z += p.vz * step;
      }
    }
  }

  _checkWaveProgress() {
    if (!isWaveCleared(this.phase, this.spawnCursor, this.schedule, this.enemyPool.liveCount)) return;
    if (this.core.hp <= 0) return;
    const next = completeWave(this.waves, this.waveIndex);
    this.marrow += next.reward;
    this.events.push({ kind: "waveCleared", wave: next.clearedWaveNumber, reward: next.reward });
    this.waveIndex = next.waveIndex;
    this.phase = next.phase;
    this.status = next.status;
    this.prepTimer = next.prepTimer;
  }

  _checkEndStates() {
    if (this.core.hp <= 0 && this.status === "playing") {
      this.core.hp = 0;
      this.status = "lost";
      this.phase = "lost";
    }
  }
}
