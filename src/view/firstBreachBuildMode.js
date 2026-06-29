// ============================================================================
// FIRST BREACH — IN-GAME BUILD MODE (dev-only, ?artEdit=1)
// ----------------------------------------------------------------------------
// Lets you place KayKit models directly on the real First Breach map and move / rotate /
// scale them with PlayCanvas's own transform gizmos (pc.TranslateGizmo / RotateGizmo /
// ScaleGizmo — built into engine 1.77). Click a palette item, click the map to drop it,
// then drag the handles. Export writes the placements in the FIRST_BREACH_KIT format so
// they can be baked into src/view/firstBreachKit.js.
//
// Cosmetic-only: this never touches gameplay, collision, routes, or the grid. It seeds from
// the current FIRST_BREACH_KIT so you EDIT the existing layout instead of starting blank.
// Loaded only when ?artEdit=1; otherwise this module is never imported.
// ============================================================================

import * as pc from "playcanvas";
import { preloadKit, place } from "./dungeonKit.js";
import { gridToWorld } from "../sim/pathing.js";
import { FB_BUILD_PALETTE, FB_PALETTE_ASSET_NAMES, FB_ASSET_CAT } from "./firstBreachKitPalette.js";
import { firstBreachKitSpecs } from "./firstBreachKit.js";

export function startFirstBreachBuildMode(renderer, level) {
  try {
    return new FirstBreachBuildMode(renderer, level).init();
  } catch (e) {
    console.error("[buildMode] failed to start:", e);
    return null;
  }
}

class FirstBreachBuildMode {
  constructor(renderer, level) {
    this.r = renderer;
    this.app = renderer.app;
    this.level = level;
    this.camComp = renderer.cameraEntity.camera;
    this.root = new pc.Entity("fb-build-mode");
    this.app.root.addChild(this.root);
    this.placed = [];      // { entity, asset, cat }
    this.brush = null;     // armed palette asset
    this.selected = null;  // selected placed piece
    this.mode = "move";
    this.placeY = 1.3;
    this._down = null;
  }

  async init() {
    this._injectStyle();
    this._buildUI();
    this._status("Loading models…");
    try {
      await preloadKit(this.app, FB_PALETTE_ASSET_NAMES);
    } catch (e) {
      this._status("⚠ model preload error: " + e.message);
    }
    this._makeGizmos();
    this._seedFromKit();
    this._wirePointer();
    this._wireKeys();
    this._status("Ready. Pick a model (left), click the map to place, drag the handles to adjust. E = export.");
    console.log("[buildMode] active — ?artEdit=1. Press E (or the Export button) to copy the kit JSON.");
    return this;
  }

  // ---- gizmos (engine built-ins) -----------------------------------------
  _makeGizmos() {
    try {
      const layer = pc.Gizmo.createLayer(this.app);
      // make sure the mission camera renders the gizmo layer
      if (this.camComp && Array.isArray(this.camComp.layers) && !this.camComp.layers.includes(layer.id)) {
        this.camComp.layers = this.camComp.layers.concat([layer.id]);
      }
      this.gizmos = {
        move: new pc.TranslateGizmo(this.camComp, layer),
        rotate: new pc.RotateGizmo(this.camComp, layer),
        scale: new pc.ScaleGizmo(this.camComp, layer),
      };
      for (const g of Object.values(this.gizmos)) g.detach();
    } catch (e) {
      this.gizmos = null;
      this._status("⚠ gizmo unavailable (" + e.message + ") — use the nudge buttons instead.");
      console.warn("[buildMode] gizmo init failed:", e);
    }
  }

  _select(piece) {
    this.selected = piece || null;
    if (this.gizmos) {
      for (const [k, g] of Object.entries(this.gizmos)) {
        if (piece && k === this.mode) g.attach([piece.entity]); else g.detach();
      }
    }
    this._refreshList();
  }

  _setMode(mode) { this.mode = mode; this._select(this.selected); this._syncModeButtons(); }

  // ---- seed from the current kit so you edit, not start blank --------------
  _seedFromKit() {
    let specs = [];
    try { specs = firstBreachKitSpecs(this.level); } catch (_) { specs = []; }
    for (const s of specs) {
      const ent = place(this.app, this.root, s.asset, { x: s.x, y: s.y, z: s.z, ry: s.ry, scale: s.scale });
      if (!ent) continue;
      ent.name = `build-${s.id}`;
      this.placed.push({ entity: ent, asset: s.asset, cat: s.cat || FB_ASSET_CAT[s.asset] || "prop" });
    }
    this._refreshList();
    this._status(`Loaded ${this.placed.length} existing props to edit.`);
  }

