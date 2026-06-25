import { Input } from "../src/input/Input.js";
import { DASH_KEY } from "../src/config/moves.js";

let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("  FAIL:", m)));

function target() {
  const handlers = {};
  return {
    handlers,
    addEventListener(type, fn) {
      handlers[type] = handlers[type] || [];
      handlers[type].push(fn);
    },
    dispatch(type, event = {}) {
      for (const fn of handlers[type] || []) fn(event);
    },
  };
}

const oldWindow = globalThis.window;

{
  const fakeWindow = target();
  globalThis.window = fakeWindow;
  const canvas = target();
  const calls = [];
  const camera = [];
  const renderer = {
    domElement: canvas,
    setHover: (...args) => calls.push(args),
    getBasis: () => ({ fwd: { x: 0, z: -1 }, right: { x: 1, z: 0 } }),
    zoomBy: (d) => camera.push(["zoom", d]),
    orbit: (d) => camera.push(["orbit", d]),
    pitchBy: (d) => camera.push(["pitch", d]),
    resetCamera: () => camera.push(["reset"]),
  };
  const world = {
    phase: "prep",
    marrow: 100,
    level: {},
    availableTowers: ["barricade", "spikegate"],
    placementStatus: () => ({ ok: true, reason: "ok" }),
    tryPlaceTower: () => ({ ok: true }),
  };
  const input = new Input(renderer, () => world);
  ok(!input.movementIntent().moving, "movement intent is idle before movement keys");
  fakeWindow.dispatch("keydown", { key: "w", preventDefault() {} });
  const intent = input.movementIntent();
  ok(intent.moving && intent.moveZ === -1, "movement intent reflects held movement keys");
  fakeWindow.dispatch("keydown", { key: "Shift", preventDefault() {} });
  ok(input.movementIntent().running, "movement intent exposes shift as run gait for animation");
  fakeWindow.dispatch("keyup", { key: "Shift" });
  fakeWindow.dispatch("keyup", { key: "w" });
  input.select("barricade");
  input.hoverCell = { col: 2, row: 3 };
  input.cancelBuild();
  ok(input.selected === null, "cancel clears selected tower");
  ok(input.hoverCell === null, "cancel clears hover cell");
  ok(calls.at(-1)?.[0] === null, "cancel clears renderer preview");

  let prevented = false;
  fakeWindow.dispatch("wheel", { deltaY: -120, preventDefault() {} });
  ok(camera.some((c) => c[0] === "zoom" && c[1] < 0), "window wheel zooms camera in over HUD");
  fakeWindow.dispatch("mousedown", { button: 1, clientX: 100, clientY: 100, preventDefault() { prevented = true; } });
  fakeWindow.dispatch("mousemove", { clientX: 125, clientY: 90 });
  fakeWindow.dispatch("mouseup", { button: 1 });
  ok(prevented, "middle mouse orbit prevents browser default");
  ok(camera.some((c) => c[0] === "orbit" && Math.abs(c[1]) > 0), "middle mouse drag orbits camera");
  ok(camera.some((c) => c[0] === "pitch" && Math.abs(c[1]) > 0), "middle mouse drag pitches camera");
  fakeWindow.dispatch("mousedown", { button: 2, clientX: 100, clientY: 100, preventDefault() {} });
  fakeWindow.dispatch("mousemove", { clientX: 80, clientY: 110 });
  fakeWindow.dispatch("mouseup", { button: 2 });
  ok(camera.filter((c) => c[0] === "orbit").length >= 2, "right mouse drag orbits camera outside build mode");
  fakeWindow.dispatch("keydown", { key: "c", preventDefault() {} });
  ok(camera.some((c) => c[0] === "reset"), "C recenters mission camera");
}

{
  const fakeWindow = target();
  globalThis.window = fakeWindow;
  const canvas = target();
  const calls = [];
  let blocked = false;
  const renderer = {
    domElement: canvas,
    setHover: (...args) => calls.push(args),
    getBasis: () => ({ fwd: { x: 0, z: -1 }, right: { x: 1, z: 0 } }),
    zoomBy: () => {},
    orbit: () => {},
  };
  const world = {
    phase: "active",
    marrow: 100,
    level: {},
    availableTowers: ["barricade"],
    placementStatus: () => ({ ok: true, reason: "ok" }),
    tryPlaceTower: () => ({ ok: true }),
  };
  const input = new Input(renderer, () => world);
  input.onBuildBlocked = () => { blocked = true; };
  input.select("barricade");
  ok(input.selected === null, "combat-phase selection is rejected");
  ok(blocked, "combat-phase selection reports blocked build mode");
  ok(calls.at(-1)?.[0] === null, "combat-phase selection clears renderer preview");
}

