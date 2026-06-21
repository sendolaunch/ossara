// Playwright smoke test — the render safety net. Builds must be done first
// (`npm run build`); this serves dist via `vite preview`, drives the boot flow
// (Dev Enter -> order -> name -> Undercroft), and FAILS if the console throws or
// no canvas/scene appears. Catches the boot-crash / blank-screen class of bug
// that the headless sim test can't see.
//
//   npm run smoke                 # local: builds preview on :4173
//   SMOKE_URL=https://... npm run smoke   # smoke a deployed URL instead

import { spawn } from "node:child_process";
import { chromium } from "playwright";

const PORT = 4173;
const URL = process.env.SMOKE_URL || `http://localhost:${PORT}/`;
const local = !process.env.SMOKE_URL;
let server = null;

async function waitForServer(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.ok) return true;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`server did not come up at ${url}`);
}

async function main() {
  if (local) {
    server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], { shell: true, stdio: "ignore" });
    await waitForServer(URL, 25000);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push("pageerror: " + (e?.message || e)));

  await page.goto(URL, { waitUntil: "load", timeout: 30000 });

  // 1) opening screen booted
  await page.waitForSelector("text=OSSARA", { timeout: 15000 });

  // 2) walk the flow into the hub (a 3D scene → a <canvas> must exist)
  await page.getByText(/Dev Enter/i).first().click();
  await page.getByText(/Confirm Order/i).first().click();
  await page.getByText(/Enter the Undercroft/i).first().click();
  await page.waitForSelector("canvas", { timeout: 20000 });
  await page.waitForTimeout(2500); // let PlayCanvas boot + render a few frames

  await browser.close();
  if (server) server.kill();

  if (errors.length) {
    console.error("✗ SMOKE FAIL — console/page errors:\n  " + errors.join("\n  "));
    process.exit(1);
  }
  console.log("✓ SMOKE OK — opening booted, reached the Undercroft canvas, console clean.");
  process.exit(0);
}

main().catch((e) => {
  console.error("✗ SMOKE ERROR:", e?.message || e);
  if (server) server.kill();
  process.exit(1);
});