  // ---- placement ----------------------------------------------------------
  _placeAt(asset, col, row, y) {
    const w = gridToWorld(col, row, this.level);
    const ent = place(this.app, this.root, asset, { x: w.x, y, z: w.z, scale: 1 });
    if (!ent) { this._status("⚠ couldn't load " + asset); return; }
    ent.name = `build-new-${this.placed.length}`;
    const piece = { entity: ent, asset, cat: FB_ASSET_CAT[asset] || "prop" };
    this.placed.push(piece);
    this.brush = null;           // disarm so the gizmo can grab the new piece
    this._syncBrushButtons();
    this._select(piece);
    this._status(`Placed ${asset} at ${col},${row}. Drag the handles. Pick another model to place more.`);
  }

  _deleteSelected() {
    if (!this.selected) return;
    const i = this.placed.indexOf(this.selected);
    if (i < 0) return;
    if (this.gizmos) for (const g of Object.values(this.gizmos)) g.detach();
    this.selected.entity.destroy();
    this.placed.splice(i, 1);
    this.selected = null;
    this._refreshList();
    this._status("Deleted. " + this.placed.length + " props left.");
  }

  _nudge(dx, dy, dz) {
    if (!this.selected) return;
    const p = this.selected.entity.getLocalPosition();
    this.selected.entity.setLocalPosition(p.x + dx, p.y + dy, p.z + dz);
  }