{
  const fakeWindow = target();
  globalThis.window = fakeWindow;
  const canvas = target();
  const hoverCalls = [];
  let placed = null;
  let hoverStatus = null;
  const renderer = {
    domElement: canvas,
    setHover: (...args) => hoverCalls.push(args),
    pointerToCell: (x) => x === 99 ? { col: 8, row: 9, x: 4, z: 4 } : { col: 4, row: 5, x: 0, z: 0 },
    getBasis: () => ({ fwd: { x: 0, z: -1 }, right: { x: 1, z: 0 } }),
    zoomBy: () => {},
    orbit: () => {},
  };
  const world = {
    phase: "prep",
    marrow: 100,
    level: {},
    availableTowers: ["barricade"],
    placementStatus: (id, col) => col === 8 ? { ok: false, reason: "path" } : { ok: true, reason: "ok" },
    tryPlaceTower: (id, col, row, opts) => {
      placed = { id, col, row, opts };
      return { ok: true };
    },
  };
  const input = new Input(renderer, () => world);
  input.onHoverStatus = (status) => { hoverStatus = status; };
  canvas.dispatch("click", { clientX: 10, clientY: 20 });
  const attack = input.consume();
  ok(attack.attack && attack.attackX === 0 && attack.attackZ === 0, "normal left-click queues a manual hero attack");
  input.select("barricade");
  ok(input.selected === "barricade", "selecting a tower enters build mode");
  canvas.dispatch("mousemove", { clientX: 10, clientY: 20 });
  fakeWindow.dispatch("keydown", { key: "r", preventDefault() {} });
  input.refreshHover();
  const opts = hoverCalls.at(-1)?.[4] || {};
  ok(Math.abs(opts.rotation - Math.PI / 2) < 1e-9, "rotate updates build ghost facing");
  ok(hoverStatus?.ok && hoverStatus.col === 4 && hoverStatus.row === 5, "hover status reports the snapped build cell");
  canvas.dispatch("mousemove", { clientX: 99, clientY: 20 });
  input.refreshHover();
  ok(hoverStatus?.reason === "path", "hover status reports invalid placement reasons");
  canvas.dispatch("mousemove", { clientX: 10, clientY: 20 });
  input.refreshHover();
  canvas.dispatch("click", { clientX: 10, clientY: 20 });
  ok(placed?.id === "barricade" && placed.col === 4 && placed.row === 5, "click places selected tower at hover cell");
  ok(Math.abs(placed?.opts?.facing - Math.PI / 2) < 1e-9, "placement sends rotated facing to sim");
  ok(!input.consume().attack, "build-mode left-click places tower instead of queuing hero attack");
  canvas.dispatch("contextmenu", { preventDefault() {} });
  ok(input.selected === null && input.hoverCell === null, "right-click cancels build mode");
}

{
  const fakeWindow = target();
  globalThis.window = fakeWindow;
  const canvas = target();
  const tower = { id: 20, alive: true, col: 1, row: 1, x: 0, z: 0, physical: true, hp: 40, maxHp: 100, level: 1, maxLevel: 3 };
  const renderer = {
    domElement: canvas,
    setHover: () => {},
    setCommandTarget: () => {},
    setCommandCast: () => {},
    pointerToCell: () => ({ col: 1, row: 1, x: 0, z: 0 }),
    getBasis: () => ({ fwd: { x: 0, z: -1 }, right: { x: 1, z: 0 } }),
    zoomBy: () => {},
    orbit: () => {},
  };
  const world = {
    phase: "prep",
    hero: { alive: true, x: 0, z: 1 },
    level: {},
    towers: [tower],
    availableTowers: ["barricade"],
    placementStatus: () => ({ ok: true, reason: "ok" }),
    towerAtCell: () => tower,
    towerById: () => tower,
  };
  const input = new Input(renderer, () => world);
  fakeWindow.dispatch("keydown", { key: DASH_KEY, preventDefault() {} });
  ok(input.consume().dash, "dash key queues a hero dash in normal mode");
  input.select("barricade");
  fakeWindow.dispatch("keydown", { key: DASH_KEY, preventDefault() {} });
  ok(!input.consume().dash, "dash key is ignored in build mode");
  input.cancelBuild();
  input.enterCommandTargetMode("upgrade");
  fakeWindow.dispatch("keydown", { key: DASH_KEY, preventDefault() {} });
  ok(!input.consume().dash, "dash key is ignored in command target mode");
  input.confirmCommandTarget();
  fakeWindow.dispatch("keydown", { key: DASH_KEY, preventDefault() {} });
  ok(!input.consume().dash, "dash key is ignored during command casts");
}

