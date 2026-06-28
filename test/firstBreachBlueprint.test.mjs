// Dev-only blueprint tool tests. Verifies the blueprint data model, validation, and
// the deterministic SVG renderer. Touches NO gameplay code.
import { FIRST_BREACH_BLUEPRINT as BP } from "../src/mapbuilder/blueprints/firstBreachBlueprint.js";
import { validateBlueprint } from "../src/mapbuilder/blueprints/blueprintValidation.js";
import { renderBlueprintSVG } from "../src/mapbuilder/blueprints/blueprintRenderer.js";

let pass = 0, fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

// --- grid + overall validity ------------------------------------------------
ok(BP.grid.cols === 73 && BP.grid.rows === 57, "blueprint grid is 73x57");
const v = validateBlueprint(BP);
ok(v.ok, `blueprint validates with no errors: ${v.errors.join("; ")}`);

// --- ids unique across all collections --------------------------------------
const ids = [];
for (const k of ["zones", "gates", "chokes", "stairs", "routes", "elevationBands"]) for (const it of BP[k] || []) ids.push(it.id);
ok(new Set(ids).size === ids.length, "all blueprint ids are unique");

// --- zones in bounds + a Ward zone ------------------------------------------
const inRect = (b) => b && b.col >= 0 && b.row >= 0 && b.col + b.w <= BP.grid.cols && b.row + b.h <= BP.grid.rows;
ok((BP.zones || []).every((z) => inRect(z.bounds)), "every zone is within the grid");
ok((BP.zones || []).some((z) => z.kind === "ward"), "a Ward zone exists");
ok(BP.ward && BP.ward.cell && BP.ward.cell.col < BP.grid.cols, "ward cell is set + in bounds");

// --- gates: labels, bounds/cell, exactly one main ---------------------------
ok((BP.gates || []).length === 5, "five gates (A-E) defined");
ok((BP.gates || []).every((g) => g.label && g.cell && Number.isFinite(g.cell.col)), "every gate has a label + cell");
ok((BP.gates || []).filter((g) => g.importance === "main").length === 1, "exactly one main gate exists");
ok((BP.gates || []).map((g) => g.label).join("") === "ABCDE", "gate labels are A,B,C,D,E");

// --- elevation bands ordered low -> high ------------------------------------
const bands = BP.elevationBands || [];
ok(bands.length >= 3, "at least three elevation bands");
ok(bands.every((b, i) => i === 0 || (b.order > bands[i - 1].order && b.height >= bands[i - 1].height)), "elevation bands are ordered low -> high");

// --- routes reference valid gates + chokes ----------------------------------
const gateIds = new Set((BP.gates || []).map((g) => g.id));
const chokeIds = new Set((BP.chokes || []).map((c) => c.id));
ok((BP.routes || []).length >= 1, "routes exist");
ok((BP.routes || []).every((r) => gateIds.has(r.gate)), "every route references a real gate");
ok((BP.routes || []).every((r) => (r.via || []).every((v2) => chokeIds.has(v2))), "every route via-choke is a real choke");
ok((BP.routes || []).every((r) => Array.isArray(r.points) && r.points.length >= 2), "every route has >= 2 points");

// --- stairs go low band -> high band ----------------------------------------
const order = new Map(bands.map((b) => [b.id, b.order]));
ok((BP.stairs || []).every((s) => order.has(s.from) && order.has(s.to) && order.get(s.from) < order.get(s.to)), "stairs connect a lower band to a higher band");

// --- renderer: deterministic + well-formed ----------------------------------
const a = renderBlueprintSVG(BP, { cellPx: 18 });
const b = renderBlueprintSVG(BP, { cellPx: 18 });
ok(typeof a === "string" && a.startsWith("<svg") && a.trimEnd().endsWith("</svg>"), "renderer returns a well-formed SVG string");
ok(a === b, "render is deterministic (same input -> same output)");
ok(a.includes(">A<") && a.includes(">C<") && a.includes("MAIN GATE"), "rendered SVG shows gate labels + the main gate");
ok(a.includes(String(BP.grid.cols)) && a.includes("ELEVATION"), "rendered SVG shows grid ruler + elevation legend");

// --- validation catches a bad blueprint (negative test) ---------------------
const bad = JSON.parse(JSON.stringify(BP));
bad.gates[0].cell.col = 999;
ok(!validateBlueprint(bad).ok, "validation rejects an out-of-bounds gate");

console.log(`firstBreachBlueprint: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
