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
import { preloadKit, place, kitReady } from "./dungeonKit.js";
import { gridToWorld, pathCellSet, expandRects } from "../sim/pathing.js";
import { surfaceHeightAtCell } from "../config/firstBreachGrid.js";
import { protectedGameplayCellSet } from "../mapbuilder/mapValidation.js";
import { FB_BUILD_PALETTE, FB_PALETTE_ASSET_NAMES, FB_ASSET_CAT } from "./firstBreachKitPalette.js";
import { FB_ASSET_MANIFEST, FB_ASSET_CATEGORIES } from "./fbAssetManifest.js";

// manifest category -> kit category (drives shadows + test guards for placed pieces)
const MCAT_TO_KIT = { walls: "wall", floors: "floor", stairs: "stair", lights: "light", rubble: "rubble", pillars: "pillar", wood: "balcony" };
const MANIFEST_BY_NAME = new Map(FB_ASSET_MANIFEST.map((e) => [e.name, e]));
const kitCatFor = (asset) => FB_ASSET_CAT[asset] || MCAT_TO_KIT[MANIFEST_BY_NAME.get(asset)?.cat] || "prop";
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
    this._vert = false;     // hold V -> drag moves the selection vertically
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
    this._setupEditorView();
    this._makeHighlight();
    this._onTick = () => { this._updateHighlight(); this._keepEditorView(); };
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
    return { asset: piece.asset, cat: piece.cat, x: p.x, y: p.y, z: p.z, ry: a.y, scale: s.x, sy: s.y, sz: s.z };
  }
  _spawn(spec) {
    const ent = place(this.app, this.root, spec.asset, { x: spec.x, y: spec.y, z: spec.z, ry: spec.ry, scale: spec.scale, sy: spec.sy, sz: spec.sz });
    if (!ent) return null;
    ent.name = "build-" + this.placed.length;
    const piece = { entity: ent, asset: spec.asset, cat: spec.cat || kitCatFor(spec.asset) };
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

  _autoSave() {
    try { localStorage.setItem("fbBuildSave", JSON.stringify(this._specsForExport())); this._markSaved(); } catch (_) {}
  }
  _markSaved() {
    if (!this._ui) return;
    const el = this._ui.wrap.querySelector("#fbSavedTop");
    if (el) el.textContent = "saved locally " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  _resetToMap() {
    try { localStorage.removeItem("fbBuildSave"); } catch (_) {}
    this._status("Local save cleared - reloading the deployed map...");
    setTimeout(() => { try { location.reload(); } catch (_) {} }, 400);
  }
  _wrapPlatforms() {
    // Auto-lay stone foundation faces around every raised-platform edge (drop >= ~0.6).
    const cols = this.level.cols, rows = this.level.rows;
    const H = (c, r) => { if (c < 0 || r < 0 || c >= cols || r >= rows) return 0; let v = 0; try { v = surfaceHeightAtCell(c, r); } catch (_) {} return Number.isFinite(v) ? v : 0; };
    const dirs = [[0, 1, 0], [0, -1, 180], [1, 0, 90], [-1, 0, 270]]; // [dc, dr, ry] -> face points at the drop
    const specs = [];
    outer: for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const h = H(c, r);
      if (h < 2 || h >= 5) continue; // only raised PLATFORMS (~2.6 / dais 3) - exclude the base floor (1.3) AND the perimeter walls (7.2)
      for (const [dc, dr, ry] of dirs) {
        if (H(c + dc, r + dr) < h - 0.6) {
          const w = gridToWorld(c, r, this.level);
          specs.push({ asset: "floor_foundation_front", cat: "wall", x: w.x, y: +(h - 2).toFixed(2), z: w.z, ry, scale: 1 });
          if (specs.length >= 320) break outer;
        }
      }
    }
    if (!specs.length) { this._status("No raised platform edges found to wrap."); return; }
    let made = specs.map((sp) => this._spawn(sp)).filter(Boolean);
    this._selectMany(made);
    this._pushUndo({ undo: () => { for (const p of [...made]) this._remove(p); made = []; }, redo: () => { made = specs.map((sp) => this._spawn(sp)).filter(Boolean); this._selectMany(made); } });
    this._status("Wrapped " + made.length + " platform edges with stone faces. Ctrl+Z to undo - then tweak/rotate any that face wrong.");
  }
  _tileFloor() {
    // Lay KayKit stone floor tiles (4x4) across the walkable floor + platforms (the real KayKit stone look).
    const cols = this.level.cols, rows = this.level.rows;
    const H = (c, r) => { if (c < 0 || r < 0 || c >= cols || r >= rows) return 0; let v = 0; try { v = surfaceHeightAtCell(c, r); } catch (_) {} return Number.isFinite(v) ? v : 0; };
    const specs = [];
    outer: for (let r = 2; r < rows; r += 4) for (let c = 2; c < cols; c += 4) {
      const h = H(c, r);
      if (h < 0.5 || h >= 5) continue; // walkable floor + platforms only (skip void / perimeter walls)
      const w = gridToWorld(c, r, this.level);
      const ry = ((Math.floor(c / 4) + Math.floor(r / 4)) % 4) * 90; // vary rotation to break up repetition
      specs.push({ asset: "floor_tile_large", cat: "floor", x: w.x, y: +(h + 0.01).toFixed(2), z: w.z, ry, scale: 1 });
      if (specs.length >= 320) break outer;
    }
    if (!specs.length) { this._status("No floor area found to tile."); return; }
    let made = specs.map((sp) => this._spawn(sp)).filter(Boolean);
    this._selectMany(made);
    this._pushUndo({ undo: () => { for (const p of [...made]) this._remove(p); made = []; }, redo: () => { made = specs.map((sp) => this._spawn(sp)).filter(Boolean); this._selectMany(made); } });
    this._status("Tiled the floor with " + made.length + " KayKit stone tiles. Ctrl+Z to undo.");
  }
  _fixSavedHeights() {
    // After a map re-tier, pieces saved against the OLD ground sit buried inside the new,
    // taller terrain. Re-seat them: pieces that stood ON a raised surface rise with it;
    // ground-level wall skins stay grounded. One undo restores everything.
    const OLD_OF = { 8.6: 7.2, 5.6: 4.3, 4: 3, 3.6: 2.6, 2.8: 1.9, 2.2: 1.6 }; // current -> pre-re-tier surface
    const moved = [];
    for (const p of this.placed) {
      if (!p.entity) continue;
      const pos = p.entity.getPosition();
      const g = worldToGrid(pos.x, pos.z, this.level);
      let cur = 0; try { cur = surfaceHeightAtCell(g.col, g.row); } catch (_) {}
      const old = OLD_OF[cur];
      if (old == null) continue;                       // unchanged tier
      const delta = cur - old;
      if (!(delta > 0)) continue;
      if (pos.y <= old - 0.75) continue;               // grounded skins (e.g. y=0 wall courses) stay put
      moved.push({ piece: p, before: this._snapshot(p) });
      p.entity.setPosition(pos.x, pos.y + delta, pos.z);
    }
    if (!moved.length) { this._status("Nothing needed lifting — heights already match the map."); return; }
    const after = moved.map((m) => this._snapshot(m.piece));
    this._pushUndo({ undo: () => { moved.forEach((m) => this._applySnap(m.piece, m.before)); this._updateHighlight(); this._refreshInspector(); }, redo: () => { moved.forEach((m, i) => this._applySnap(m.piece, after[i])); this._updateHighlight(); this._refreshInspector(); } });
    this._updateHighlight(); this._refreshInspector();
    this._status("Lifted " + moved.length + " saved pieces onto the re-tiered ground (Ctrl+Z undoes all).");
  }
  _addRailings() {
    // Wood railings along raised edges — the "balcony" treatment: rims of platforms and the
    // low walls that ring them. Run-based so fences never overlap (barrier pieces are 4 long).
    const cols = this.level.cols, rows = this.level.rows;
    const H = (c, r) => { if (c < 0 || r < 0 || c >= cols || r >= rows) return 0; let v = 0; try { v = surfaceHeightAtCell(c, r); } catch (_) {} return Number.isFinite(v) ? v : 0; };
    const DIRS4 = [[0, 1, "S"], [0, -1, "N"], [1, 0, "E"], [-1, 0, "W"]];
    const rims = { N: new Map(), S: new Map(), E: new Map(), W: new Map() };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const h = H(c, r);
      if (h < 2 || h >= 5) continue;
      for (const [dc, dr, name] of DIRS4) {
        if (!(H(c + dc, r + dr) < h - 0.6)) continue;
        const horiz = name === "N" || name === "S";
        const line = horiz ? r : c, along = horiz ? c : r;
        if (!rims[name].has(line)) rims[name].set(line, []);
        rims[name].get(line).push(along);
      }
    }
    const specs = [];
    for (const name of ["N", "S", "E", "W"]) {
      const horiz = name === "N" || name === "S", off = 0.34;
      for (const [line, alongs] of rims[name]) {
        alongs.sort((a, b) => a - b);
        let run = [];
        const flush = () => {
          if (run.length >= 3) {
            const from = run[0], to = run[run.length - 1];
            let t = from + 1.5, i = 0;
            for (; t <= to - 1.5; t += 4, i++) {
              const c2 = horiz ? t : line + (name === "E" ? off : -off);
              const r2 = horiz ? line + (name === "S" ? off : -off) : t;
              const h2 = horiz ? H(Math.round(t), line) : H(line, Math.round(t));
              const w = gridToWorld(c2, r2, this.level);
              specs.push({ asset: i % 2 ? "barrier_column" : "barrier", cat: "balcony", x: w.x, y: h2, z: w.z, ry: horiz ? 0 : 90, scale: 1 });
            }
            if (to + 1 - (t - 0.5) >= 1) {
              const c2 = horiz ? to - 0.5 : line + (name === "E" ? off : -off);
              const r2 = horiz ? line + (name === "S" ? off : -off) : to - 0.5;
              const h2 = horiz ? H(Math.round(to - 1), line) : H(line, Math.round(to - 1));
              const w = gridToWorld(c2, r2, this.level);
              specs.push({ asset: "barrier_half", cat: "balcony", x: w.x, y: h2, z: w.z, ry: horiz ? 0 : 90, scale: 1 });
            }
          }
          run = [];
        };
        for (const a of alongs) { if (run.length && a !== run[run.length - 1] + 1) flush(); run.push(a); }
        flush();
      }
    }
    if (!specs.length) { this._status("No raised edges found for railings."); return; }
    let made = specs.map((sp) => this._spawn(sp)).filter(Boolean);
    this._selectMany(made);
    this._pushUndo({ undo: () => { for (const p of [...made]) this._remove(p); made = []; }, redo: () => { made = specs.map((sp) => this._spawn(sp)).filter(Boolean); this._selectMany(made); } });
    this._status("Railed " + made.length + " edge pieces (wood). Ctrl+Z undoes the whole set.");
  }
  _scatterClutter() {
    // Fling rocks/rubble/barrels along wall bases + map edges at random angle + jitter to break the grid read.
    const cols = this.level.cols, rows = this.level.rows;
    const H = (c, r) => { if (c < 0 || r < 0 || c >= cols || r >= rows) return 0; let v = 0; try { v = surfaceHeightAtCell(c, r); } catch (_) {} return Number.isFinite(v) ? v : 0; };
    const prot = this._protSet || new Set();
    let route = new Set(); try { route = pathCellSet(this.level); } catch (_) {}
    const pool = ["rocks_small", "rocks_small", "rubble_half", "rubble_large", "barrel_small", "barrel_large", "barrel_small_stack"];
    const specs = [];
    outer: for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const h = H(c, r);
      if (h < 0.5 || h >= 5) continue; // walkable floor/platforms only
      const key = c + "," + r;
      if (prot.has(key) || route.has(key)) continue; // keep lanes + objectives clear
      let edge = false;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nh = H(c + dc, r + dr); if (nh > h + 1 || nh === 0) { edge = true; break; } } // next to a wall/drop
      if (!edge) continue;
      if (Math.random() > 0.32) continue; // sparse
      const w = gridToWorld(c, r, this.level);
      const asset = pool[(Math.random() * pool.length) | 0];
      specs.push({ asset, cat: "rubble", x: +(w.x + (Math.random() - 0.5) * 0.5).toFixed(2), y: h, z: +(w.z + (Math.random() - 0.5) * 0.5).toFixed(2), ry: Math.floor(Math.random() * 360), scale: +(0.8 + Math.random() * 0.5).toFixed(2) });
      if (specs.length >= 160) break outer;
    }
    if (!specs.length) { this._status("No edge cells found to clutter."); return; }
    let made = specs.map((sp) => this._spawn(sp)).filter(Boolean);
    this._selectMany(made);
    this._pushUndo({ undo: () => { for (const p of [...made]) this._remove(p); made = []; }, redo: () => { made = specs.map((sp) => this._spawn(sp)).filter(Boolean); this._selectMany(made); } });
    this._status("Scattered " + made.length + " clutter pieces. Ctrl+Z to undo (or undo + click again to re-roll).");
  }
  _seedFromKit() {
    // Prefer the local in-editor save (survives reloads without re-baking); fall back to the deployed kit.
    let specs = null, fromSave = false;
    try { const raw = localStorage.getItem("fbBuildSave"); if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr) && arr.length) { specs = arr.map((s) => { const w = gridToWorld(s.col, s.row, this.level); return { ...s, x: w.x, z: w.z }; }); fromSave = true; } } } catch (_) {}
    if (!specs) { try { specs = firstBreachKitSpecs(this.level); } catch (_) { specs = []; } }
    for (const s of specs) {
      const ent = place(this.app, this.root, s.asset, { x: s.x, y: s.y, z: s.z, ry: s.ry, scale: s.scale, sy: s.sy, sz: s.sz });
      if (!ent) continue;
      ent.name = "build-" + s.id;
      this.placed.push({ entity: ent, asset: s.asset, cat: s.cat || kitCatFor(s.asset) });
    }
    this._refreshList();
    this._status(fromSave ? ("Restored your local save: " + this.placed.length + " pieces. ('Reset to deployed map' to discard.)") : ("Loaded " + this.placed.length + " pieces from the deployed map."));
  }

  _placeAt(asset, col, row, y) {
    const w = gridToWorld(col, row, this.level);
    const piece = this._spawn({ asset, cat: kitCatFor(asset), x: w.x, y, z: w.z, ry: 0, scale: 1 });
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
  _pushUndo(entry) { this._undo.push(entry); if (this._undo.length > 50) this._undo.shift(); this._redo.length = 0; this._syncHistButtons(); this._autoSave(); }
  _doUndo() { const e = this._undo.pop(); if (!e) { this._status("Nothing to undo."); return; } e.undo(); this._redo.push(e); this._syncHistButtons(); this._status("Undid."); this._autoSave(); }
  _doRedo() { const e = this._redo.pop(); if (!e) { this._status("Nothing to redo."); return; } e.redo(); this._undo.push(e); this._syncHistButtons(); this._status("Redid."); this._autoSave(); }
  _snapshot(piece) { const e = piece.entity; return { pos: e.getLocalPosition().clone(), rot: e.getLocalEulerAngles().clone(), scale: e.getLocalScale().clone() }; }
  _applySnap(piece, s) { const e = piece.entity; e.setLocalPosition(s.pos.x, s.pos.y, s.pos.z); e.setLocalEulerAngles(s.rot.x, s.rot.y, s.rot.z); e.setLocalScale(s.scale.x, s.scale.y, s.scale.z); }
  _sameSnap(a, b) { return a.pos.equals(b.pos) && a.rot.equals(b.rot) && a.scale.equals(b.scale); }

  // ---- export / import ----------------------------------------------------
  _specsForExport() {
    const cx = (this.level.cols - 1) / 2, cz = (this.level.rows - 1) / 2;
    return this.placed.map((p, i) => {
      const w = p.entity.getPosition(), e = p.entity.getLocalEulerAngles(), s = p.entity.getLocalScale();
      const o = { id: p.cat + "-" + i, asset: p.asset, col: Math.round(w.x + cx), row: Math.round(w.z + cz), y: +w.y.toFixed(2), ry: Math.round(((e.y % 360) + 360) % 360), scale: +s.x.toFixed(3), cat: p.cat };
      if (Math.abs(s.y - s.x) > 1e-3) o.sy = +s.y.toFixed(3);
      if (Math.abs(s.z - s.x) > 1e-3) o.sz = +s.z.toFixed(3);
      return o;
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
    if (Math.abs(s.y - s.x) > 1e-3) spec.sy = +s.y.toFixed(3);
    if (Math.abs(s.z - s.x) > 1e-3) spec.sz = +s.z.toFixed(3);
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
    this._autoSave();
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
        const items = this.sel.map((pc) => { const c = pc.entity.getPosition(); return { piece: pc, before: this._snapshot(pc), offX: sp ? c.x - sp.x : 0, offZ: sp ? c.z - sp.z : 0, startY: c.y }; });
        this._drag = { items, refY: piece.entity.getPosition().y, startScreenY: e.clientY, moved: false };
        e.stopPropagation(); e.preventDefault(); // don't orbit the camera while dragging
      }
    };
    this._onMove = (e) => {
      if (!this._drag) return;
      if (this._vert) { // hold V: drag up/down moves the whole selection vertically
        const dy = (this._drag.startScreenY - e.clientY) * 0.06;
        for (const it of this._drag.items) {
          const cur = it.piece.entity.getPosition();
          let ny = it.startY + dy;
          if (this.snapPos > 0) ny = Math.round(ny / this.snapPos) * this.snapPos;
          it.piece.entity.setPosition(cur.x, ny, cur.z);
        }
        this._drag.moved = true; this._updateHighlight(); e.stopPropagation(); return;
      }
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
      if (p.cat === "floor" || p.cat === "wrap") continue; // ground carpet: select via the Scene list, so drags orbit the camera
      const aabb = this._entAabb(p.entity);
      if (aabb && aabb.intersectsRay(ray, hit)) { const t = hit.distance(ray.origin); if (t < bestT) { bestT = t; best = p; } }
    }
    return best;
  }

  _wireKeys() {
    this._onKey = (e) => {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return; // don't hijack typing in the inspector
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
      else if (k === "ArrowLeft") { e.preventDefault(); this._nudge(-(this.snapPos > 0 ? this.snapPos : 0.5), 0); }
      else if (k === "ArrowRight") { e.preventDefault(); this._nudge(this.snapPos > 0 ? this.snapPos : 0.5, 0); }
      else if (k === "ArrowUp") { e.preventDefault(); this._nudge(0, -(this.snapPos > 0 ? this.snapPos : 0.5)); }
      else if (k === "ArrowDown") { e.preventDefault(); this._nudge(0, this.snapPos > 0 ? this.snapPos : 0.5); }
      else if (k === "x" || k === "X") { this._axis = "x"; this._status("Axis lock: X"); }
      else if (k === "z" || k === "Z") { this._axis = "z"; this._status("Axis lock: Z"); }
      else if (k === "v" || k === "V") { this._vert = true; this._status("Vertical: hold V and drag a piece up/down."); }
    };
    this._onKeyUp = (e) => { const k = (e.key || "").toLowerCase(); if ((k === "x" && this._axis === "x") || (k === "z" && this._axis === "z")) { this._axis = null; this._status("Axis lock off."); } if (k === "v") this._vert = false; };
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

  _setupEditorView() {
    // Editor = free-fly no-clip camera; character + game input are gone in ?artEdit mode.
    try { if (this.r && !this.r.freeCam && typeof this.r.toggleFreeCam === "function") this.r.toggleFreeCam(); } catch (_) {}
    this._keepEditorView();
  }
  _keepEditorView() {
    // hero loads async / camera can snap back -> keep it hidden each tick (cheap + idempotent)
    try { if (this.r && this.r.heroEntity && this.r.heroEntity.enabled) this.r.heroEntity.enabled = false; } catch (_) {}
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
      // ---- pro docked shell (Build Lab v3) ----
      "#fbTop{position:fixed;top:0;left:0;right:0;height:38px;z-index:99999;background:#16181c;border-bottom:1px solid #2a2d33;display:flex;align-items:center;gap:6px;padding:0 8px;color:#c8cdd4;font:12px ui-monospace,Menlo,Consolas,monospace;overflow:visible}",
      "#fbTop .grp{display:flex;gap:3px;align-items:center;padding:0 6px;border-right:1px solid #24272d;position:relative}",
      "#fbTop button{background:#1e2126;color:#c8cdd4;border:1px solid #2c3038;border-radius:4px;padding:4px 8px;cursor:pointer;font:inherit;white-space:nowrap}",
      "#fbTop button:hover{border-color:#7bd86b}#fbTop button.on{background:#26331f;border-color:#7bd86b;color:#7bd86b}",
      "#fbTop .menu{display:none;position:absolute;top:34px;left:0;background:#1a1d22;border:1px solid #2c3038;border-radius:6px;padding:6px;min-width:230px;z-index:100000;box-shadow:0 8px 22px rgba(0,0,0,.5)}",
      "#fbTop .menu.open{display:block}#fbTop .menu button{display:block;width:100%;text-align:left;margin:2px 0}",
      "#fbTop .menu label{display:flex;gap:6px;align-items:center;margin:3px 2px;font-size:11px;color:#aab2bc}",
      "#fbTop .brand{color:#7bd86b;font-weight:bold;letter-spacing:.06em;padding-right:8px}",
      "#fbSavedTop{color:#6f7a86;font-size:10px;margin-left:auto;padding-right:6px}",
      "#fbLeft{position:fixed;top:38px;left:0;bottom:210px;width:212px;z-index:99998;background:rgba(18,20,24,.96);border-right:1px solid #2a2d33;color:#c8cdd4;font:11px ui-monospace,monospace;display:flex;flex-direction:column}",
      "#fbLeft h4,#fbRight h4{margin:0;padding:7px 9px 5px;font-size:10px;letter-spacing:.1em;color:#8b95a1;text-transform:uppercase;border-bottom:1px solid #23262c}",
      "#fbFilter{margin:6px 8px;background:#101216;border:1px solid #2c3038;color:#c8cdd4;border-radius:4px;padding:4px 6px;font:inherit}",
      "#fbList{flex:1;overflow-y:auto;padding:2px 4px}",
      "#fbList .it{display:flex;gap:4px;align-items:center;padding:2px 5px;border-radius:4px;cursor:pointer}",
      "#fbList .it:hover{background:#1d2026}#fbList .it.sel{background:#22301c;color:#8fe07b}",
      "#fbList .it span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      "#fbList .it b{color:#5b636d;font-weight:normal;width:26px}",
      "#fbRight{position:fixed;top:38px;right:0;bottom:210px;width:246px;z-index:99998;background:rgba(18,20,24,.96);border-left:1px solid #2a2d33;color:#c8cdd4;font:12px ui-monospace,monospace;overflow-y:auto}",
      "#fbRight .bd{padding:8px 10px}",
      "#fbRight label{display:flex;align-items:center;gap:6px;margin:4px 0;font-size:11px}",
      "#fbRight label span{width:44px;color:#8b95a1}",
      "#fbRight input[type=number]{width:64px;background:#101216;border:1px solid #2c3038;color:#c8cdd4;border-radius:4px;padding:3px 5px;font:inherit}",
      "#fbRight .aname{color:#7bd86b;margin-bottom:6px;word-break:break-all}",
      "#fbRight .dim{color:#6f7a86;font-size:10px}",
      "#fbWarn{color:#e07b72;font-size:11px;min-height:14px;margin-top:4px}",
      "#fbBottom{position:fixed;left:0;right:0;bottom:22px;height:188px;z-index:99998;background:rgba(16,18,21,.97);border-top:1px solid #2a2d33;display:flex;flex-direction:column;font:11px ui-monospace,monospace;color:#c8cdd4}",
      "#fbBrowseBar{display:flex;gap:6px;align-items:center;padding:6px 10px 2px}",
      "#fbSearch{background:#101216;border:1px solid #2c3038;color:#c8cdd4;border-radius:4px;padding:4px 8px;font:inherit;width:220px}",
      "#fbTabs{display:flex;gap:2px;overflow-x:auto;flex:1}",
      "#fbTabs button{background:transparent;border:none;border-bottom:2px solid transparent;color:#8b95a1;padding:4px 8px;cursor:pointer;font:inherit;white-space:nowrap}",
      "#fbTabs button:hover{color:#c8cdd4}#fbTabs button.on{color:#7bd86b;border-bottom-color:#7bd86b}",
      "#fbAssets{flex:1;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,86px);gap:6px;padding:6px 10px;align-content:start}",
      "#fbAssets button{background:#191c21;border:1px solid #262a31;border-radius:6px;padding:4px 3px 3px;cursor:pointer;color:#aab2bc;font:10px ui-monospace,monospace;display:flex;flex-direction:column;align-items:center;gap:2px}",
      "#fbAssets button:hover{border-color:#7bd86b;color:#dfe5ea}#fbAssets button.on{border-color:#7bd86b;background:#1d2a18;color:#8fe07b}",
      "#fbAssets img{width:62px;height:62px;border-radius:4px;background:#202226;image-rendering:auto}",
      "#fbAssets span{max-width:78px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      "#fbStatus{position:fixed;bottom:0;left:0;right:0;height:22px;z-index:99999;background:#131519;color:#7bd86b;font:11px ui-monospace,monospace;padding:4px 10px;border-top:1px solid #24272d}",
    ].join("\n");
    document.head.appendChild(s);
  }

  _buildUI() {
    const wrap = document.createElement("div"); wrap.id = "fbShell";
    wrap.innerHTML = [
      // ---------- top toolbar ----------
      '<div id="fbTop">',
      '<span class="brand">BUILD LAB</span>',
      '<div class="grp" id="fbModes"><button data-m="move" class="on">Move</button><button data-m="rotate">Rotate</button><button data-m="scale">Scale</button></div>',
      '<div class="grp"><button id="fbUndo">&#8630; Undo</button><button id="fbRedo">&#8631; Redo</button></div>',
      '<div class="grp"><button id="fbSnapPos">pos: off</button><button id="fbSnapRot">rot: off</button><button id="fbFloor" title="Snap selected to floor (F)">to floor</button></div>',
      '<div class="grp"><button id="fbYdn">&minus;</button><span>h <b id="fbY">1.3</b></span><button id="fbYup">+</button></div>',
      '<div class="grp"><button id="fbAutoBtn">Auto-build &#9662;</button><div class="menu" id="fbAutoMenu">',
      '<button id="fbWrap">Wrap raised platform faces (stone)</button>',
      '<button id="fbTile">Tile floor (KayKit stone)</button>',
      '<button id="fbClutter">Scatter clutter (un-square)</button>',
      '<button id="fbRails">Add wood railings (balcony edges)</button>',
      '<button id="fbFixH">Fix piece heights (after map re-tier)</button></div></div>',
      '<div class="grp"><button id="fbOvBtn">Overlays &#9662;</button><div class="menu" id="fbOvMenu">',
      '<label><input type="checkbox" id="fbOvRoute"> enemy routes</label>',
      '<label><input type="checkbox" id="fbOvReserve"> ward/gate reserves</label>',
      '<label><input type="checkbox" id="fbOvProt"> protected (no-prop)</label></div></div>',
      '<div class="grp"><button id="fbExport" title="E">Export</button><button id="fbImport">Import</button><button id="fbReset">Reset to deployed</button></div>',
      '<div class="grp"><button id="fbKeys">Keys &#9662;</button><div class="menu" id="fbKeyHelp" style="min-width:340px;font-size:10px;color:#8b95a1;line-height:1.55"></div></div>',
      '<span id="fbSavedTop">auto-saves locally</span>',
      '</div>',
      // ---------- left outliner ----------
      '<div id="fbLeft"><h4>Scene &middot; <span id="fbCount">0</span> pieces</h4>',
      '<input id="fbFilter" placeholder="filter placed...">',
      '<div id="fbList"></div></div>',
      // ---------- right inspector ----------
      '<div id="fbRight"><h4>Inspector</h4><div class="bd">',
      '<div id="fbInsp">- nothing selected -</div>',
      '<div class="dim" style="margin-top:8px">Size W&times;H&times;D</div><div id="fbSize" class="dim">-</div>',
      '<div id="fbWarn"></div>',
      '<button id="fbCopySel" style="margin-top:8px;width:100%;background:#1e2126;color:#c8cdd4;border:1px solid #2c3038;border-radius:4px;padding:5px;cursor:pointer;font:inherit">Copy placement JSON</button>',
      '<button id="fbDel" style="margin-top:4px;width:100%;background:#2a1c1c;color:#e0a49e;border:1px solid #3d2a28;border-radius:4px;padding:5px;cursor:pointer;font:inherit">Delete selected (Del)</button>',
      '</div></div>',
      // ---------- bottom asset browser ----------
      '<div id="fbBottom"><div id="fbBrowseBar">',
      '<input id="fbSearch" placeholder="Search ' + FB_ASSET_MANIFEST.length + ' pieces...">',
      '<div id="fbTabs"></div></div>',
      '<div id="fbAssets"></div></div>',
      '<input type="file" id="fbImportFile" accept="application/json" style="display:none">',
    ].join("");
    document.body.appendChild(wrap);
    const status = document.createElement("div"); status.id = "fbStatus"; status.textContent = "Build lab loading...";
    document.body.appendChild(status);
    this._ui = { wrap, status };

    // toolbar dropdown behaviour
    const menus = [["fbAutoBtn", "fbAutoMenu"], ["fbOvBtn", "fbOvMenu"], ["fbKeys", "fbKeyHelp"]];
    for (const [btnId, menuId] of menus) {
      const btn = wrap.querySelector("#" + btnId), menu = wrap.querySelector("#" + menuId);
      btn.onclick = (ev) => { ev.stopPropagation(); const was = menu.classList.contains("open"); wrap.querySelectorAll("#fbTop .menu").forEach((m) => m.classList.remove("open")); if (!was) menu.classList.add("open"); };
    }
    document.addEventListener("pointerdown", (ev) => { if (!ev.target.closest("#fbTop .menu") && !ev.target.closest("#fbTop .grp button")) wrap.querySelectorAll("#fbTop .menu").forEach((m) => m.classList.remove("open")); });

    // ---------- asset browser ----------
    this._browse = { cat: "All", q: "" };
    const tabs = wrap.querySelector("#fbTabs");
    for (const c of ["All", ...FB_ASSET_CATEGORIES]) {
      const b = document.createElement("button"); b.textContent = c; b.dataset.cat = c;
      if (c === "All") b.classList.add("on");
      b.onclick = () => { this._browse.cat = c; tabs.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); this._renderAssets(); };
      tabs.appendChild(b);
    }
    wrap.querySelector("#fbSearch").oninput = (ev) => { this._browse.q = ev.target.value.trim().toLowerCase(); this._renderAssets(); };
    this._renderAssets();

    // outliner filter
    wrap.querySelector("#fbFilter").oninput = () => this._refreshList();

    wrap.querySelectorAll("#fbModes button").forEach((b) => { b.onclick = () => this._setMode(b.dataset.m); });
    wrap.querySelector("#fbUndo").onclick = () => this._doUndo();
    wrap.querySelector("#fbRedo").onclick = () => this._doRedo();
    wrap.querySelector("#fbSnapPos").onclick = (ev) => { this.snapPos = this.snapPos === 0 ? 0.25 : this.snapPos === 0.25 ? 0.5 : this.snapPos === 0.5 ? 1 : 0; ev.target.textContent = "pos: " + (this.snapPos || "off"); this._applyGizmoSnap(); };
    wrap.querySelector("#fbSnapRot").onclick = (ev) => { this.snapRot = this.snapRot === 0 ? 15 : this.snapRot === 15 ? 45 : this.snapRot === 45 ? 90 : 0; ev.target.textContent = "rot: " + (this.snapRot ? this.snapRot : "off"); this._applyGizmoSnap(); };
    wrap.querySelector("#fbFloor").onclick = () => this._snapToFloor();
    wrap.querySelector("#fbYup").onclick = () => { this.placeY += 0.2; wrap.querySelector("#fbY").textContent = this.placeY.toFixed(1); };
    wrap.querySelector("#fbYdn").onclick = () => { this.placeY = Math.max(0, this.placeY - 0.2); wrap.querySelector("#fbY").textContent = this.placeY.toFixed(1); };
    wrap.querySelector("#fbWrap").onclick = () => this._wrapPlatforms();
    wrap.querySelector("#fbTile").onclick = () => this._tileFloor();
    wrap.querySelector("#fbClutter").onclick = () => this._scatterClutter();
    wrap.querySelector("#fbRails").onclick = () => this._addRailings();
    wrap.querySelector("#fbFixH").onclick = () => this._fixSavedHeights();
    wrap.querySelector("#fbOvRoute").onchange = (ev) => this._toggleOverlay("route", new pc.Color(0.2, 0.7, 1.0), ev.target.checked);
    wrap.querySelector("#fbOvReserve").onchange = (ev) => this._toggleOverlay("reserve", new pc.Color(1.0, 0.65, 0.2), ev.target.checked);
    wrap.querySelector("#fbOvProt").onchange = (ev) => this._toggleOverlay("protected", new pc.Color(0.9, 0.25, 0.25), ev.target.checked);
    wrap.querySelector("#fbCopySel").onclick = () => this._copySelectedJson();
    wrap.querySelector("#fbDel").onclick = () => this._deleteSelected();
    wrap.querySelector("#fbExport").onclick = () => this._export();
    wrap.querySelector("#fbImport").onclick = () => wrap.querySelector("#fbImportFile").click();
    wrap.querySelector("#fbImportFile").onchange = (ev) => { const f = ev.target.files && ev.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => this._import(String(rd.result)); rd.readAsText(f); ev.target.value = ""; };
    wrap.querySelector("#fbReset").onclick = () => this._resetToMap();
    wrap.querySelector("#fbKeyHelp").innerHTML = [
      "<b>Camera</b> &mdash; W/A/S/D move &middot; Space up &middot; Alt down &middot; right or middle-drag orbit &middot; scroll zoom",
      "<b>Move piece</b> &mdash; left-drag (flat) &middot; <b>hold V + drag = vertical</b> &middot; Arrows nudge &middot; PgUp/PgDn raise/lower &middot; F to floor",
      "<b>Rotate</b> &mdash; Q / R (a group spins around its centre) &middot; hold X or Z to lock an axis",
      "<b>Select</b> &mdash; click &middot; Shift-click adds &middot; double-click a Scene row = fly to it &middot; Esc deselect",
      "<b>Copy</b> &mdash; Ctrl+C copy &middot; Ctrl+V paste &middot; Ctrl+D duplicate &middot; Del delete",
      "<b>History</b> &mdash; Ctrl+Z undo &middot; Ctrl+Y redo &middot; E export",
    ].join("<br>");
    this._syncHistButtons();
  }

  _renderAssets() {
    const grid = this._ui.wrap.querySelector("#fbAssets");
    const { cat, q } = this._browse;
    grid.innerHTML = "";
    let shown = 0;
    for (const e of FB_ASSET_MANIFEST) {
      if (cat !== "All" && e.cat !== cat) continue;
      if (q && !e.name.toLowerCase().includes(q)) continue;
      if (++shown > 400) break;
      const b = document.createElement("button"); b.dataset.asset = e.name; b.title = e.name + "  (" + e.cat + ")";
      const img = document.createElement("img"); img.loading = "lazy"; img.src = "thumbs/" + e.name.replace("/", "__") + ".png"; img.onerror = () => { img.style.display = "none"; };
      const label = document.createElement("span"); label.textContent = e.name.split("/").pop();
      b.appendChild(img); b.appendChild(label);
      b.onclick = () => this._armBrush(e.name);
      grid.appendChild(b);
    }
    if (!shown) grid.innerHTML = '<div style="color:#6f7a86;padding:10px">no pieces match</div>';
  }

  _armBrush(name) {
    const label = name.split("/").pop();
    const arm = () => { this.brush = name; this._select(null); this._syncBrushButtons(); this._status("Place: " + label + " — click the map. (Esc cancels)"); };
    if (kitReady(this.app, name)) return arm();
    this._status("Loading " + label + "...");
    preloadKit(this.app, [name]).then((ok) => { if (ok.has(name)) arm(); else this._status("FAILED to load " + name); });
  }

  _refreshInspector() {
    if (!this._ui) return;
    this._refreshSize();
    const el = this._ui.wrap.querySelector("#fbInsp");
    const warn = this._ui.wrap.querySelector("#fbWarn");
    const p = this.selected;
    if (!p) { el.textContent = "- nothing selected -"; if (warn) warn.textContent = ""; return; }
    const e = p.entity, pos = e.getPosition(), rot = e.getLocalEulerAngles(), sc = e.getLocalScale();
    const f = (n) => (Math.round(n * 100) / 100);
    el.innerHTML = [
      '<div class="aname">' + p.asset + '</div>',
      '<label><span>X</span><input type="number" step="0.25" id="ipx" value="' + f(pos.x) + '"></label>',
      '<label><span>Y</span><input type="number" step="0.1" id="ipy" value="' + f(pos.y) + '"></label>',
      '<label><span>Z</span><input type="number" step="0.25" id="ipz" value="' + f(pos.z) + '"></label>',
      '<label><span>RotY</span><input type="number" step="15" id="ipr" value="' + Math.round(rot.y) + '"></label>',
      '<label><span>Scl X</span><input type="number" step="0.05" id="ips" value="' + f(sc.x) + '"></label>',
      '<label><span>Scl Y</span><input type="number" step="0.05" id="ipsy" value="' + f(sc.y) + '"></label>',
      '<label><span>Scl Z</span><input type="number" step="0.05" id="ipsz" value="' + f(sc.z) + '"></label>',
    ].join("");
    const apply = () => {
      const before = this._snapshot(p);
      const nx = +el.querySelector("#ipx").value, ny = +el.querySelector("#ipy").value, nz = +el.querySelector("#ipz").value;
      const nr = +el.querySelector("#ipr").value, ns = Math.max(0.05, +el.querySelector("#ips").value);
      const nsy = Math.max(0.05, +el.querySelector("#ipsy").value), nsz = Math.max(0.05, +el.querySelector("#ipsz").value);
      e.setPosition(nx, ny, nz); e.setLocalEulerAngles(0, nr, 0); e.setLocalScale(ns, nsy, nsz);
      const after = this._snapshot(p);
      if (!this._sameSnap(before, after)) this._pushUndo({ undo: () => { this._applySnap(p, before); this._select(p); }, redo: () => { this._applySnap(p, after); this._select(p); } });
      this._updateHighlight();
      if (warn) warn.textContent = this._overlapWarn();
    };
    el.querySelectorAll("input").forEach((inp) => { inp.onchange = apply; });
    if (warn) warn.textContent = this._overlapWarn();
  }

  _refreshSize() {
    if (!this._ui) return;
    const el = this._ui.wrap.querySelector("#fbSize"); if (!el) return;
    const list = (this.sel && this.sel.length) ? this.sel : (this.selected ? [this.selected] : []);
    if (!list.length) { el.textContent = "-"; return; }
    let mnx = 1e9, mny = 1e9, mnz = 1e9, mxx = -1e9, mxy = -1e9, mxz = -1e9, ok = false;
    for (const p of list) {
      const a = this._entAabb(p.entity); if (!a) continue; ok = true;
      const c = a.center, h = a.halfExtents;
      mnx = Math.min(mnx, c.x - h.x); mxx = Math.max(mxx, c.x + h.x);
      mny = Math.min(mny, c.y - h.y); mxy = Math.max(mxy, c.y + h.y);
      mnz = Math.min(mnz, c.z - h.z); mxz = Math.max(mxz, c.z + h.z);
    }
    if (!ok) { el.textContent = "-"; return; }
    const f = (n) => Math.round(n * 10) / 10;
    el.textContent = "W " + f(mxx - mnx) + "   H " + f(mxy - mny) + "   D " + f(mxz - mnz) + "    (" + list.length + " pc)";
  }
  _nudge(dx, dz) {
    if (!this.sel.length) return;
    const ref = this.sel.map((p) => ({ piece: p, snap: this._snapshot(p) }));
    for (const p of this.sel) { const o = p.entity.getPosition(); p.entity.setPosition(o.x + dx, o.y, o.z + dz); }
    const after = this.sel.map((p) => this._snapshot(p));
    this._pushUndo({ undo: () => { ref.forEach((b) => this._applySnap(b.piece, b.snap)); this._updateHighlight(); this._refreshInspector(); }, redo: () => { ref.forEach((b, i) => this._applySnap(b.piece, after[i])); this._updateHighlight(); this._refreshInspector(); } });
    this._updateHighlight(); this._refreshInspector();
  }
  _syncBrushButtons() { if (this._ui) this._ui.wrap.querySelectorAll("#fbAssets button").forEach((b) => b.classList.toggle("on", b.dataset.asset === this.brush)); }
  _syncModeButtons() { if (this._ui) this._ui.wrap.querySelectorAll("#fbModes button").forEach((b) => b.classList.toggle("on", b.dataset.m === this.mode)); }
  _syncHistButtons() { if (!this._ui) return; this._ui.wrap.querySelector("#fbUndo").disabled = !this._undo.length; this._ui.wrap.querySelector("#fbRedo").disabled = !this._redo.length; }
  _refreshList() {
    if (!this._ui) return;
    const list = this._ui.wrap.querySelector("#fbList");
    this._ui.wrap.querySelector("#fbCount").textContent = String(this.placed.length);
    const q = (this._ui.wrap.querySelector("#fbFilter")?.value || "").trim().toLowerCase();
    list.innerHTML = "";
    const selSet = new Set(this.sel && this.sel.length ? this.sel : (this.selected ? [this.selected] : []));
    this.placed.forEach((p, i) => {
      if (q && !p.asset.toLowerCase().includes(q)) return;
      const row = document.createElement("div"); row.className = "it" + (selSet.has(p) ? " sel" : "");
      const idx = document.createElement("b"); idx.textContent = String(i);
      const name = document.createElement("span"); name.textContent = p.asset.split("/").pop();
      row.appendChild(idx); row.appendChild(name);
      row.onclick = () => this._select(p);
      row.ondblclick = () => { try { const pos = p.entity.getPosition(); const R = this.renderer; if (R && R.camTarget) { R.camTarget.set(pos.x, pos.y, pos.z); if (R.camDist > 18) R.camDist = 14; } this._select(p); } catch (_) {} };
      list.appendChild(row);
    });
  }
  _status(msg) { if (this._ui) this._ui.status.textContent = msg; }
}
