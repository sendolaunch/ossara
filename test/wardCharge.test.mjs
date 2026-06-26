import { WardCharge } from "../src/ui/wardCharge.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

class FakeElement {
  constructor() {
    this.children = [];
    this.style = {};
    this.attributes = {};
    this.textContent = "";
    this.parentElement = null;
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }
}

const oldDocument = globalThis.document;
globalThis.document = {
  body: new FakeElement(),
  createElement: () => new FakeElement(),
};

{
  let completeCount = 0;
  const charge = new WardCharge(globalThis.document.body, { duration: 1, onComplete: () => completeCount++ });
  ok(charge.overlay.style.display === "none", "inactive Ward channel overlay starts hidden");
  ok(charge.overlay.getAttribute("aria-hidden") === "true", "inactive Ward channel overlay starts aria-hidden");

  charge.start();
  ok(charge.active, "Ward channel starts active");
  ok(charge.overlay.style.display === "block", "Ward channel shows overlay while active");
  ok(charge.overlay.getAttribute("aria-hidden") === "false", "Ward channel is exposed while active");

  charge.cancel();
  ok(!charge.active, "Ward channel cancel clears active state");
  ok(charge.overlay.style.display === "none", "Ward channel cancel hides overlay");
  ok(charge.overlay.getAttribute("aria-hidden") === "true", "Ward channel cancel marks overlay hidden");

  charge.start();
  charge.update(1.2);
  ok(!charge.active, "Ward channel completion clears active state");
  ok(completeCount === 1, "Ward channel completion fires once");
  ok(charge.overlay.style.display === "none", "Ward channel completion hides overlay");
  ok(charge.overlay.getAttribute("aria-hidden") === "true", "Ward channel completion marks overlay hidden");
}

globalThis.document = oldDocument;

console.log(`wardCharge: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
