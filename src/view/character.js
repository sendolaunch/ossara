// Animated KayKit character loader — ONE place that touches the PlayCanvas anim
// API, so any engine-version tuning happens here (lessons: PlayCanvas API
// mismatch is a known bug-class). Loads a class's model, applies the shared rig
// animations (idle / walk / run / death), attaches a weapon to handslot.r, and
// returns a small control surface for the renderers to drive each frame.
//
// Defensive by design: model fails → returns null (caller keeps its placeholder);
// anim fails → the static model still renders; weapon fails → character still
// renders. Nothing here can hard-crash the scene.

import * as pc from "playcanvas";
import {
  CHARACTERS, CHAR_FALLBACK, CHAR_ANIM_LIBS, CHAR_CLIPS, HANDSLOT_R, HANDSLOT_L,
} from "../config/characters.js";

// Container assets are cached so the shared anim libraries load once per app.
function loadContainer(app, url) {
  app._charCache = app._charCache || new Map();
  if (app._charCache.has(url)) return Promise.resolve(app._charCache.get(url));
  return new Promise((resolve) => {
    try {
      app.assets.loadFromUrl(url, "container", (err, asset) => {
        const out = err || !asset || !asset.resource ? null : asset;
        app._charCache.set(url, out);
        if (!out) console.warn("[character] missing/failed:", url, err || "");
        resolve(out);
      });
    } catch (e) {
      console.warn("[character] loadFromUrl threw:", url, e);
      resolve(null);
    }
  });
}

// Pull every AnimTrack out of a loaded animation container, keyed by clip name.
function collectTracks(asset, into) {
  const anims = asset && asset.resource && asset.resource.animations;
  if (!anims) return;
  for (const a of anims) {
    const track = a && a.resource ? a.resource : a; // asset → AnimTrack
    if (track && track.name) into[track.name] = track;
  }
}

