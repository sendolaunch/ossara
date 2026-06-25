import * as pc from "playcanvas";
import { CSS } from "../config/palette.js";
import { HERO_ATTACK_VARIANTS, loadCharacter } from "../view/character.js";

const col = (hex) => new pc.Color(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);

function mat(hex, emissive = 0) {
  const m = new pc.StandardMaterial();
  const c = col(hex);
  m.diffuse = c;
  if (emissive > 0) {
    m.emissive = c;
    m.emissiveIntensity = emissive;
  }
  m.update();
  return m;
}

function prim(type, material) {
  const e = new pc.Entity();
  e.addComponent("render", { type, castShadows: true, receiveShadows: true });
  if (material && e.render?.meshInstances?.[0]) e.render.meshInstances[0].material = material;
  return e;
}

const fmt = (v) => {
  if (!v) return "-";
  return `${Number(v.x || 0).toFixed(3)}, ${Number(v.y || 0).toFixed(3)}, ${Number(v.z || 0).toFixed(3)}`;
};

export class HeroAttackLab {
  constructor(appEl, uiEl, classId = "warden") {
    this.appEl = appEl;
    this.uiEl = uiEl;
    this.classId = classId || "warden";
    this.canvas = document.createElement("canvas");
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.display = "block";
    appEl.appendChild(this.canvas);
    this.app = new pc.Application(this.canvas, { graphicsDeviceOptions: { antialias: true } });
    this.app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    this.app.setCanvasResolution(pc.RESOLUTION_AUTO);
    this.app.scene.ambientLight = col(0x384038);
    this.ctl = null;
    this.running = false;
    this.slow = false;
    this.variantIndex = 0;
    this.lastAction = "loading";
    this._frame = this._frame.bind(this);
    this._onKey = this._onKey.bind(this);
    this._onClick = this._onClick.bind(this);
    this._buildScene();
    this._buildOverlay();
  }

  _buildScene() {
    this.camera = new pc.Entity("hero-attack-lab-camera");
    this.camera.addComponent("camera", { fov: 38, nearClip: 0.05, farClip: 80, clearColor: col(0x090d0a) });
    this.camera.setPosition(1.8, 1.45, 3.0);
    this.camera.lookAt(0.05, 1.12, 0);
    this.app.root.addChild(this.camera);

    const key = new pc.Entity("hero-attack-lab-key");
    key.addComponent("light", { type: "directional", color: col(0xf4e2b8), intensity: 1.9, castShadows: true });
    key.setEulerAngles(45, 140, 0);
    this.app.root.addChild(key);

    const fill = new pc.Entity("hero-attack-lab-fill");
    fill.addComponent("light", { type: "point", color: col(0x6eff70), intensity: 1.2, range: 7 });
    fill.setPosition(-1.8, 1.8, 1.5);
    this.app.root.addChild(fill);

    const floor = prim("box", mat(0x1d241d));
    floor.setLocalScale(4.5, 0.06, 4.5);
    floor.setPosition(0, -0.03, 0);
    this.app.root.addChild(floor);

    const handMarker = prim("sphere", mat(0x5bff70, 0.9));
    handMarker.name = "right-hand-focus-marker";
    handMarker.setLocalScale(0.04, 0.04, 0.04);
    handMarker.setPosition(0.42, 1.08, 0.08);
    this.app.root.addChild(handMarker);
  }

  _buildOverlay() {
    this.root = document.createElement("div");
    this.root.style.position = "absolute";
    this.root.style.inset = "0";
    this.root.style.zIndex = "40";
    this.root.style.pointerEvents = "none";
    this.root.innerHTML = `<div style="position:absolute;left:16px;top:14px;width:min(620px,calc(100vw - 32px));padding:12px 14px;border:1px solid ${CSS.plague};background:rgba(6,10,7,.86);color:${CSS.bone};font:12px ui-monospace,Consolas,monospace;line-height:1.45;box-shadow:0 0 22px rgba(91,255,112,.18)">
      <div style="color:${CSS.gold};font-weight:800;letter-spacing:.08em">WARDEN ATTACK VISUAL LAB</div>
      <div style="color:${CSS.ash}">Dev-only route: ?devHeroAttack=warden</div>
      <div style="margin:8px 0;display:flex;gap:6px;flex-wrap:wrap;pointer-events:auto">
        <button data-action="attack">Attack / Space</button>
        <button data-action="slow">Slow Attack / S</button>
        <button data-action="variant-0">Variant A / 1</button>
        <button data-action="variant-1">Variant B / 2</button>
        <button data-action="variant-2">Variant C / 3</button>
        <button data-action="extreme-sword">Extreme sword / E</button>
        <button data-action="extreme-slot">Extreme handslot / H</button>
        <button data-action="extreme-hand">Extreme hand.r / J</button>
        <button data-action="reset">Reset / R</button>
      </div>
      <pre id="heroAttackLabDebug" style="margin:0;white-space:pre-wrap;color:${CSS.bone}">loading...</pre>
    </div>`;
    this.uiEl.appendChild(this.root);
    this.debugEl = this.root.querySelector("#heroAttackLabDebug");
    this.root.addEventListener("click", this._onClick);
  }

