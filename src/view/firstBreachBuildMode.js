// ============================================================================
// FIRST BREACH — IN-GAME BUILD MODE / "Build Lab" (dev-only, ?artEdit=1)
// ----------------------------------------------------------------------------
// A cosmetic 3D map editor over the real First Breach map. Grab a piece's body and DRAG it
// across the actual map surface with the mouse (not a 2D grid tool); optional soft snap, Q/E
// rotate, raise/lower, axis lock; undo/redo; numeric transform inspector; safe-zone overlays +
// a protected-cell warning; export/import of the FIRST_BREACH_KIT JSON. Cosmetic-only — never
// touches gameplay/collision/routes/Ward/gates/grid.
// ============================================================================

import * as pc from "playcanvas";
import { preloadKit, place } from "./dungeonKit.js";
import { gridToWorld, pathCellSet, expandRects } from "../sim/pathing.js";
import { surfaceHeightAtCell } from "../config/firstBreachGrid.js";
import { protectedGameplayCellSet } from "../mapbuilder/mapValidation.js";
import { FB_BUILD_PALETTE, FB_PALETTE_ASSET_NAMES, FB_ASSET_CAT } from "./firstBreachKitPalette.js";
import { firstBreachKitSpecs, FIRST_BREACH_KIT_ASSET_NAMES } from "./firstBreachKit.js";
import { rotateGroup } from "./buildGroupMath.js";

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
    this.placed = [];
    this.brush = null;
    this.selected = null;
    this.sel = [];          // multi-selection; this.selected is the primary
    this.clip = null;       // copied group of specs, for paste
    this.mode = "move";     // move = free-drag in 3D; rotate/scale = gizmo
    this.placeY = 1.3;
    this._down = null;
    this._drag = null;      // active free-drag { piece, before, offX, offZ }
    this._axis = null;      // "x" | "z" while held
    this._hl = null;
    this._hiddenHud = null;
    this._undo = [];
    this._redo = [];
    this._txBefore = null;
    this.snapPos = 0;       // soft snap: 0 = off, else 0.25 / 0.5 / 1
    this.snapRot = 0;       // 0 = off, else 15 / 45 / 90
    this._overlays = {};
    this._protSet = null;
  }

  async init() {
    this._injectStyle();
    this._buildUI();
    this._status("Loading models...");
    try {
      await preloadKit(this.app, [...new Set([...FB_PALETTE_ASSET_NAMES, ...FIRST_BREACH_KIT_ASSET_NAMES])]);
    } catch (e) { this._status("model preload error: " + e.message); }
    this._protSet = (() => { try { return protectedGameplayCellSet(this.level); } catch (_) { return new Set(); } })();
    this._makeGizmos();
    this._seedFromKit();
    this._wirePointer();
    this._wireKeys();
    this._hideGameHud();
    this._makeHighlight();
    this._onTick = () => this._updateHighlight();
    this.app.on("update", this._onTick);
    this._refreshInspector();
    this._status("Move mode: drag a piece across the map. Q/E rotate, PgUp/PgDn raise/lower, F=snap-to-floor, hold X/Z to lock. Ctrl+Z undo. E export.");
    return this;
  }

  // ---- gizmos (rotate + scale only; move = free-drag) ---------------------
  _makeGizmos() {
    try {
      const layer = pc.Gizmo.createLayer(this.app);
      if (this.camComp && Array.isArray(this.camComp.layers) && !this.camComp.layers.includes(layer.id)) {
        this.camComp.layers = this.camComp.layers.concat([layer.id]);
      }
      this.gizmos = {
        rotate: new pc.RotateGizmo(this.camComp, layer),
        scale: new pc.ScaleGizmo(this.camComp, layer),
      };
      for (const g of Object.values(this.gizmos)) {
        g.detach();
        g.on("transform:start", () => { this._txBefore = this.selected ? this._snapshot(this.selected) : null; });
        g.on("transform:end", () => {
          if (!this.selected || !this._txBefore) { this._txBefore = null; return; }
          const piece = this.selected, before = this._txBefore, after = this._snapshot(piece);
          this._txBefore = null;
          if (this._sameSnap(before, after)) return;
          this._pushUndo({ undo: () => { this._applySnap(piece, before); this._select(piece); }, redo: () => { this._applySnap(piece, after); this._select(piece); } });
          this._refreshInspector();
        });
      }
    } catch (e) {
      this.gizmos = null;
      this._status("gizmo unavailable (" + e.message + ")");
      console.warn("[buildMode] gizmo init failed:", e);
    }
  }

  _applyGizmoSnap() {
    if (!this.gizmos) return;
    this.gizmos.rotate.snap = this.snapRot > 0; this.gizmos.rotate.snapIncrement = this.snapRot || 15;
    this.gizmos.scale.snap = this.snapPos > 0; this.gizmos.scale.snapIncrement = 0.25;
  }

  _select(piece) {
    this.selected = piece || null;
    this.sel = piece ? [piece] : [];
    if (this.gizmos) {
      for (const [k, g] of Object.entries(this.gizmos)) {
        if (piece && k === this.mode) g.attach([piece.entity]); else g.detach();
      }
      this._applyGizmoSnap();
    }
    this._updateHighlight();
    this._refreshList();
    this._refreshInspector();
  }

  _toggleSel(piece) {
    if (!piece) return;
    const i = this.sel.indexOf(piece);
    if (i >= 0) { this.sel.splice(i, 1); this.selected = this.sel[this.sel.length - 1] || null; }
    else { this.sel.push(piece); this.selected = piece; }
    if (this.gizmos) { for (const [k, g] of Object.entries(this.gizmos)) { if (this.selected && k === this.mode) g.attach([this.selected.entity]); else g.detach(); } this._applyGizmoSnap(); }
    this._updateHighlight(); this._refreshList(); this._refreshInspector();
    this._status(this.sel.length + " selected.");
  }
  _selectMany(pieces) {
    this.sel = (pieces || []).filter(Boolean);
    this.selected = this.sel[this.sel.length - 1] || null;
    if (this.gizmos) { for (const [k, g] of Object.entries(this.gizmos)) { if (this.selected && k === this.mode) g.attach([this.selected.entity]); else g.detach(); } this._applyGizmoSnap(); }
    this._updateHighlight(); this._refreshList(); this._refreshInspector();
  }
  _setMode(mode) { this.mode = mode; this._select(this.selected); this._syncModeButtons(); }

  // ---- spec / spawn / remove (undo-friendly) ------------------------------
  _specOf(piece) {
    const e = piece.entity, p = e.getPosition(), a = e.getLocalEulerAngles(), s = e.getLocalScale();
    return { asset: piece.asset, cat: piece.cat, x: p.x, y: p.y, z: p.z, ry: a.y, scale: s.x };
  }
  _spawn(spec) {
    const ent = place(this.app, this.root, spec.asset, { x: spec.x, y: spec.y, z: spec.z, ry: spec.ry, scale: spec.scale });
    if (!ent) return null;
    ent.name = "build-" + this.placed.length;
    const piece = { entity: ent, asset: spec.asset, cat: spec.cat || FB_ASSET_CAT[spec.asset] || "prop" };
    this.placed.push(piece);
    this._refreshList();
    return piece;
  }
  _remove(piece) {
    if (this.selected === piece) { if (this.gizmos) for (const g of Object.values(this.gizmos)) g.detach(); this.selected = null; }
    const i = this.placed.indexOf(piece);
    if (i >= 0) this.placed.splice(i, 1);
    try { piece.entity.destroy(); } catch (_) {}
    this._updateHighlight(); this._refreshList(); this._refreshInspector();
  }

  _seedFromKit() {
    let specs = [];
    try { specs = firstBreachKitSpecs(this.level); } catch (_) { specs = []; }
    for (const s of specs) {
      const ent = place(this.app, this.root, s.asset, { x: s.x, y: s.y, z: s.z, ry: s.ry, scale: s.scale });
      if (!ent) continue;
      ent.name = "build-" + s.id;
      this.placed.push({ entity: ent, asset: s.asset, cat: s.cat || FB_ASSET_CAT[s.asset] || "prop" });
    }
    this._refreshList();
    this._status("Loaded " + this.placed.length + " existing pieces to edit.");
  }

  _placeAt(asset, col, row, y) {
    const w = gridToWorld(col, row, this.level);
    const piece = this._spawn({ asset, cat: FB_ASSET_CAT[asset] || "prop", x: w.x, y, z: w.z, ry: 0, scale: 1 });
    if (!piece) { this._status("couldn't load " + asset); return; }
    this.brush = null; this._syncBrushButtons();
    this._select(piece);
    this._pushUndo({ undo: () => this._remove(piece), redo: () => { const p = this._spawn(this._specOf(piece)); this._select(p); } });
    this._status("Placed " + asset + ". Drag it to reposition. Q/E rotate, PgUp/PgDn raise/lower.");
  }

  _duplicate() {
    if (!this.sel.length) return;
    const specs = this.sel.map((p) => { const sp = this._specOf(p); sp.x += 1; sp.z += 1; return sp; });
    let made = specs.map((sp) => this._spawn(sp)).filter(Boolean);
    if (!made.length) return;
    this._selectMany(made);
    this._pushUndo({ undo: () => { for (const p of [...made]) this._remove(p); made = []; }, redo: () => { made = specs.map((sp) => this._spawn(sp)).filter(Boolean); this._selectMany(made); } });
    this._status("Cloned " + made.length + " piece(s).");
  }
  _copy() {
    if (!this.sel.length) { this._status("Nothing selected to copy."); return; }
    this.clip = this.sel.map((p) => this._specOf(p));
    this._status("Copied " + this.clip.length + " piece(s). Ctrl+V to paste.");
  }
  _paste() {
    if (!this.clip || !this.clip.length) { this._status("Clipboard empty - select pieces and Ctrl+C first."); return; }
    const off = 2;
    const specs = this.clip.map((sp) => ({ ...sp, x: sp.x + off, z: sp.z + off }));
    let made = specs.map((sp) => this._spawn(sp)).filter(Boolean);
    if (!made.length) { this._status("Paste failed."); return; }
    this._selectMany(made);
    this._pushUndo({ undo: () => { for (const p of [...made]) this._remove(p); made = []; }, redo: () => { made = specs.map((sp) => this._spawn(sp)).filter(Boolean); this._selectMany(made); } });
    this._status("Pasted " + made.length + " piece(s). Drag to move, Q/R rotate the group.");
  }

  _deleteSelected() {
    if (!this.sel.length) return;
    const specs = this.sel.map((p) => this._specOf(p));
    for (const p of [...this.sel]) this._remove(p);
    let cur = [];
    this._pushUndo({ undo: () => { cur = specs.map((sp) => this._spawn(sp)).filter(Boolean); this._selectMany(cur); }, redo: () => { for (const p of cur) this._remove(p); cur = []; } });
    this._status("Deleted " + specs.length + ". " + this.placed.length + " left. (Ctrl+Z to restore)");
  }

  // record one undo step around an action that mutates the selected transform
  _withUndo(fn) {
    if (!this.selected) return;
    const piece = this.selected, before = this._snapshot(piece);
    fn(piece);
    const after = this._snapshot(piece);
    if (this._sameSnap(before, after)) return;
    this._pushUndo({ undo: () => { this._applySnap(piece, before); this._select(piece); }, redo: () => { this._applySnap(piece, after); this._select(piece); } });
    this._updateHighlight(); this._refreshInspector();
  }
  _rotateSel(dir) {
    const inc = (this.snapRot > 0 ? this.snapRot : 15) * dir;
    if (this.sel.length > 1) return this._rotateGroup(inc);
    this._withUndo((p) => { const a = p.entity.getLocalEulerAngles(); p.entity.setLocalEulerAngles(0, a.y + inc, 0); });
  }
  _rotateGroup(deg) {
    if (this.sel.length < 1) return;
    const ref = this.sel.map((p) => ({ piece: p, snap: this._snapshot(p) }));
    const pts = this.sel.map((p) => { const w = p.entity.getPosition(), e = p.entity.getLocalEulerAngles(); return { x: w.x, y: w.y, z: w.z, ry: e.y }; });
    const rot = rotateGroup(pts, deg);
    this.sel.forEach((p, i) => { p.entity.setPosition(rot[i].x, pts[i].y, rot[i].z); p.entity.setLocalEulerAngles(0, rot[i].ry, 0); });
    const after = this.sel.map((p) => this._snapshot(p));
    this._pushUndo({ undo: () => { ref.forEach((b) => this._applySnap(b.piece, b.snap)); this._updateHighlight(); this._refreshInspector(); }, redo: () => { ref.forEach((b, i) => this._applySnap(b.piece, after[i])); this._updateHighlight(); this._refreshInspector(); } });
    this._updateHighlight(); this._refreshInspector();
    this._status("Rotated group " + deg + " deg.");
  }
  _raiseSel(dy) {
    if (!this.sel.length) return;
    const ref = this.sel.map((p) => ({ piece: p, snap: this._snapshot(p) }));
    for (const p of this.sel) { const o = p.entity.getPosition(); let ny = o.y + dy; if (this.snapPos > 0) ny = Math.round(ny / this.snapPos) * this.snapPos; p.entity.setPosition(o.x, ny, o.z); }
    const after = this.sel.map((p) => this._snapshot(p));
    this._pushUndo({ undo: () => { ref.forEach((b) => this._applySnap(b.piece, b.snap)); this._updateHighlight(); this._refreshInspector(); }, redo: () => { ref.forEach((b, i) => this._applySnap(b.piece, after[i])); this._updateHighlight(); this._refreshInspector(); } });
    this._updateHighlight(); this._refreshInspector();
  }
  _snapToFloor() {
    if (!this.selected) return;
    this._withUndo((p) => {
      const cx = (this.level.cols - 1) / 2, cz = (this.level.rows - 1) / 2, w = p.entity.getPosition();
      const col = Math.round(w.x + cx), row = Math.round(w.z + cz);
      let h = 1.3; try { h = surfaceHeightAtCell(col, row); } catch (_) {}
      p.entity.setPosition(w.x, h, w.z);
    });
    this._status("Snapped to floor height.");
  }

  // ---- undo / redo --------------------------------------------------------
  _pushUndo(entry) { this._undo.push(entry); if (this._undo.length > 50) this._undo.shift(); this._redo.length = 0; this._syncHistButtons(); }
  _doUndo() { const e = this._undo.pop(); if (!e) { this._status("Nothing to undo."); return; } e.undo(); this._redo.push(e); this._syncHistButtons(); this._status("Undid."); }
  _doRedo() { const e = this._redo.pop(); if (!e) { this._status("Nothing to redo."); return; } e.redo(); this._undo.push(e); this._syncHistButtons(); this._status("Redid."); }
  _snapshot(piece) { const e = piece.entity; return { pos: e.getLocalPosition().clone(), rot: e.getLocalEulerAngles().clone(), scale: e.getLocalScale().clone() }; }
  _applySnap(piece, s) { const e = piece.entity; e.setLocalPosition(s.pos.x, s.pos.y, s.pos.z); e.setLocalEulerAngles(s.rot.x, s.rot.y, s.rot.z); e.setLocalScale(s.scale.x, s.scale.y, s.scale.z); }
  _sameSnap(a, b) { return a.pos.equals(b.pos) && a.rot.equals(b.rot) && a.scale.equals(b.scale); }

  // ---- export / import ----------------------------------------------------
  _specsForExport() {
    const cx = (this.level.cols - 1) / 2, cz = (this.level.rows - 1) / 2;
    return this.placed.map((p, i) => {
      const w = p.entity.getPosition(), e = p.entity.getLocalEulerAngles(), s = p.entity.getLocalScale();
      return { id: p.cat + "-" + i, asset: p.asset, col: Math.round(w.x + cx), row: Math.round(w.z + cz), y: +w.y.toFixed(2), ry: Math.round(((e.y % 360) + 360) % 360), scale: +s.x.toFixed(3), cat: p.cat };
    });
  }
  _export() {
    const specs = this._specsForExport();
    const js = "export const FIRST_BREACH_KIT = Object.freeze([\n" + specs.map((s) => "  " + JSON.stringify(s)).join(",\n") + "\n]);";
    console.log("[buildMode] FIRST_BREACH_KIT (" + specs.length + ")\n" + js);
    if (navigator.clipboard) navigator.clipboard.writeText(js).catch(() => {});
    try { const blob = new Blob([JSON.stringify(specs, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "first-breach-kit.json"; a.click(); } catch (_) {}
    this._status("Exported " + specs.length + " pieces -> clipboard + first-breach-kit.json. Send me that file.");
  }
  _copySelectedJson() {
    if (!this.selected) return;
    const cx = (this.level.cols - 1) / 2, cz = (this.level.rows - 1) / 2, p = this.selected, w = p.entity.getPosition(), e = p.entity.getLocalEulerAngles(), s = p.entity.getLocalScale();
    const spec = { asset: p.asset, col: Math.round(w.x + cx), row: Math.round(w.z + cz), y: +w.y.toFixed(2), ry: Math.round(((e.y % 360) + 360) % 360), scale: +s.x.toFixed(3), cat: p.cat };
    if (navigator.clipboard) navigator.clipboard.writeText(JSON.stringify(spec)).catch(() => {});
    this._status("Copied placement JSON.");
  }
  _import(text) {
    let arr; try { arr = JSON.parse(text); } catch (e) { this._status("import: bad JSON"); return; }
    if (!Array.isArray(arr)) { this._status("import: expected an array"); return; }
    for (const p of [...this.placed]) this._remove(p);
    this._undo.length = 0; this._redo.length = 0; this._syncHistButtons();
    let n = 0;
    for (const s of arr) {
      const w = gridToWorld(s.col != null ? s.col : 0, s.row != null ? s.row : 0, this.level);
      if (this._spawn({ asset: s.asset, cat: s.cat || "prop", x: w.x, y: s.y != null ? s.y : 1.3, z: w.z, ry: s.ry || 0, scale: s.scale || 1 })) n++;
    }
    this._select(null);
    this._status("Imported " + n + "/" + arr.length + " pieces.");
  }

  // ---- safe-zone overlays -------------------------------------------------
  _overlayCells(kind) {
    try {
      if (kind === "route") return pathCellSet(this.level);
      if (kind === "reserve") return new Set(expandRects(this.level.reservedZones || []).map((c) => c.col + "," + c.row));
      if (kind === "protected") return this._protSet || new Set();
    } catch (_) {}
    return new Set();
  }
  _toggleOverlay(kind, color, on) {
    if (on && !this._overlays[kind]) {
      const grp = new pc.Entity("ov-" + kind); this.app.root.addChild(grp);
      const m = new pc.StandardMaterial(); m.useLighting = false; m.emissive = color; m.diffuse = new pc.Color(0, 0, 0);
      m.opacity = 0.3; m.blendType = pc.BLEND_ADDITIVE; m.depthWrite = false; m.update();
      let count = 0;
      for (const key of this._overlayCells(kind)) {
        if (count++ > 1600) break;
        const parts = key.split(","), c = +parts[0], r = +parts[1];
        const w = gridToWorld(c, r, this.level);
        const e = this._box(m); e.setLocalScale(0.9, 0.04, 0.9); e.setPosition(w.x, 0.06, w.z); grp.addChild(e);
      }
      this._overlays[kind] = grp;
    }
    if (this._overlays[kind]) this._overlays[kind].enabled = !!on;
  }
  _box(material) {
    const e = new pc.Entity();
    e.addComponent("render", { type: "box", castShadows: false, receiveShadows: false });
    if (e.render && e.render.meshInstances[0]) e.render.meshInstances[0].material = material;
    return e;
  }
  _overlapWarn() {
    if (!this.selected || !this._protSet) return "";
    if (["pillar", "rubble", "prop"].indexOf(this.selected.cat) < 0) return "";
    const cx = (this.level.cols - 1) / 2, cz = (this.level.rows - 1) / 2, w = this.selected.entity.getPosition();
    const key = Math.round(w.x + cx) + "," + Math.round(w.z + cz);
    return this._protSet.has(key) ? "! on a protected/route cell - move it off-lane" : "";
  }

  // ---- pointer: 3D free-drag (capture phase so it beats camera orbit) ------
  _surfacePointAt(clientX, clientY, planeY) {
    const ray = this._screenRay(clientX, clientY);
    if (!ray) return null;
    const dy = ray.direction.y;
    if (Math.abs(dy) < 1e-6) return null;
    const t = (planeY - ray.origin.y) / dy;
    if (t < 0) return null;
    return { x: ray.origin.x + ray.direction.x * t, z: ray.origin.z + ray.direction.z * t };
  }
  _wirePointer() {
    const el = this.r.domElement || this.app.graphicsDevice.canvas;
    this._onDown = (e) => {
      this._down = { x: e.clientX, y: e.clientY, shift: e.shiftKey };
      if (this.brush) return; // placing handled on up
      const piece = this._pickPiece(e.clientX, e.clientY);
      if (piece && this.mode === "move") {
        if (e.shiftKey) { this._toggleSel(piece); e.stopPropagation(); e.preventDefault(); return; } // shift-click = add/remove
        if (!this.sel.includes(piece)) this._select(piece); // clicked outside the group -> select just this one
        const sp = this._surfacePointAt(e.clientX, e.clientY, piece.entity.getPosition().y);
        const items = this.sel.map((pc) => { const c = pc.entity.getPosition(); return { piece: pc, before: this._snapshot(pc), offX: sp ? c.x - sp.x : 0, offZ: sp ? c.z - sp.z : 0 }; });
        this._drag = { items, refY: piece.entity.getPosition().y, moved: false };
        e.stopPropagation(); e.preventDefault(); // don't orbit the camera while dragging
      }
    };
    this._onMove = (e) => {
      if (!this._drag) return;
      const sp = this._surfacePointAt(e.clientX, e.clientY, this._drag.refY);
      if (!sp) return;
      for (const it of this._drag.items) {
        const cur = it.piece.entity.getPosition();
        let nx = sp.x + it.offX, nz = sp.z + it.offZ;
        if (this._axis === "x") nz = cur.z; else if (this._axis === "z") nx = cur.x;
        if (this.snapPos > 0) { nx = Math.round(nx / this.snapPos) * this.snapPos; nz = Math.round(nz / this.snapPos) * this.snapPos; }
        it.piece.entity.setPosition(nx, cur.y, nz);
      }
      this._drag.moved = true;
      this._updateHighlight();
      e.stopPropagation();
    };
    this._onUp = (e) => {
      const d = this._down; this._down = null;
      if (this._drag) {
        const dr = this._drag; this._drag = null;
        if (dr.moved) {
          const moved = dr.items.map((it) => ({ piece: it.piece, before: it.before, after: this._snapshot(it.piece) })).filter((it) => !this._sameSnap(it.before, it.after));
          if (moved.length) this._pushUndo({ undo: () => { for (const it of moved) this._applySnap(it.piece, it.before); this._updateHighlight(); this._refreshInspector(); }, redo: () => { for (const it of moved) this._applySnap(it.piece, it.after); this._updateHighlight(); this._refreshInspector(); } });
        }
        this._refreshInspector();
        e.stopPropagation();
        return;
      }
      if (!d) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) return; // a drag with no piece = camera orbit
      if (this.brush) {
        const cell = this.r.pointerToCell ? this.r.pointerToCell(e.clientX, e.clientY, this.level) : null;
        if (!cell) { this._status("Click on the map floor to place."); return; }
        this._placeAt(this.brush, cell.col, cell.row, this.placeY);
        return;
      }
      const piece = this._pickPiece(e.clientX, e.clientY);
      if (piece) {
        if (d.shift) { this._toggleSel(piece); }
        else { this._select(piece); this._status("Grabbed " + piece.asset + ". Shift-click adds, Ctrl+C/V copy-paste, Q/R rotate, Del."); }
      }
      // empty click keeps the current selection (press Esc to deselect)
    };
    el.addEventListener("pointerdown", this._onDown, true);
    el.addEventListener("pointermove", this._onMove, true);
    el.addEventListener("pointerup", this._onUp, true);
  }

  _screenRay(clientX, clientY) {
    const el = this.r.domElement || this.app.graphicsDevice.canvas;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const sx = (clientX - rect.left) * ((el.width || rect.width) / rect.width);
    const sy = (clientY - rect.top) * ((el.height || rect.height) / rect.height);
    const cam = this.camComp;
    const a = cam.screenToWorld(sx, sy, cam.nearClip);
    const b = cam.screenToWorld(sx, sy, cam.farClip);
    return new pc.Ray(a.clone(), new pc.Vec3().sub2(b, a).normalize());
  }
  _entAabb(entity) {
    let aabb = null;
    for (const r of entity.findComponents("render")) {
      for (const mi of r.meshInstances || []) { if (!aabb) aabb = mi.aabb.clone(); else aabb.add(mi.aabb); }
    }
    return aabb;
  }
  _pickPiece(clientX, clientY) {
    const ray = this._screenRay(clientX, clientY);
    if (!ray) return null;
    const hit = new pc.Vec3();
    let best = null, bestT = Infinity;
    for (const p of this.placed) {
      if (!p.entity) continue;
      const aabb = this._entAabb(p.entity);
      if (aabb && aabb.intersectsRay(ray, hit)) { const t = hit.distance(ray.origin); if (t < bestT) { bestT = t; best = p; } }
    }
    return best;
  }

  _wireKeys() {
    this._onKey = (e) => {
      const k = e.key, ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && (k === "z" || k === "Z") && !e.shiftKey) { e.preventDefault(); this._doUndo(); }
      else if (ctrl && ((k === "y" || k === "Y") || (e.shiftKey && (k === "z" || k === "Z")))) { e.preventDefault(); this._doRedo(); }
      else if (ctrl && (k === "d" || k === "D")) { e.preventDefault(); this._duplicate(); }
      else if (ctrl && (k === "c" || k === "C")) { e.preventDefault(); this._copy(); }
      else if (ctrl && (k === "v" || k === "V")) { e.preventDefault(); this._paste(); }
      else if (k === "Escape") { this.brush = null; this._syncBrushButtons(); this._select(null); this._status("Deselected."); }
      else if (k === "Delete" || k === "Backspace") { this._deleteSelected(); }
      else if (k === "e" || k === "E") { this._export(); }
      else if (k === "q" || k === "Q") { this._rotateSel(-1); }
      else if (k === "r" || k === "R") { this._rotateSel(1); } // E is export; use R for clockwise rotate
      else if (k === "f" || k === "F") { this._snapToFloor(); }
      else if (k === "PageUp") { e.preventDefault(); this._raiseSel(this.snapPos > 0 ? this.snapPos : 0.25); }
      else if (k === "PageDown") { e.preventDefault(); this._raiseSel(-(this.snapPos > 0 ? this.snapPos : 0.25)); }
      else if (k === "x" || k === "X") { this._axis = "x"; this._status("Axis lock: X"); }
      else if (k === "z" || k === "Z") { this._axis = "z"; this._status("Axis lock: Z"); }
    };
    this._onKeyUp = (e) => { const k = (e.key || "").toLowerCase(); if ((k === "x" && this._axis === "x") || (k === "z" && this._axis === "z")) { this._axis = null; this._status("Axis lock off."); } };
    window.addEventListener("keydown", this._onKey);
    window.addEventListener("keyup", this._onKeyUp);
  }

  _hideGameHud() {
    try {
      const h = document.getElementById("mission-hud");
      if (h) { this._hiddenHud = h; h.style.display = "none"; }
      // Bulletproof: persistent !important rule keeps the game HUD hidden even if it is
      // (re)created or re-shown after this runs — the editor owns the screen in ?artEdit mode.
      if (!document.getElementById("fbHideHud")) {
        const st = document.createElement("style");
        st.id = "fbHideHud";
        st.textContent = "#mission-hud{display:none!important}";
        (document.head || document.documentElement).appendChild(st);
      }
      // Hide the global Inventory/Forge (loot) panel — it lives OUTSIDE #mission-hud.
      const lp = (typeof window !== "undefined") && window.OSSARA && window.OSSARA.lootSkeletonPanel;
      if (lp) { if (lp.toggleButton) lp.toggleButton.style.display = "none"; if (lp.root) lp.root.style.display = "none"; }
      // The game Free Cam button lived inside the now-hidden HUD; give the editor its own.
      if (!document.getElementById("fbFreeCam")) {
        const b = document.createElement("button");
        b.id = "fbFreeCam";
        b.textContent = "Free Cam: Off";
        b.style.cssText = "position:fixed;right:12px;bottom:12px;z-index:100000;padding:9px 14px;font:12px ui-monospace,Menlo,Consolas,monospace;background:rgba(10,14,10,.94);color:#cfe0c4;border:1px solid #2c382c;border-radius:6px;cursor:pointer";
        b.onclick = () => { try { const on = typeof this.r.toggleFreeCam === "function" ? this.r.toggleFreeCam() : false; b.textContent = on ? "Free Cam: On" : "Free Cam: Off"; b.style.borderColor = on ? "#7bd86b" : "#2c382c"; } catch (_) {} };
        document.body.appendChild(b);
      }
    } catch (_) {}
  }

  _makeHighlight() {
    try {
      const m = new pc.StandardMaterial();
      m.useLighting = false; m.emissive = new pc.Color(0.2, 0.7, 0.4); m.diffuse = new pc.Color(0, 0, 0);
      m.opacity = 0.2; m.blendType = pc.BLEND_NORMAL; m.depthWrite = false; m.cull = pc.CULLFACE_NONE; m.update();
      this._hlMat = m; this._hls = [];
    } catch (e) { this._hlMat = null; this._hls = []; }
  }
  _hlBox(i) {
    if (!this._hls[i]) { const b = this._box(this._hlMat); b.name = "build-highlight-" + i; b.enabled = false; this.app.root.addChild(b); this._hls[i] = b; }
    return this._hls[i];
  }
  _updateHighlight() {
    if (!this._hlMat) return;
    const list = (this.sel && this.sel.length) ? this.sel : (this.selected ? [this.selected] : []);
    let n = 0;
    for (const p of list) {
      if (!p || !p.entity) continue;
      const aabb = this._entAabb(p.entity);
      if (!aabb) continue;
      const c = aabb.center, h = aabb.halfExtents, pad = 0.35;
      const b = this._hlBox(n++);
      b.setPosition(c.x, c.y, c.z);
      b.setLocalScale(h.x * 2 + pad, h.y * 2 + pad, h.z * 2 + pad);
      b.enabled = true;
    }
    for (let i = n; i < this._hls.length; i++) if (this._hls[i]) this._hls[i].enabled = false;
  }

  // ---- UI -----------------------------------------------------------------
  _injectStyle() {
    if (document.getElementById("fb-build-style")) return;
    const s = document.createElement("style"); s.id = "fb-build-style";
    s.textContent = [
      "#fbBuild{position:fixed;top:0;left:0;width:230px;max-height:100vh;overflow:auto;z-index:99999;background:rgba(10,14,10,.94);color:#cfe0c4;font:12px ui-monospace,Menlo,Consolas,monospace;border-right:1px solid #2c382c;padding:8px}",
      "#fbBuild h3{margin:2px 0 6px;color:#7bd86b;font-size:12px}",
      "#fbBuild .sec{color:#c9a24a;text-transform:uppercase;font-size:10px;margin:10px 0 4px;letter-spacing:.08em}",
      "#fbBuild .hint{color:#8aa185;font-size:10px;line-height:1.35;margin:2px 0}",
      "#fbBuild button{display:block;width:100%;text-align:left;margin:2px 0;background:#1b231b;color:#cfe0c4;border:1px solid #2c382c;border-radius:5px;padding:5px 7px;cursor:pointer;font:inherit}",
      "#fbBuild button:hover{border-color:#7bd86b}#fbBuild button.on{background:#26331f;border-color:#7bd86b;color:#7bd86b}#fbBuild button:disabled{opacity:.4;cursor:default}",
      "#fbBuild .row{display:flex;gap:4px}#fbBuild .row button{width:auto;flex:1;text-align:center}",
      "#fbBuild label{display:flex;align-items:center;gap:6px;margin:3px 0;font-size:11px}",
      "#fbBuild input[type=number]{width:58px;background:#0a0d0a;border:1px solid #2c382c;color:#cfe0c4;border-radius:4px;padding:2px 4px;font:inherit}",
      "#fbBuild .insp label span{width:34px;color:#8aa185}",
      "#fbList{max-height:130px;overflow:auto;border:1px solid #2c382c;border-radius:5px;padding:3px;margin-top:3px}",
      "#fbList .it{display:flex;gap:3px;align-items:center;font-size:11px}#fbList .it span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      "#fbList .it.sel{color:#c9a24a}#fbList .it button{width:auto;margin:0;padding:1px 5px}",
      "#fbWarn{color:#d8736b;font-size:11px;min-height:14px;margin:3px 0}",
      "#fbStatus{position:fixed;bottom:0;left:0;right:0;z-index:99999;background:rgba(10,14,10,.94);color:#7bd86b;font:12px ui-monospace,monospace;padding:5px 10px;border-top:1px solid #2c382c}",
      "#fbBuild .exp{background:#2a3a22;border-color:#7bd86b;color:#a7f08b;text-align:center}",
    ].join("\n");
    document.head.appendChild(s);
  }

  _buildUI() {
    const wrap = document.createElement("div"); wrap.id = "fbBuild";
    wrap.innerHTML = [
      '<h3>BUILD LAB &middot; 3D editor</h3>',
      '<div class="row"><button id="fbUndo">Undo</button><button id="fbRedo">Redo</button></div>',
      '<div class="sec">Tool</div>',
      '<div class="row" id="fbModes"><button data-m="move" class="on">Move(drag)</button><button data-m="rotate">Rotate</button><button data-m="scale">Scale</button></div>',
      '<div class="hint">Move = drag a piece across the map. Q/R rotate &middot; PgUp/PgDn raise/lower &middot; F snap-to-floor &middot; hold X / Z to lock axis.</div>',
      '<div class="sec">Soft snap (optional)</div>',
      '<div class="row"><button id="fbSnapPos">pos: off</button><button id="fbSnapRot">rot: off</button></div>',
      '<button id="fbFloor">Snap selected to floor (F)</button>',
      '<div class="sec">Place height <span id="fbY">1.3</span></div>',
      '<div class="row"><button id="fbYdn">- lower</button><button id="fbYup">+ raise</button></div>',
      '<div class="sec">Overlays</div>',
      '<label><input type="checkbox" id="fbOvRoute"> routes</label>',
      '<label><input type="checkbox" id="fbOvReserve"> ward/gate reserves</label>',
      '<label><input type="checkbox" id="fbOvProt"> protected (no-prop)</label>',
      '<div class="sec">Inspector</div><div class="insp" id="fbInsp">- nothing selected -</div>',
      '<div id="fbWarn"></div>',
      '<button id="fbCopySel">Copy placement JSON</button>',
      '<button id="fbDel">Delete selected (Del)</button>',
      '<div class="sec">Models</div><div id="fbPalette"></div>',
      '<div class="sec">Placed (<span id="fbCount">0</span>)</div><div id="fbList"></div>',
      '<div class="sec">Save / load</div>',
      '<button id="fbExport" class="exp">Export kit JSON (E)</button>',
      '<button id="fbImport">Import kit JSON...</button>',
      '<input type="file" id="fbImportFile" accept="application/json" style="display:none">',
    ].join("");
    document.body.appendChild(wrap);
    const status = document.createElement("div"); status.id = "fbStatus"; status.textContent = "Build lab loading...";
    document.body.appendChild(status);
    this._ui = { wrap, status };

    const pal = wrap.querySelector("#fbPalette");
    for (const p of FB_BUILD_PALETTE) {
      const b = document.createElement("button"); b.textContent = p.label; b.dataset.asset = p.asset;
      b.onclick = () => { this.brush = p.asset; this._select(null); this._syncBrushButtons(); this._status("Click the map to place: " + p.label + ". (Esc to cancel)"); };
      pal.appendChild(b);
    }
    wrap.querySelectorAll("#fbModes button").forEach((b) => { b.onclick = () => this._setMode(b.dataset.m); });
    wrap.querySelector("#fbUndo").onclick = () => this._doUndo();
    wrap.querySelector("#fbRedo").onclick = () => this._doRedo();
    wrap.querySelector("#fbSnapPos").onclick = (ev) => { this.snapPos = this.snapPos === 0 ? 0.25 : this.snapPos === 0.25 ? 0.5 : this.snapPos === 0.5 ? 1 : 0; ev.target.textContent = "pos: " + (this.snapPos || "off"); this._applyGizmoSnap(); };
    wrap.querySelector("#fbSnapRot").onclick = (ev) => { this.snapRot = this.snapRot === 0 ? 15 : this.snapRot === 15 ? 45 : this.snapRot === 45 ? 90 : 0; ev.target.textContent = "rot: " + (this.snapRot ? this.snapRot : "off"); this._applyGizmoSnap(); };
    wrap.querySelector("#fbFloor").onclick = () => this._snapToFloor();
    wrap.querySelector("#fbYup").onclick = () => { this.placeY += 0.2; wrap.querySelector("#fbY").textContent = this.placeY.toFixed(1); };
    wrap.querySelector("#fbYdn").onclick = () => { this.placeY = Math.max(0, this.placeY - 0.2); wrap.querySelector("#fbY").textContent = this.placeY.toFixed(1); };
    wrap.querySelector("#fbOvRoute").onchange = (ev) => this._toggleOverlay("route", new pc.Color(0.2, 0.7, 1.0), ev.target.checked);
    wrap.querySelector("#fbOvReserve").onchange = (ev) => this._toggleOverlay("reserve", new pc.Color(1.0, 0.65, 0.2), ev.target.checked);
    wrap.querySelector("#fbOvProt").onchange = (ev) => this._toggleOverlay("protected", new pc.Color(0.9, 0.25, 0.25), ev.target.checked);
    wrap.querySelector("#fbCopySel").onclick = () => this._copySelectedJson();
    wrap.querySelector("#fbDel").onclick = () => this._deleteSelected();
    wrap.querySelector("#fbExport").onclick = () => this._export();
    wrap.querySelector("#fbImport").onclick = () => wrap.querySelector("#fbImportFile").click();
    wrap.querySelector("#fbImportFile").onchange = (ev) => { const f = ev.target.files && ev.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => this._import(String(rd.result)); rd.readAsText(f); ev.target.value = ""; };
    this._syncHistButtons();
  }

  _refreshInspector() {
    if (!this._ui) return;
    const el = this._ui.wrap.querySelector("#fbInsp");
    const warn = this._ui.wrap.querySelector("#fbWarn");
    const p = this.selected;
    if (!p) { el.textContent = "- nothing selected -"; if (warn) warn.textContent = ""; return; }
    const e = p.entity, pos = e.getPosition(), rot = e.getLocalEulerAngles(), sc = e.getLocalScale();
    const f = (n) => (Math.round(n * 100) / 100);
    el.innerHTML = [
      '<div style="color:#8aa185;margin-bottom:3px">' + p.asset + '</div>',
      '<label><span>X</span><input type="number" step="0.25" id="ipx" value="' + f(pos.x) + '"></label>',
      '<label><span>Y</span><input type="number" step="0.1" id="ipy" value="' + f(pos.y) + '"></label>',
      '<label><span>Z</span><input type="number" step="0.25" id="ipz" value="' + f(pos.z) + '"></label>',
      '<label><span>RotY</span><input type="number" step="15" id="ipr" value="' + Math.round(rot.y) + '"></label>',
      '<label><span>Scale</span><input type="number" step="0.05" id="ips" value="' + f(sc.x) + '"></label>',
    ].join("");
    const apply = () => {
      const before = this._snapshot(p);
      const nx = +el.querySelector("#ipx").value, ny = +el.querySelector("#ipy").value, nz = +el.querySelector("#ipz").value;
      const nr = +el.querySelector("#ipr").value, ns = Math.max(0.05, +el.querySelector("#ips").value);
      e.setPosition(nx, ny, nz); e.setLocalEulerAngles(0, nr, 0); e.setLocalScale(ns, ns, ns);
      const after = this._snapshot(p);
      if (!this._sameSnap(before, after)) this._pushUndo({ undo: () => { this._applySnap(p, before); this._select(p); }, redo: () => { this._applySnap(p, after); this._select(p); } });
      this._updateHighlight();
      if (warn) warn.textContent = this._overlapWarn();
    };
    el.querySelectorAll("input").forEach((inp) => { inp.onchange = apply; });
    if (warn) warn.textContent = this._overlapWarn();
  }

  _syncBrushButtons() { if (this._ui) this._ui.wrap.querySelectorAll("#fbPalette button").forEach((b) => b.classList.toggle("on", b.dataset.asset === this.brush)); }
  _syncModeButtons() { if (this._ui) this._ui.wrap.querySelectorAll("#fbModes button").forEach((b) => b.classList.toggle("on", b.dataset.m === this.mode)); }
  _syncHistButtons() { if (!this._ui) return; this._ui.wrap.querySelector("#fbUndo").disabled = !this._undo.length; this._ui.wrap.querySelector("#fbRedo").disabled = !this._redo.length; }
  _refreshList() {
    if (!this._ui) return;
    const list = this._ui.wrap.querySelector("#fbList");
    this._ui.wrap.querySelector("#fbCount").textContent = String(this.placed.length);
    list.innerHTML = "";
    this.placed.forEach((p, i) => {
      const row = document.createElement("div"); row.className = "it" + (p === this.selected ? " sel" : "");
      const name = document.createElement("span"); name.textContent = i + ". " + p.asset;
      const sel = document.createElement("button"); sel.textContent = "sel"; sel.onclick = () => this._select(p);
      const del = document.createElement("button"); del.textContent = "x"; del.onclick = () => { this._select(p); this._deleteSelected(); };
      row.appendChild(name); row.appendChild(sel); row.appendChild(del); list.appendChild(row);
    });
  }
  _status(msg) { if (this._ui) this._ui.status.textContent = msg; }
}