  // ---- export -------------------------------------------------------------
  _export() {
    const cx = (this.level.cols - 1) / 2, cz = (this.level.rows - 1) / 2;
    const specs = this.placed.map((p, i) => {
      const w = p.entity.getPosition();
      const e = p.entity.getLocalEulerAngles();
      const s = p.entity.getLocalScale();
      return {
        id: `${p.cat}-${i}`, asset: p.asset,
        col: Math.round(w.x + cx), row: Math.round(w.z + cz),
        y: +w.y.toFixed(2), ry: Math.round(((e.y % 360) + 360) % 360),
        scale: +s.x.toFixed(3), cat: p.cat,
      };
    });
    const js = "export const FIRST_BREACH_KIT = Object.freeze([\n" +
      specs.map((s) => "  " + JSON.stringify(s)).join(",\n") + "\n]);";
    console.log("[buildMode] === FIRST_BREACH_KIT (" + specs.length + " props) ===\n" + js);
    if (navigator.clipboard) navigator.clipboard.writeText(js).catch(() => {});
    try {
      const blob = new Blob([JSON.stringify(specs, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "first-breach-kit.json"; a.click();
    } catch (_) {}
    this._status(`Exported ${specs.length} props → clipboard + console + first-breach-kit.json. Send me that file.`);
  }

  // ---- input --------------------------------------------------------------
  _wirePointer() {
    const el = this.r.domElement || this.app.graphicsDevice.canvas;
    this._onDown = (e) => { this._down = { x: e.clientX, y: e.clientY }; };
    this._onUp = (e) => {
      const d = this._down; this._down = null;
      if (!d || !this.brush) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) return; // drag = orbit, not a place
      const cell = this.r.pointerToCell ? this.r.pointerToCell(e.clientX, e.clientY, this.level) : null;
      if (!cell) { this._status("Click on the map floor to place."); return; }
      this._placeAt(this.brush, cell.col, cell.row, this.placeY);
    };
    el.addEventListener("pointerdown", this._onDown);
    el.addEventListener("pointerup", this._onUp);
  }

  _wireKeys() {
    this._onKey = (e) => {
      if (e.key === "Escape") { this.brush = null; this._syncBrushButtons(); this._status("Placing cancelled — edit mode."); }
      else if (e.key === "Delete" || e.key === "Backspace") { this._deleteSelected(); }
      else if (e.key === "e" || e.key === "E") { this._export(); }
    };
    window.addEventListener("keydown", this._onKey);
  }

  // ---- UI -----------------------------------------------------------------
  _injectStyle() {
    if (document.getElementById("fb-build-style")) return;
    const s = document.createElement("style");
    s.id = "fb-build-style";
    s.textContent = `
      #fbBuild{position:fixed;top:0;left:0;width:212px;max-height:100vh;overflow:auto;z-index:99999;
        background:rgba(10,14,10,.92);color:#cfe0c4;font:12px ui-monospace,Menlo,Consolas,monospace;
        border-right:1px solid #2c382c;padding:8px}
      #fbBuild h3{margin:2px 0 6px;color:#7bd86b;font-size:12px;letter-spacing:.06em}
      #fbBuild .sec{color:#c9a24a;text-transform:uppercase;font-size:10px;margin:10px 0 4px;letter-spacing:.08em}
      #fbBuild button{display:block;width:100%;text-align:left;margin:2px 0;background:#1b231b;color:#cfe0c4;
        border:1px solid #2c382c;border-radius:5px;padding:5px 7px;cursor:pointer;font:inherit}
      #fbBuild button:hover{border-color:#7bd86b}
      #fbBuild button.on{background:#26331f;border-color:#7bd86b;color:#7bd86b}
      #fbBuild .row{display:flex;gap:4px}#fbBuild .row button{width:auto;flex:1;text-align:center}
      #fbList{max-height:170px;overflow:auto;border:1px solid #2c382c;border-radius:5px;padding:3px;margin-top:3px}
      #fbList .it{display:flex;gap:3px;align-items:center;font-size:11px;padding:1px 0}
      #fbList .it span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      #fbList .it.sel{color:#c9a24a}
      #fbList .it button{width:auto;margin:0;padding:1px 5px}
      #fbStatus{position:fixed;bottom:0;left:0;right:0;z-index:99999;background:rgba(10,14,10,.92);
        color:#7bd86b;font:12px ui-monospace,monospace;padding:5px 10px;border-top:1px solid #2c382c}
      #fbBuild .exp{background:#2a3a22;border-color:#7bd86b;color:#a7f08b;text-align:center}
    `;
    document.head.appendChild(s);
  }

  _buildUI() {
    const wrap = document.createElement("div"); wrap.id = "fbBuild";
    wrap.innerHTML = `<h3>BUILD MODE · ?artEdit=1</h3>
      <div class="sec">Gizmo</div>
      <div class="row" id="fbModes">
        <button data-m="move" class="on">Move</button><button data-m="rotate">Rotate</button><button data-m="scale">Scale</button>
      </div>
      <div class="sec">Place height <span id="fbY">1.3</span></div>
      <div class="row"><button id="fbYdn">– lower</button><button id="fbYup">+ raise</button></div>
      <div class="sec">Models</div><div id="fbPalette"></div>
      <div class="sec">Placed (<span id="fbCount">0</span>)</div><div id="fbList"></div>
      <div class="sec">Selected</div>
      <button id="fbDel">Delete selected (Del)</button>
      <button id="fbExport" class="exp">Export kit JSON (E)</button>`;
    document.body.appendChild(wrap);
    const status = document.createElement("div"); status.id = "fbStatus"; status.textContent = "Build mode loading…";
    document.body.appendChild(status);
    this._ui = { wrap, status };

    const pal = wrap.querySelector("#fbPalette");
    for (const p of FB_BUILD_PALETTE) {
      const b = document.createElement("button"); b.textContent = p.label; b.dataset.asset = p.asset;
      b.onclick = () => { this.brush = p.asset; this._syncBrushButtons(); this._status(`Click the map to place: ${p.label}. (Esc to cancel)`); };
      pal.appendChild(b);
    }
    wrap.querySelectorAll("#fbModes button").forEach((b) => b.onclick = () => this._setMode(b.dataset.m));
    wrap.querySelector("#fbYup").onclick = () => { this.placeY += 0.2; wrap.querySelector("#fbY").textContent = this.placeY.toFixed(1); };
    wrap.querySelector("#fbYdn").onclick = () => { this.placeY = Math.max(0, this.placeY - 0.2); wrap.querySelector("#fbY").textContent = this.placeY.toFixed(1); };
    wrap.querySelector("#fbDel").onclick = () => this._deleteSelected();
    wrap.querySelector("#fbExport").onclick = () => this._export();
  }

  _syncBrushButtons() {
    if (!this._ui) return;
    this._ui.wrap.querySelectorAll("#fbPalette button").forEach((b) => b.classList.toggle("on", b.dataset.asset === this.brush));
  }
  _syncModeButtons() {
    if (!this._ui) return;
    this._ui.wrap.querySelectorAll("#fbModes button").forEach((b) => b.classList.toggle("on", b.dataset.m === this.mode));
  }
  _refreshList() {
    if (!this._ui) return;
    const list = this._ui.wrap.querySelector("#fbList");
    this._ui.wrap.querySelector("#fbCount").textContent = String(this.placed.length);
    list.innerHTML = "";
    this.placed.forEach((p, i) => {
      const row = document.createElement("div"); row.className = "it" + (p === this.selected ? " sel" : "");
      const name = document.createElement("span"); name.textContent = `${i}. ${p.asset}`;
      const sel = document.createElement("button"); sel.textContent = "sel"; sel.onclick = () => this._select(p);
      const del = document.createElement("button"); del.textContent = "×"; del.onclick = () => { this._select(p); this._deleteSelected(); };
      row.appendChild(name); row.appendChild(sel); row.appendChild(del); list.appendChild(row);
    });
  }
  _status(msg) { if (this._ui) this._ui.status.textContent = msg; }
}