  async start() {
    this.app.start();
    this.ctl = await loadCharacter(this.app, this.classId);
    if (this.ctl?.wrap) {
      this.app.root.addChild(this.ctl.wrap);
      this.ctl.wrap.setPosition(0, 0, 0);
      this.ctl.wrap.setLocalEulerAngles(0, 190, 0);
      this.ctl.setMoving(false);
      this.ctl.setDead(false);
      this.lastAction = "loaded";
    } else {
      this.lastAction = "failed to load character";
    }
    window.addEventListener("keydown", this._onKey);
    this.running = true;
    requestAnimationFrame(this._frame);
  }

  _triggerAttack(slow = false) {
    const variant = HERO_ATTACK_VARIANTS[this.variantIndex % HERO_ATTACK_VARIANTS.length] || HERO_ATTACK_VARIANTS[0];
    const ok = this.ctl?.playProceduralAttack?.({ slow, variant: variant.id });
    this.lastAction = ok ? `${slow ? "slow " : ""}${variant.label}` : "attack visual unavailable";
    if (ok) this.variantIndex = (this.variantIndex + 1) % HERO_ATTACK_VARIANTS.length;
  }

  _forceVariant(index) {
    this.variantIndex = ((index % HERO_ATTACK_VARIANTS.length) + HERO_ATTACK_VARIANTS.length) % HERO_ATTACK_VARIANTS.length;
    const variant = HERO_ATTACK_VARIANTS[this.variantIndex];
    this.lastAction = `forced ${variant.label}`;
  }

  _extreme(target) {
    const ok = this.ctl?.playExtremePose?.(target, 2);
    this.lastAction = ok ? `extreme pose: ${target}` : `extreme pose failed: ${target}`;
  }

  _onClick(ev) {
    const btn = ev.target?.closest?.("button[data-action]");
    if (!btn) return;
    ev.preventDefault();
    const action = btn.dataset.action;
    if (action === "attack") this._triggerAttack(false);
    else if (action === "slow") this._triggerAttack(true);
    else if (action === "variant-0") this._forceVariant(0);
    else if (action === "variant-1") this._forceVariant(1);
    else if (action === "variant-2") this._forceVariant(2);
    else if (action === "extreme-sword") this._extreme("sword_1handed");
    else if (action === "extreme-slot") this._extreme("handslot.r");
    else if (action === "extreme-hand") this._extreme("hand.r");
    else if (action === "reset") {
      this.ctl?.resetAttackPose?.();
      this.lastAction = "reset";
    }
  }

  _onKey(ev) {
    const k = ev.key.toLowerCase();
    if (k === " ") {
      ev.preventDefault();
      this._triggerAttack(false);
    } else if (k === "s") {
      ev.preventDefault();
      this._triggerAttack(true);
    } else if (k === "e") {
      ev.preventDefault();
      this._extreme("sword_1handed");
    } else if (k === "h") {
      ev.preventDefault();
      this._extreme("handslot.r");
    } else if (k === "j") {
      ev.preventDefault();
      this._extreme("hand.r");
    } else if (k === "r") {
      ev.preventDefault();
      this.ctl?.resetAttackPose?.();
      this.lastAction = "reset";
    } else if (["1", "2", "3"].includes(k)) {
      ev.preventDefault();
      this._forceVariant(Number(k) - 1);
    }
  }

  _debugText() {
    const d = this.ctl?.getAttackDebug?.() || {};
    const queuedVariant = HERO_ATTACK_VARIANTS[this.variantIndex % HERO_ATTACK_VARIANTS.length] || HERO_ATTACK_VARIANTS[0];
    const rows = [
      `class: ${this.classId}`,
      `last action: ${this.lastAction}`,
      `queued variant: ${this.variantIndex + 1} ${queuedVariant.label}`,
      `active variant: ${d.variantId || "-"} ${d.variantLabel || ""}`,
      `attack phase: ${d.phase || "-"}`,
      `attack time: ${Number(d.time || 0).toFixed(3)}`,
      `current animation clip: ${d.currentClip || "-"}`,
      `right hand entity found: ${d.rightHandFound ? "yes" : "no"}`,
      `handslot.r entity found: ${d.handSlotFound ? "yes" : "no"}`,
      `sword_1handed entity found: ${d.swordFound ? "yes" : "no"}`,
      `animated entity: ${d.animatedEntity || "-"}`,
      `before local rotation: ${fmt(d.beforeLocalRot)}`,
      `after local rotation: ${fmt(d.afterLocalRot)}`,
      `before world position: ${fmt(d.beforeWorld)}`,
      `after world position: ${fmt(d.afterWorld)}`,
      "",
      "candidate entities:",
      ...((d.entities || []).map((e) => `- ${e.name} render:${e.hasRender ? "yes" : "no"} children:${e.children} world:${fmt(e.world)}`)),
    ];
    return rows.join("\n");
  }

  _frame() {
    if (!this.running) return;
    if (this.debugEl) this.debugEl.textContent = this._debugText();
    requestAnimationFrame(this._frame);
  }
}