// Switch the base layer to a state, tolerant of API differences across versions.
function goto(layer, state, blend = 0.12) {
  if (!layer) return;
  try {
    if (typeof layer.transition === "function") layer.transition(state, blend);
    else if (typeof layer.play === "function") layer.play(state);
  } catch (_) {
    /* leave whatever is currently playing */
  }
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOut = (v) => 1 - Math.pow(1 - clamp01(v), 3);
const easeInOut = (v) => {
  v = clamp01(v);
  return v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
};
const lerpNum = (a, b, t) => a + (b - a) * t;
const lerpVec = (a, b, t) => ({
  x: lerpNum(a.x || 0, b.x || 0, t),
  y: lerpNum(a.y || 0, b.y || 0, t),
  z: lerpNum(a.z || 0, b.z || 0, t),
});

export const HERO_ATTACK_VARIANTS = [
  {
    id: "diag-right",
    label: "Diagonal slash down-right",
    windup: { pos: { x: -0.16, y: 0.3, z: -0.1 }, rot: { x: 12, y: -46, z: 46 } },
    slash: { pos: { x: 0.24, y: 0.22, z: -0.18 }, rot: { x: 4, y: 44, z: -42 } },
    arm: {
      windup: { upper: { x: -6, y: -10, z: 16 }, lower: { x: -2, y: 0, z: 12 }, hand: { x: 6, y: -8, z: 18 } },
      slash: { upper: { x: -14, y: 14, z: -22 }, lower: { x: -8, y: 0, z: -20 }, hand: { x: 10, y: 12, z: -30 } },
    },
    body: { yaw0: -14, yaw1: 18, roll0: 7, roll1: -9, pitch0: -4, pitch1: 2 },
    proxy: { side0: -0.78, side1: 0.72, y0: 1.32, y1: 1.02, yaw0: -62, yaw1: 52, roll0: 42, roll1: -38, pitch0: 8, pitch1: -8, reach: 0.55 },
  },
  {
    id: "diag-left",
    label: "Diagonal slash down-left",
    windup: { pos: { x: 0.16, y: 0.3, z: -0.1 }, rot: { x: 12, y: 46, z: -46 } },
    slash: { pos: { x: -0.24, y: 0.22, z: -0.18 }, rot: { x: 4, y: -44, z: 42 } },
    arm: {
      windup: { upper: { x: -6, y: 10, z: -16 }, lower: { x: -2, y: 0, z: -12 }, hand: { x: 6, y: 8, z: -18 } },
      slash: { upper: { x: -14, y: -14, z: 22 }, lower: { x: -8, y: 0, z: 20 }, hand: { x: 10, y: -12, z: 30 } },
    },
    body: { yaw0: 14, yaw1: -18, roll0: -7, roll1: 9, pitch0: -4, pitch1: 2 },
    proxy: { side0: 0.78, side1: -0.72, y0: 1.32, y1: 1.02, yaw0: 62, yaw1: -52, roll0: -42, roll1: 38, pitch0: 8, pitch1: -8, reach: 0.55 },
  },
  {
    id: "wide-sweep",
    label: "Wide horizontal sweep",
    windup: { pos: { x: -0.28, y: 0.22, z: -0.14 }, rot: { x: 4, y: -68, z: 16 } },
    slash: { pos: { x: 0.3, y: 0.18, z: -0.16 }, rot: { x: 2, y: 68, z: -14 } },
    arm: {
      windup: { upper: { x: -3, y: -16, z: 8 }, lower: { x: -4, y: 0, z: 8 }, hand: { x: 4, y: -14, z: 12 } },
      slash: { upper: { x: -8, y: 18, z: -10 }, lower: { x: -7, y: 0, z: -10 }, hand: { x: 6, y: 16, z: -16 } },
    },
    body: { yaw0: -18, yaw1: 20, roll0: 4, roll1: -6, pitch0: -3, pitch1: 2 },
    proxy: { side0: -0.96, side1: 0.96, y0: 1.16, y1: 1.08, yaw0: -78, yaw1: 78, roll0: 12, roll1: -12, pitch0: 2, pitch1: -4, reach: 0.62 },
  },
];

export const HERO_ATTACK_VARIANT_IDS = HERO_ATTACK_VARIANTS.map((v) => v.id);

function resolveAttackVariant(idOrIndex = 0) {
  if (typeof idOrIndex === "string") return HERO_ATTACK_VARIANTS.find((v) => v.id === idOrIndex) || HERO_ATTACK_VARIANTS[0];
  return HERO_ATTACK_VARIANTS[((Number(idOrIndex) || 0) % HERO_ATTACK_VARIANTS.length + HERO_ATTACK_VARIANTS.length) % HERO_ATTACK_VARIANTS.length];
}

// Scale `inner` to def.targetHeight and plant its feet at y=0. Returns foot offset.
function autoFit(inner, def) {
  let foot = 0;
  try {
    let aabb = null;
    for (const r of inner.findComponents("render")) {
      for (const mi of r.meshInstances) {
        if (!aabb) aabb = mi.aabb.clone();
        else aabb.add(mi.aabb);
      }
    }
    if (aabb) {
      const h = aabb.halfExtents.y * 2;
      const target = (def.targetHeight || 1.8) * (def.scale || 1);
      const s = h > 0.001 ? target / h : 1;
      inner.setLocalScale(s, s, s);
      foot = -(aabb.center.y - aabb.halfExtents.y) * s;
      inner.setLocalPosition(-aabb.center.x * s, foot, -aabb.center.z * s);
    }
  } catch (e) {
    console.warn("[character] auto-fit skipped", e);
  }
  return foot;
}

function attach(app, inner, url, boneName, onAttach = null) {
  if (!url) return Promise.resolve(null);
  return loadContainer(app, url).then((asset) => {
    if (!asset) return;
    try {
      const piece = asset.resource.instantiateRenderEntity();
      const bone = inner.findByName(boneName);
      (bone || inner).addChild(piece);
      if (onAttach) onAttach(piece);
      return piece;
    } catch (e) {
      console.warn("[character] weapon attach failed", url, e);
      return null;
    }
  });
}

/**
 * Load an animated character for `classId`.
 * @returns {Promise<null | {
 *   wrap: pc.Entity, foot: number,
 *   setMoving(b:boolean): void, setDead(b:boolean): void, playOnce(state:string): void,
 * }>}
 */
export async function loadCharacter(app, classId, { weapon = true } = {}) {
  const def = CHARACTERS[classId] || CHARACTERS[CHAR_FALLBACK];
  if (!def) return null;

  const modelAsset = await loadContainer(app, def.model);
  if (!modelAsset) return null; // caller falls back to its primitive hero

  let inner;
  try {
    inner = modelAsset.resource.instantiateRenderEntity();
  } catch (e) {
    console.warn("[character] instantiate failed", def.model, e);
    return null;
  }

  // fit + plant feet BEFORE attaching the weapon (so it doesn't skew the bounds)
  const foot = autoFit(inner, def);

  // ---- animation (the single risky API surface; fully guarded) --------------
  let layer = null;
  let hasAttack = false;
  const tracks = {};
  try {
    for (const lib of CHAR_ANIM_LIBS) collectTracks(await loadContainer(app, lib), tracks);
    inner.addComponent("anim", { activate: true });
    const assign = (state, clip, loop = true) => {
      const t = tracks[clip];
      if (t) {
        try {
          inner.anim.assignAnimation(state, t, undefined, 1, loop);
          return true;
        } catch (e) {
          console.warn("[character] assign", state, e);
        }
      }
      return false;
    };
    assign("Idle", CHAR_CLIPS.idle, true);
    assign("Walk", CHAR_CLIPS.walk, true);
    assign("Run", CHAR_CLIPS.run, true);
    assign("Death", CHAR_CLIPS.death, false);
    hasAttack = assign("Attack", CHAR_CLIPS.attack, false);   // one-shot, non-looping when a real clip exists
    layer = inner.anim.baseLayer || null;
    goto(layer, "Idle", 0);
  } catch (e) {
    console.warn("[character] anim setup failed (static model)", e);
  }

  // ---- wrap + control surface ----------------------------------------------
  const wrap = new pc.Entity("hero");
  wrap.addChild(inner);
  const rightHand = inner.findByName("hand.r");
  const rightLowerArm = inner.findByName("lowerarm.r");
  const rightUpperArm = inner.findByName("upperarm.r");
  const rightHandSlot = inner.findByName(HANDSLOT_R);
  const leftHandSlot = inner.findByName(HANDSLOT_L);
  const attackPose = {
    active: false,
    raf: 0,
    target: null,
    targetName: "",
    hand: rightHand || null,
    lowerArm: rightLowerArm || null,
    upperArm: rightUpperArm || null,
    handSlot: rightHandSlot || null,
    sword: null,
    boneBases: {},
    beforeWorld: null,
    lastWorld: null,
    lastLocalRot: null,
    variant: HERO_ATTACK_VARIANTS[0],
    phase: "idle",
    basePos: null,
    baseRot: null,
    startedAt: 0,
    duration: 0.35,
  };
  if (import.meta.env?.DEV && !app._charHandSlotLogged) {
    app._charHandSlotLogged = true;
    console.debug("[character] hand/weapon slots", {
      rightHand: rightHand?.name || null,
      rightLowerArm: rightLowerArm?.name || null,
      rightUpperArm: rightUpperArm?.name || null,
      rightHandSlot: rightHandSlot?.name || null,
      leftHandSlot: leftHandSlot?.name || null,
    });
  }

  // ---- weapon(s) ------------------------------------------------------------
  if (weapon) {
    attach(app, inner, def.weapon, HANDSLOT_R, (piece) => {
      attackPose.sword = piece || null;
      if (import.meta.env?.DEV && piece) console.debug("[character] attached main weapon", piece.name || "(unnamed)");
    });
    attach(app, inner, def.offhand, HANDSLOT_L);
  }

  const worldSnapshot = (entity) => {
    if (!entity) return null;
    try {
      const p = entity.getPosition();
      return { x: p.x, y: p.y, z: p.z };
    } catch (_) {
      return null;
    }
  };

  const localRotSnapshot = (entity) => {
    if (!entity) return null;
    try {
      const r = entity.getLocalEulerAngles();
      return { x: r.x, y: r.y, z: r.z };
    } catch (_) {
      return null;
    }
  };

  const captureBoneBase = (key, entity) => {
    if (!entity) return;
    try {
      attackPose.boneBases[key] = {
        pos: entity.getLocalPosition().clone(),
        rot: entity.getLocalEulerAngles().clone(),
      };
    } catch (_) {
      attackPose.boneBases[key] = null;
    }
  };

  const resetBone = (key, entity) => {
    const base = attackPose.boneBases[key];
    if (!entity || !base) return;
    try {
      entity.setLocalPosition(base.pos);
      entity.setLocalEulerAngles(base.rot.x, base.rot.y, base.rot.z);
    } catch (_) {
      /* visual reset best-effort only */
    }
  };

  const applyBoneOffset = (key, entity, offset) => {
    const base = attackPose.boneBases[key];
    if (!entity || !base || !offset) return;
    try {
      entity.setLocalPosition(base.pos);
      entity.setLocalEulerAngles(
        base.rot.x + (offset.x || 0),
        base.rot.y + (offset.y || 0),
        base.rot.z + (offset.z || 0),
      );
    } catch (_) {
      /* procedural arm pose is non-critical */
    }
  };

  const resolveAttackTarget = (preferred = "") => {
    if (preferred === "hand.r") return attackPose.hand;
    if (preferred === HANDSLOT_R) return attackPose.handSlot;
    if (preferred === "sword_1handed") return attackPose.sword || inner.findByName("sword_1handed");
    return attackPose.sword || inner.findByName("sword_1handed") || attackPose.handSlot || attackPose.hand;
  };

  const resetAttackPose = () => {
    if (attackPose.raf && typeof cancelAnimationFrame === "function") cancelAnimationFrame(attackPose.raf);
    clearTimeout(attackPose._extremeTimer);
    attackPose.raf = 0;
    attackPose.active = false;
    attackPose.phase = "idle";
    resetBone("upper", attackPose.upperArm);
    resetBone("lower", attackPose.lowerArm);
    resetBone("hand", attackPose.hand);
    if (attackPose.target && attackPose.basePos && attackPose.baseRot) {
      try {
        attackPose.target.setLocalPosition(attackPose.basePos);
        attackPose.target.setLocalEulerAngles(attackPose.baseRot.x, attackPose.baseRot.y, attackPose.baseRot.z);
        attackPose.lastWorld = worldSnapshot(attackPose.target);
        attackPose.lastLocalRot = localRotSnapshot(attackPose.target);
      } catch (_) {
        /* visual reset best-effort only */
      }
    }
  };

  const applyAttackPose = (t) => {
    if (!attackPose.target || !attackPose.basePos || !attackPose.baseRot) return false;
    const windup = clamp01(t / 0.08);
    const slash = clamp01((t - 0.08) / 0.12);
    const recovery = clamp01((t - 0.2) / 0.15);
    attackPose.phase = t < 0.08 ? "windup" : t < 0.2 ? "slash" : "recovery";
    const variant = attackPose.variant || HERO_ATTACK_VARIANTS[0];
    const arm = variant.arm || HERO_ATTACK_VARIANTS[0].arm;
    const pose = t < 0.08
      ? {
          pos: lerpVec({ x: 0, y: 0, z: 0 }, variant.windup.pos, easeOut(windup)),
          rot: lerpVec({ x: 0, y: 0, z: 0 }, variant.windup.rot, easeOut(windup)),
          arm: {
            upper: lerpVec({ x: 0, y: 0, z: 0 }, arm.windup.upper, easeOut(windup)),
            lower: lerpVec({ x: 0, y: 0, z: 0 }, arm.windup.lower, easeOut(windup)),
            hand: lerpVec({ x: 0, y: 0, z: 0 }, arm.windup.hand, easeOut(windup)),
          },
        }
      : t < 0.2
        ? {
            pos: lerpVec(variant.windup.pos, variant.slash.pos, easeInOut(slash)),
            rot: lerpVec(variant.windup.rot, variant.slash.rot, easeInOut(slash)),
            arm: {
              upper: lerpVec(arm.windup.upper, arm.slash.upper, easeInOut(slash)),
              lower: lerpVec(arm.windup.lower, arm.slash.lower, easeInOut(slash)),
              hand: lerpVec(arm.windup.hand, arm.slash.hand, easeInOut(slash)),
            },
          }
        : {
            pos: lerpVec(variant.slash.pos, { x: 0, y: 0, z: 0 }, easeOut(recovery)),
            rot: lerpVec(variant.slash.rot, { x: 0, y: 0, z: 0 }, easeOut(recovery)),
            arm: {
              upper: lerpVec(arm.slash.upper, { x: 0, y: 0, z: 0 }, easeOut(recovery)),
              lower: lerpVec(arm.slash.lower, { x: 0, y: 0, z: 0 }, easeOut(recovery)),
              hand: lerpVec(arm.slash.hand, { x: 0, y: 0, z: 0 }, easeOut(recovery)),
            },
          };
    applyBoneOffset("upper", attackPose.upperArm, pose.arm.upper);
    applyBoneOffset("lower", attackPose.lowerArm, pose.arm.lower);
    applyBoneOffset("hand", attackPose.hand, pose.arm.hand);
    attackPose.target.setLocalPosition(
      attackPose.basePos.x + pose.pos.x,
      attackPose.basePos.y + pose.pos.y,
      attackPose.basePos.z + pose.pos.z,
    );
    attackPose.target.setLocalEulerAngles(
      attackPose.baseRot.x + pose.rot.x,
      attackPose.baseRot.y + pose.rot.y,
      attackPose.baseRot.z + pose.rot.z,
    );
    attackPose.lastWorld = worldSnapshot(attackPose.target);
    attackPose.lastLocalRot = localRotSnapshot(attackPose.target);
    return true;
  };

  const playProceduralAttack = (opts = {}) => {
    if (attackPose.active) return false;
    try {
      const target = resolveAttackTarget(opts.target || "");
      if (!target) return false;
      attackPose.target = target;
      attackPose.targetName = target.name || opts.target || "(unnamed)";
      attackPose.basePos = target.getLocalPosition().clone();
      attackPose.baseRot = target.getLocalEulerAngles().clone();
      attackPose.boneBases = {};
      captureBoneBase("upper", attackPose.upperArm);
      captureBoneBase("lower", attackPose.lowerArm);
      captureBoneBase("hand", attackPose.hand);
      attackPose.beforeWorld = worldSnapshot(target);
      attackPose.lastWorld = attackPose.beforeWorld;
      attackPose.lastLocalRot = localRotSnapshot(target);
      attackPose.variant = resolveAttackVariant(opts.variant ?? opts.variantId ?? 0);
      attackPose.startedAt = (typeof performance !== "undefined" ? performance.now() : Date.now()) * 0.001;
      attackPose.duration = 0.35;
      attackPose.active = true;
      const step = () => {
        const now = (typeof performance !== "undefined" ? performance.now() : Date.now()) * 0.001;
        const elapsed = now - attackPose.startedAt;
        const t = elapsed * (opts.slow ? 0.35 / 1.2 : 1);
        if (!updateProceduralAttackPose(t)) return;
        if (typeof requestAnimationFrame === "function") attackPose.raf = requestAnimationFrame(step);
      };
      step();
      return true;
    } catch (e) {
      console.warn("[character] procedural attack pose failed", e);
      resetAttackPose();
      return false;
    }
  };

  const updateProceduralAttackPose = (overrideT = null) => {
    if (!attackPose.active) return false;
    const now = (typeof performance !== "undefined" ? performance.now() : Date.now()) * 0.001;
    const t = overrideT == null ? (now - attackPose.startedAt) : overrideT;
    if (t >= attackPose.duration) {
      resetAttackPose();
      return false;
    }
    if (!applyAttackPose(t)) {
      resetAttackPose();
      return false;
    }
    return true;
  };

  const playExtremePose = (targetName = "sword_1handed", duration = 2) => {
    resetAttackPose();
    const target = resolveAttackTarget(targetName);
    if (!target) return false;
    try {
      attackPose.target = target;
      attackPose.targetName = target.name || targetName;
      attackPose.basePos = target.getLocalPosition().clone();
      attackPose.baseRot = target.getLocalEulerAngles().clone();
      attackPose.beforeWorld = worldSnapshot(target);
      attackPose.phase = "extreme";
      target.setLocalPosition(attackPose.basePos.x + 0.45, attackPose.basePos.y + 0.65, attackPose.basePos.z - 0.35);
      target.setLocalEulerAngles(attackPose.baseRot.x + 105, attackPose.baseRot.y + 120, attackPose.baseRot.z - 95);
      attackPose.lastWorld = worldSnapshot(target);
      attackPose.lastLocalRot = localRotSnapshot(target);
      attackPose.active = true;
      clearTimeout(attackPose._extremeTimer);
      attackPose._extremeTimer = setTimeout(resetAttackPose, Math.max(0.1, duration) * 1000);
      return true;
    } catch (e) {
      console.warn("[character] extreme attack pose failed", e);
      resetAttackPose();
      return false;
    }
  };

  const collectAttackDebug = () => {
    const matches = [];
    const walk = (entity) => {
      if (!entity) return;
      const name = entity.name || "";
      if (/hand|handslot|sword|weapon|blade|arm/i.test(name)) {
        matches.push({
          name,
          hasRender: !!entity.render,
          children: entity.children?.length || 0,
          world: worldSnapshot(entity),
        });
      }
      for (const child of entity.children || []) walk(child);
    };
    walk(wrap);
    const now = (typeof performance !== "undefined" ? performance.now() : Date.now()) * 0.001;
    return {
      phase: attackPose.phase,
      time: attackPose.active ? Math.max(0, now - attackPose.startedAt) : 0,
      variantId: attackPose.variant?.id || "",
      variantLabel: attackPose.variant?.label || "",
      currentClip: st.currentClip || "Idle",
      rightHandFound: !!attackPose.hand,
      handSlotFound: !!attackPose.handSlot,
      lowerArmFound: !!attackPose.lowerArm,
      upperArmFound: !!attackPose.upperArm,
      swordFound: !!(attackPose.sword || inner.findByName("sword_1handed")),
      animatedEntity: attackPose.targetName || "",
      beforeWorld: attackPose.beforeWorld,
      afterWorld: attackPose.lastWorld,
      beforeLocalRot: attackPose.baseRot ? { x: attackPose.baseRot.x, y: attackPose.baseRot.y, z: attackPose.baseRot.z } : null,
      afterLocalRot: attackPose.lastLocalRot,
      entities: matches,
    };
  };

  const st = { moving: false, running: false, dead: false, currentClip: "Idle", _atk: null, _one: null, _assigned: new Set() };
  return {
    wrap,
    foot,
    setMoving(b) {
      if (!layer || st.dead || b === st.moving) return;
      st.moving = b;
      st.currentClip = b ? (st.running ? "Run" : "Walk") : "Idle";
      goto(layer, st.currentClip);
    },
    setGait(running) {
      running = !!running;
      if (st.running === running) return;
      st.running = running;
      if (st.moving && layer) {
        st.currentClip = running ? "Run" : "Walk";
        goto(layer, st.currentClip, 0.15);
      }
    },
    playClip(name, loop = false) {
      if (!layer || st.dead) return;
      const t = tracks[name];
      if (!t) return;
      if (!st._assigned.has(name)) {
        try { inner.anim.assignAnimation(name, t, undefined, 1, loop); } catch (_) { return; }
        st._assigned.add(name);
      }
      st.currentClip = name;
      goto(layer, name, 0.1);
      if (!loop) {
        clearTimeout(st._one);
        const ms = Math.min((t.duration ? t.duration * 1000 : 800), 2600);
        st._one = setTimeout(() => {
          if (!st.dead) {
            st.currentClip = st.moving ? (st.running ? "Run" : "Walk") : "Idle";
            goto(layer, st.currentClip, 0.15);
          }
        }, ms);
      }
    },
    setDead(b) {
      if (!layer || b === st.dead) return;
      st.dead = b;
      st.currentClip = b ? "Death" : "Idle";
      goto(layer, st.currentClip, b ? 0.1 : 0.15);
    },
    playAttack() {
      if (!layer || st.dead || !hasAttack) return false;
      st.currentClip = "Attack";
      goto(layer, "Attack", 0.05);
      clearTimeout(st._atk);
      st._atk = setTimeout(() => {
        if (!st.dead) {
          st.currentClip = st.moving ? "Walk" : "Idle";
          goto(layer, st.currentClip, 0.12);
        }
      }, 520);
      return true;
    },
    playProceduralAttack,
    updateProceduralAttackPose,
    playExtremePose,
    resetAttackPose,
    getAttackDebug: collectAttackDebug,
    playOnce(state) {
      st.currentClip = state;
      goto(layer, state, 0.08);
    },
  };
}
