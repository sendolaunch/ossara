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
  const renderer = {
    domElement: canvas,
    setHover: (...args) => calls.push(args),
    getBasis: () => ({ fwd: { x: 0, z: -1 }, right: { x: 1, z: 0 } }),
    zoomBy: () => {},
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
  input.select("barricade");
  input.hoverCell = { col: 2, row: 3 };
  input.cancelBuild();
  ok(input.selected === null, "cancel clears selected tower");
  ok(input.hoverCell === null, "cancel clears hover cell");
  ok(calls.at(-1)?.[0] === null, "cancel clears renderer preview");
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

globalThis.window = oldWindow;

console.log(`input: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