{
  const fakeWindow = target();
  globalThis.window = fakeWindow;
  const canvas = target();
  const tower = { id: 7, alive: true, col: 3, row: 4, x: 0, z: 0, physical: true, hp: 50, maxHp: 100, level: 1, maxLevel: 3 };
  const farTower = { id: 8, alive: true, col: 9, row: 9, x: 20, z: 20, physical: true, hp: 50, maxHp: 100, level: 1, maxLevel: 3 };
  let hovered = null;
  const commandTargets = [];
  const commandCasts = [];
  const results = [];
  const menuStates = [];
  const spawnStates = [];
  const renderer = {
    domElement: canvas,
    setHover: () => {},
    setCommandTarget: (tower, mode) => commandTargets.push([tower && tower.id, mode]),
    setSpawnIndicatorsEnabled: (on) => spawnStates.push(on),
    pointerToCell: () => ({ col: 3, row: 4, x: 0, z: 0 }),
    getBasis: () => ({ fwd: { x: 0, z: -1 }, right: { x: 1, z: 0 } }),
    zoomBy: () => {},
    orbit: () => {},
  };
  const world = {
    phase: "active",
    hero: { alive: true, x: 0, z: 1 },
    level: {},
    towers: [farTower, tower],
    availableTowers: ["barricade"],
    towerAtCell: (col, row) => (col === 3 && row === 4 && tower.alive ? tower : null),
    towerById: (id) => (id === tower.id ? tower : id === farTower.id ? farTower : null),
    upgradeTower: (id) => ({ ok: id === tower.id, action: "upgrade", tower }),
    repairTower: (id) => ({ ok: id === tower.id, action: "repair", tower }),
    sellTower: (id) => {
      tower.alive = false;
      return { ok: id === tower.id, action: "sell", tower, refund: 17 };
    },
  };
  const input = new Input(renderer, () => world);
  input.onTowerHover = (t) => { hovered = t; };
  input.onManageResult = (res) => results.push(res);
  input.onActionMenuChange = (open) => menuStates.push(open);
  input.onCommandTargetChange = (mode, tower) => commandTargets.push([tower && tower.id, mode]);
  input.onCommandCastChange = (cast, tower) => commandCasts.push([cast && cast.action, tower && tower.id]);
  canvas.dispatch("mousemove", { clientX: 10, clientY: 20 });
  input.refreshHover();
  ok(hovered === tower, "hovering a placed defense reports tower hover");
  fakeWindow.dispatch("keydown", { key: "Tab", preventDefault() {} });
  ok(input.actionMenuOpen && menuStates.at(-1) === true, "Tab opens the action menu");
  input.chooseActionMenuAction("upgrade");
  ok(!input.actionMenuOpen && menuStates.at(-1) === false, "action menu closes after choosing an action");
  ok(input.commandTargetMode === "upgrade" && input.commandTarget === tower, "choosing upgrade enters command target mode on nearest defense");
  input._setCommandTarget(farTower);
  canvas.dispatch("click", { clientX: 10, clientY: 20 });
  ok(results.at(-1)?.reason === "range", "far command target outside range cannot be confirmed");
  input.enterCommandTargetMode("upgrade");
  canvas.dispatch("click", { clientX: 10, clientY: 20 });
  ok(input.commandCast?.action === "upgrade", "left-click starts targeted command cast");
  ok(input.commandCast?.duration === 3, "upgrade uses data-driven command cast time");
  ok(!input.consume().attack, "command-mode left-click confirms command instead of attacking");
  input.updateCommandCast(3);
  ok(results.at(-1)?.action === "upgrade", "command cast completes targeted upgrade");
  input.chooseActionMenuAction("spawn");
  fakeWindow.dispatch("keydown", { key: "u", preventDefault() {} });
  ok(input.commandTargetMode === "upgrade", "U directly enters upgrade target mode");
  fakeWindow.dispatch("keydown", { key: "Escape", preventDefault() {} });
  ok(input.commandTargetMode === null && input.commandTarget === null, "Esc cancels command target mode");
  ok(commandTargets.some((t) => t[0] === null && t[1] === null), "cancel clears command target highlight");
  input.chooseActionMenuAction("repair");
  fakeWindow.dispatch("keydown", { key: "Enter", preventDefault() {} });
  ok(input.commandCast?.duration === 2, "repair uses data-driven command cast time");
  input.updateCommandCast(2);
  input.chooseActionMenuAction("sell");
  fakeWindow.dispatch("keydown", { key: "Enter", preventDefault() {} });
  ok(input.commandCast?.duration === 1, "sell uses data-driven command cast time");
  input.updateCommandCast(1);
  ok(results.filter((r) => r.ok).map((r) => r.action).join(",") === "upgrade,repair,sell", "command menu confirms upgrade/repair/sell management actions");
  ok(hovered === null, "selling clears hovered defense");
  ok(commandCasts.some((c) => c[0] === "upgrade" && c[1] === tower.id), "command cast callback reports action and target");
  fakeWindow.dispatch("keydown", { key: "o", preventDefault() {} });
  fakeWindow.dispatch("keydown", { key: "o", preventDefault() {} });
  ok(spawnStates[0] === false && spawnStates[1] === true && spawnStates[2] === false, "action menu and O toggle spawn indicators");
}

