// RIG: boot the real game headless, probe state, take a screenshot — verify BEFORE shipping.
// Usage: node scripts/rigShot.mjs <outPng> [tx tz dist pitch yaw] [--probe]
// Needs: a vite dev server on :5199 (npx vite --port 5199), playwright-core + @sparticuz/chromium.
import { chromium as pw } from "playwright-core";
import sparticuz from "@sparticuz/chromium";
import { writeFileSync } from "node:fs";

const [out = "/tmp/rig.png", tx = "0", tz = "0", dist = "34", pitch = "0.9", yaw = "0.8"] = process.argv.slice(2);
const playerCam = tx === "player";
const probe = process.argv.includes("--probe");

const exe = await sparticuz.executablePath();
const browser = await pw.launch({ executablePath: exe, args: [...sparticuz.args, "--enable-unsafe-swiftshader"], headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
let kitLine = "";
page.on("console", (m) => { const t = m.text(); if (t.includes("[fbKit]") || t.includes("[dungeonKit]")) kitLine += t + " | "; });
await page.goto("http://localhost:5199/?showcase=first-breach", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForFunction(() => window.OSSARA?.mission?.renderer?.app, null, { timeout: 30000 });
await page.waitForTimeout(3500); // models/kit settle
const state = await page.evaluate(([tx, tz, dist, pitch, yaw, probe]) => {
  const O = window.OSSARA, R = O.mission.renderer, W = O.mission.world;
  if (tx !== "player") {
    try { if (!R.freeCam) R.toggleFreeCam(); } catch (e) {}
    R.camTarget.set(+tx, 2, +tz); R.camDist = +dist; R.camPitch = +pitch; R.camYaw = +yaw;
  } else if (Number.isFinite(+tz) && Number.isFinite(+dist) && +tz > 0) {
    // player mode with a teleport: node rigShot.mjs out player <col> <row>
    const L2 = W.level; W.hero.x = +tz - (L2.cols - 1) / 2; W.hero.z = +dist - (L2.rows - 1) / 2;
  }
  let fbkit = 0; const walk = (e) => { if (e.name?.startsWith("fbkit-")) fbkit++; e.children && e.children.forEach(walk); }; walk(R.app.root);
  const out = { fbkit, badge: [...document.querySelectorAll("div,span")].map((e) => e.textContent).find((t) => t && t.includes("OSSARA ·")) };
  if (probe) {
    const L = W.level, g2w = (c, r) => ({ x: c - (L.cols - 1) / 2, z: r - (L.rows - 1) / 2 });
    out.tiers = ["20,20", "25,40", "22,36", "30,48", "8,50", "31,30"].map((k) => { const [c, r] = k.split(",").map(Number); const w = g2w(c, r); return `${k}: sim=${L.surfaceHeightAt(c, r)} view=${+R._surfaceY(w.x, w.z).toFixed(2)}`; });
  }
  return out;
}, [tx, tz, dist, pitch, yaw, probe]);
await page.waitForTimeout(1200); // camera settle + repaint
// CDP capture: page/element screenshots wait for "stability" and hang on a live game canvas
const cdp = await page.context().newCDPSession(page);
const shot = await cdp.send("Page.captureScreenshot", { format: "png" });
writeFileSync(out, Buffer.from(shot.data, "base64"));
console.log(JSON.stringify({ out, kit: kitLine.slice(0, 160), ...state }, null, 1));
await browser.close();
