import { Input } from "../src/input/Input.js";

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

globalThis.window = oldWindow;

console.log(`input: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