{
  const fakeWindow = target();
  globalThis.window = fakeWindow;
  const canvas = target();
  const tower = { id: 11, alive: true, col: 2, row: 2, x: 0, z: 0, physical: true, hp: 40, maxHp: 100, level: 1, maxLevel: 3 };
  const results = [];
  const renderer = {
    domElement: canvas,
    setHover: () => {},
    setCommandTarget: () => {},
    setCommandCast: () => {},
    pointerToCell: () => ({ col: 2, row: 2, x: 0, z: 0 }),
    getBasis: () => ({ fwd: { x: 0, z: -1 }, right: { x: 1, z: 0 } }),
    zoomBy: () => {},
    orbit: () => {},
  };
  const world = {
    phase: "active",
    hero: { alive: true, x: 0, z: 1 },
    level: {},
    towers: [tower],
    availableTowers: ["barricade"],
    towerAtCell: () => tower,
    towerById: (id) => (id === tower.id ? tower : null),
    upgradeTower: () => ({ ok: true, action: "upgrade", tower }),
  };
  const input = new Input(renderer, () => world);
  input.onManageResult = (res) => results.push(res);
  input.enterCommandTargetMode("upgrade");
  input.confirmCommandTarget();
  ok(input.commandCast?.action === "upgrade", "confirm starts command cast state");
  input.cancelCommandCast();
  input.updateCommandCast(1);
  ok(!results.length, "cancel before cast completion prevents command action");
  input.enterCommandTargetMode("upgrade");
  input.confirmCommandTarget();
  fakeWindow.dispatch("keydown", { key: "w", preventDefault() {} });
  input.update(0.1);
  ok(input.commandCast === null && results.at(-1)?.reason === "moved", "movement cancels command cast before action applies");
  fakeWindow.dispatch("keyup", { key: "w" });
}

{
  const fakeWindow = target();
  globalThis.window = fakeWindow;
  const canvas = target();
  const results = [];
  const renderer = {
    domElement: canvas,
    setHover: () => {},
    setCommandTarget: () => {},
    pointerToCell: () => ({ col: 1, row: 1, x: 0, z: 0 }),
    getBasis: () => ({ fwd: { x: 0, z: -1 }, right: { x: 1, z: 0 } }),
    zoomBy: () => {},
    orbit: () => {},
  };
  const world = {
    phase: "prep",
    hero: { alive: true, x: 0, z: 0 },
    level: {},
    towers: [],
    availableTowers: ["barricade"],
    placementStatus: () => ({ ok: true, reason: "ok" }),
    tryPlaceTower: () => ({ ok: true }),
  };
  const input = new Input(renderer, () => world);
  input.onManageResult = (res) => results.push(res);
  input.select("barricade");
  input.enterCommandTargetMode("upgrade");
  ok(input.selected === null, "entering command target mode clears build mode");
  ok(results.at(-1)?.reason === "range", "command target mode reports no defense in range");
}

{
  const fakeWindow = target();
  globalThis.window = fakeWindow;
  const canvas = target();
  const calls = [];
  const renderer = {
    domElement: canvas,
    setHover: (...args) => calls.push(["hover", ...args]),
    setCommandTarget: (...args) => calls.push(["target", ...args]),
    setCommandCast: (...args) => calls.push(["cast", ...args]),
    pointerToCell: () => ({ col: 1, row: 1, x: 0, z: 0 }),
    getBasis: () => ({ fwd: { x: 0, z: -1 }, right: { x: 1, z: 0 } }),
    zoomBy: () => {},
    orbit: () => {},
  };
  const tower = { id: 17, alive: true, col: 1, row: 1, x: 0, z: 0, physical: true, hp: 40, maxHp: 100, level: 1, maxLevel: 3 };
  const world = {
    phase: "prep",
    hero: { alive: true, x: 0, z: 1 },
    level: {},
    towers: [tower],
    availableTowers: ["barricade"],
    placementStatus: () => ({ ok: true, reason: "ok" }),
    tryPlaceTower: () => ({ ok: true }),
    towerAtCell: () => tower,
    towerById: () => tower,
  };
  const input = new Input(renderer, () => world);
  const menuStates = [];
  input.onActionMenuChange = (open) => menuStates.push(open);
  input.select("barricade");
  fakeWindow.dispatch("keydown", { key: "w", preventDefault() {} });
  fakeWindow.dispatch("keydown", { key: "Tab", preventDefault() {} });
  canvas.dispatch("click", { clientX: 10, clientY: 20 });
  input.commandTargetMode = "upgrade";
  input.commandTarget = tower;
  input.commandCast = { action: "upgrade", towerId: tower.id, duration: 3, remaining: 2 };
  input.resetState();
  ok(!input.movementIntent().moving, "mission input reset clears held movement keys");
  ok(input.selected === null && input.hoverCell === null && input.hoverTower === null, "mission input reset clears build and hover state");
  ok(input.commandTargetMode === null && input.commandTarget === null && input.commandCast === null, "mission input reset clears command target and cast state");
  ok(input.actionMenuOpen === false && menuStates.at(-1) === false, "mission input reset closes the action menu");
  ok(!input.consume().attack, "mission input reset clears pending manual attack");
  ok(calls.some((c) => c[0] === "hover" && c[1] === null), "mission input reset clears renderer build preview");
  ok(calls.some((c) => c[0] === "target" && c[1] === null), "mission input reset clears renderer command target");
  ok(calls.some((c) => c[0] === "cast" && c[1] === null), "mission input reset clears renderer command cast");
}

{
  const fakeWindow = target();
  globalThis.window = fakeWindow;
  const canvas = target();
  const renderer = {
    domElement: canvas,
    setHover: () => {},
    setCommandTarget: () => {},
    setCommandCast: () => {},
    pointerToCell: () => ({ col: 1, row: 1, x: 0, z: 0 }),
    getBasis: () => ({ fwd: { x: 0, z: -1 }, right: { x: 1, z: 0 } }),
    zoomBy: () => {},
    orbit: () => {},
  };
  const world = {
    phase: "prep",
    hero: { alive: true, x: 0, z: 1 },
    level: {},
    towers: [],
    availableTowers: ["barricade"],
    placementStatus: () => ({ ok: true, reason: "ok" }),
  };
  const input = new Input(renderer, () => world);
  input.select("barricade");
  input.commandCast = { action: "repair", towerId: 1, duration: 2, remaining: 1 };
  input.actionMenuOpen = true;
  input.pendingAttack = { x: 1, z: 1 };
  input.requestStart();
  const cmd = input.consume();
  ok(cmd.startWave, "Start Wave request survives transient input cleanup");
  ok(!cmd.attack, "Start Wave cleanup drops pending attack visuals");
  ok(input.selected === null && input.commandCast === null && input.actionMenuOpen === false, "Start Wave cleanup clears build, cast, and menu state");
}

globalThis.window = oldWindow;

console.log(`input: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
