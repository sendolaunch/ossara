// Front-end flow: Opening (Phantom + $OSSA gate) -> Class Select -> Undercroft.
// Ornate DD-style chrome via theme.js, OSSARA palette.

import { CSS } from "../config/palette.js";
import { TOKEN_GATE } from "../config/economy.js";
import { CLASSES, CLASS_ORDER } from "../config/classes.js";
import { connectPhantom, checkHolding } from "../web3/wallet.js";
import { Preview } from "./preview.js";
import { injectTheme, maskSVG } from "./theme.js";

const el = (tag, style = {}, html) => {
  const e = document.createElement(tag);
  Object.assign(e.style, style);
  if (html != null) e.innerHTML = html;
  return e;
};
const button = (label, cls = "") => {
  const b = el("button");
  b.className = "oss-btn" + (cls ? " " + cls : "");
  b.textContent = label;
  return b;
};
const frame = (inner) => {
  const f = el("div");
  f.className = "oss-frame";
  const i = el("div");
  i.className = "oss-inner";
  if (inner) i.appendChild(inner);
  f.appendChild(i);
  return { frame: f, inner: i };
};

export class ScreenFlow {
  constructor(root, { onLaunchMission, onEnterUndercroft }) {
    injectTheme();
    this.root = root;
    this.onLaunchMission = onLaunchMission;
    this.onEnterUndercroft = onEnterUndercroft;
    this.address = null;
    this.username = "";
    this.classIndex = 0;
    this.selectedClass = CLASS_ORDER[0];
    this.preview = null;
    this._buildOpening();
    this._buildClassSelect();
    this._buildNameEntry();
    this._buildHub();
  }

  _hideAll() {
    for (const s of [this.openEl, this.classEl, this.nameEl, this.hubEl]) if (s) s.style.display = "none";
    if (this.modal) this.modal.style.display = "none";
    if (this.preview) this.preview.stop();
  }

  // ---- OPENING / TITLE -----------------------------------------------------
  _buildOpening() {
    const s = el("div");
    s.className = "oss-screen";
    s.appendChild(Object.assign(el("div"), { className: "oss-fog" }));

    // Background layer. Plays art/opening-bg.mp4 if present (looping, muted), and
    // shows art/opening-bg.png as the poster/fallback. If neither exists, the
    // element is transparent and the crypt backdrop shows through (fail-safe).
    const bgVideo = document.createElement("video");
    bgVideo.poster = "art/opening-bg.png";
    bgVideo.autoplay = true;
    bgVideo.loop = true;
    bgVideo.muted = true;
    bgVideo.setAttribute("muted", "");
    bgVideo.setAttribute("playsinline", "");
    Object.assign(bgVideo.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      objectFit: "cover",
      pointerEvents: "none",
    });
    const vsrc = document.createElement("source");
    vsrc.src = "art/opening-bg.mp4";
    vsrc.type = "video/mp4";
    bgVideo.appendChild(vsrc);
    bgVideo.play?.().catch(() => {});
    const overlay = el("div", {
      position: "absolute",
      inset: "0",
      pointerEvents: "none",
      background: "linear-gradient(rgba(7,8,6,0.28), rgba(7,8,6,0.78))",
    });
    s.appendChild(bgVideo);
    s.appendChild(overlay);

    // Real brand logo (public/art/logo.png) with the drawn SVG mask as fallback.
    const mask = el("div", { lineHeight: "0" });
    const logoImg = document.createElement("img");
    logoImg.src = "art/logo.png";
    logoImg.alt = "OSSARA";
    Object.assign(logoImg.style, {
      width: "190px",
      height: "190px",
      objectFit: "contain",
      filter: "drop-shadow(0 0 26px rgba(110,230,90,0.45))",
    });
    logoImg.onerror = () => {
      mask.innerHTML = maskSVG(150);
    };
    mask.appendChild(logoImg);
    const word = el("h1", { fontSize: "62px", marginTop: "10px" }, "OSSARA");
    word.className = "oss-title";
    const tag = el("div", {}, "Hold the breach &nbsp;·&nbsp; Loot the dead");
    tag.className = "oss-tag";

    const { frame: f, inner } = frame();
    inner.style.minWidth = "440px";
    inner.style.textAlign = "center";
    this.loginStatus = el("div", { color: CSS.ash, minHeight: "20px", maxWidth: "420px", margin: "0 auto 14px", lineHeight: "1.6", fontSize: "14px" },
      "Connect a Solana wallet to enter. Holding $OSSA is required to play.");
    const connect = button("Connect Phantom Wallet", "primary");
    connect.onclick = () => this._connect();
    this.enterBtn = button("Enter ▸", "primary");
    this.enterBtn.style.display = "none";
    this.enterBtn.onclick = () => this.showClassSelect();
    const dev = button("Dev Enter — skip wallet (token not live yet)", "ghost");
    dev.style.marginTop = "12px";
    dev.style.fontSize = "12px";
    dev.onclick = () => {
      this.address = this.address || "DEV-MODE";
      this.showClassSelect();
    };
    const row = el("div", { display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" });
    row.append(connect, this.enterBtn);
    inner.append(this.loginStatus, row, dev);

    s.append(mask, word, tag, f);
    this.openEl = s;
    this.root.appendChild(s);
  }

  async _connect() {
    this.loginStatus.textContent = "Opening Phantom…";
    const res = await connectPhantom();
    if (!res.ok) {
      this.loginStatus.innerHTML =
        res.reason === "not-installed"
          ? `Phantom not found. Install it at <span class="oss-plague">phantom.app</span>, then reload. (Or use Dev Enter.)`
          : "Wallet connection cancelled.";
      return;
    }
    this.address = res.address;
    const short = res.address.slice(0, 4) + "…" + res.address.slice(-4);
    this.loginStatus.textContent = `Connected ${short} — checking $OSSA…`;
    const hold = await checkHolding(res.address, TOKEN_GATE);
    if (hold.reason === "token-not-live") {
      this.loginStatus.innerHTML = `Connected <b>${short}</b>. $OSSA isn't live yet — press <b class="oss-plague">Enter</b>.`;
      this.enterBtn.style.display = "";
    } else if (hold.gated) {
      this.loginStatus.innerHTML = `Connected <b>${short}</b>. You hold ${hold.balance} $OSSA — need ${TOKEN_GATE.minHold}.`;
      this.enterBtn.style.display = "none";
    } else {
      this.loginStatus.innerHTML = `Connected <b>${short}</b> — ${hold.balance} $OSSA. <span class="oss-plague">Access granted.</span>`;
      this.enterBtn.style.display = "";
    }
  }

  // ---- CLASS SELECT (arrow-cycle, single big hero) -------------------------
  _buildClassSelect() {
    const s = el("div");
    s.className = "oss-screen";
    s.appendChild(Object.assign(el("div"), { className: "oss-fog" }));

    const { frame: f, inner } = frame();
    inner.style.width = "min(720px, 92vw)";
    inner.style.textAlign = "center";

    const h2 = el("div", {}, "Choose Your Order");
    h2.className = "oss-h2";

    const row = el("div", { display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" });
    const left = el("button", {}, "‹");
    left.className = "oss-arrow";
    left.onclick = () => this._cycle(-1);
    const right = el("button", {}, "›");
    right.className = "oss-arrow";
    right.onclick = () => this._cycle(1);

    const center = el("div", { flex: "1", maxWidth: "440px" });
    this.className = el("div", { fontSize: "30px", marginBottom: "2px" }, "");
    this.className.className = "oss-title";
    this.classOrder = el("div", {}, "");
    this.classOrder.className = "oss-tag";
    this.previewBox = el("div", { height: "340px", margin: "10px auto", borderRadius: "10px", border: `1px solid #5c451c`, background: "radial-gradient(ellipse at 50% 30%, rgba(110,230,90,0.08), rgba(7,8,6,0.85))", overflow: "hidden", position: "relative", maxWidth: "300px" });
    this.portraitImg = document.createElement("img");
    Object.assign(this.portraitImg.style, { position: "absolute", inset: "0", width: "100%", height: "100%", objectFit: "cover", display: "none" });
    this.previewBox.appendChild(this.portraitImg);
    this.previewFallback = el("div", { position: "absolute", inset: "0", display: "flex", alignItems: "center", justifyContent: "center", color: CSS.ash, fontSize: "12px", textAlign: "center", padding: "20px" }, "");
    this.previewBox.appendChild(this.previewFallback);
    this.classDetails = el("div", { textAlign: "left", fontSize: "13.5px", lineHeight: "1.6", minHeight: "120px" }, "");
    center.append(this.className, this.classOrder, this.previewBox, this.classDetails);

    row.append(left, center, right);

    const btnRow = el("div", { display: "flex", gap: "12px", justifyContent: "center", marginTop: "8px" });
    const back = button("‹ Back", "ghost");
    back.onclick = () => this.showLogin();
    const enter = button("Confirm Order ▸", "primary");
    enter.onclick = () => this.showNameEntry();
    btnRow.append(back, enter);

    inner.append(h2, row, btnRow);
    s.appendChild(f);
    this.classEl = s;
    this.root.appendChild(s);
  }

  // ---- NAME ENTRY ----------------------------------------------------------
  _buildNameEntry() {
    const s = el("div");
    s.className = "oss-screen";
    s.appendChild(Object.assign(el("div"), { className: "oss-fog" }));

    const { frame: f, inner } = frame();
    inner.style.width = "min(460px, 92vw)";
    inner.style.textAlign = "center";

    const h2 = el("div", {}, "Name Your Survivor");
    h2.className = "oss-h2";
    const lore = el("div", { color: CSS.ash, lineHeight: "1.6", margin: "0 0 14px" },
      "The Warded who still draw breath are few. What do they call you at the breach?");

    this.nameInput = document.createElement("input");
    this.nameInput.type = "text";
    this.nameInput.maxLength = 18;
    this.nameInput.placeholder = "The Warded";
    Object.assign(this.nameInput.style, {
      width: "100%", padding: "12px 14px", borderRadius: "8px", border: `2px solid #5c4a1f`,
      background: "#0d0c08", color: CSS.bone, font: "700 16px 'Cinzel', serif", letterSpacing: "2px",
      textAlign: "center", outline: "none",
    });
    this.nameInput.onkeydown = (e) => { if (e.key === "Enter") this._beginTutorial(); };

    const btnRow = el("div", { display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" });
    const back = button("‹ Back", "ghost");
    back.onclick = () => this.showClassSelect();
    const begin = button("Enter the Undercroft ▸", "primary");
    begin.onclick = () => this._beginTutorial();
    btnRow.append(back, begin);

    inner.append(h2, lore, this.nameInput, btnRow);
    s.appendChild(f);
    this.nameEl = s;
    this.root.appendChild(s);
  }

  _beginTutorial() {
    // Name your survivor -> spawn into the Undercroft home base (no forced
    // tutorial). Missions launch from the hub's "Hold a Breach".
    this.username = (this.nameInput.value || "").trim() || "The Warded";
    if (this.onEnterUndercroft) this.onEnterUndercroft(this.selectedClass, this.username);
    else this.showHub();
  }

  showNameEntry() {
    this._hideAll();
    this.nameEl.style.display = "flex";
    if (this.nameInput) this.nameInput.focus();
  }

  _cycle(dir) {
    this.classIndex = (this.classIndex + dir + CLASS_ORDER.length) % CLASS_ORDER.length;
    this.selectedClass = CLASS_ORDER[this.classIndex];
    this._renderClass();
  }

  _renderClass() {
    const c = CLASSES[this.selectedClass];
    this.className.textContent = c.name;
    this.classOrder.textContent = c.order + (c.ready ? "" : "  ·  PREVIEW");
    const sp = c.special.split(" — ");
    this.classDetails.innerHTML =
      `<div><span class="oss-plague" style="font-weight:700">${sp[0]}</span>${sp[1] ? ` — ${sp[1]}` : ""}</div>` +
      `<div style="margin-top:6px"><span class="oss-gold">Role:</span> ${c.role}</div>` +
      `<div><span class="oss-gold">Defences:</span> ${c.towers.join(", ")}</div>` +
      `<div style="font-style:italic;color:${CSS.ash};margin-top:8px">"${c.blurb}"</div>` +
      (c.ready ? "" : `<div class="oss-gold" style="margin-top:6px">Preview only — plays with the Warden kit for now.</div>`);
    const portrait = `art/class-${c.id}.png`;
    this.previewFallback.innerHTML = `<div>${c.name}<br><span style="opacity:.6">add ${portrait}</span></div>`;
    this.previewFallback.style.display = "flex";
    this.portraitImg.style.display = "none";
    this.portraitImg.onload = () => {
      this.portraitImg.style.display = "";
      this.previewFallback.style.display = "none";
    };
    this.portraitImg.onerror = () => {
      this.portraitImg.style.display = "none";
      this.previewFallback.style.display = "flex";
    };
    this.portraitImg.src = portrait;
  }

  // ---- HUB -----------------------------------------------------------------
  _buildHub() {
    const s = el("div");
    s.className = "oss-screen";
    s.appendChild(Object.assign(el("div"), { className: "oss-fog" }));

    const { frame: f, inner } = frame();
    inner.style.width = "min(680px, 92vw)";
    inner.style.textAlign = "center";

    const h2 = el("div", {}, "The Undercroft");
    h2.className = "oss-h2";
    const lore = el("div", { color: CSS.ash, maxWidth: "520px", margin: "0 auto 14px", lineHeight: "1.6" },
      "The last ward still holds beneath the fallen cathedral. The few who can still fight gather here between breaches.");

    const grid = el("div", { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" });
    const station = (title, desc, onClick, primary) => {
      const b = button("", primary ? "primary" : "");
      b.style.textAlign = "left";
      b.style.padding = "14px 16px";
      b.innerHTML = `<div style="font-weight:800;letter-spacing:1px">${title}</div><div style="font-size:12px;font-family:'EB Garamond',serif;letter-spacing:0;opacity:.8;margin-top:3px">${desc}</div>`;
      b.onclick = onClick;
      return b;
    };
    grid.append(
      station("⚔  Hold a Breach", "Launch the defense mission.", () => this.onLaunchMission(this.selectedClass), true),
      station("📦  Stash", "Store and manage your gear.", () => this._stub("Stash")),
      station("🔨  Re-roll / Upgrade Bench", "Re-roll perks · upgrade +1→+10.", () => this._stub("Re-roll / Upgrade Bench")),
      station("♻  Salvager", "Shred gear into dust and mats.", () => this._stub("Salvager")),
      station("💀  The Black Market", "Player trades, paid in $OSSA.", () => this._blackMarket()),
      station("🪙  Quartermaster", "Sell junk loot for Gold.", () => this._stub("Quartermaster"))
    );

    this.hubFoot = el("div", { color: CSS.ash, fontSize: "12px", marginTop: "14px" }, "");
    inner.append(h2, lore, grid, this.hubFoot);
    s.appendChild(f);

    this.modal = el("div", { position: "absolute", inset: "0", display: "none", alignItems: "center", justifyContent: "center", background: "rgba(7,8,6,0.86)", padding: "24px" });
    this.root.appendChild(this.modal);

    this.hubEl = s;
    this.root.appendChild(s);
  }

  _stub(name) {
    this._openModal(
      `<div class="oss-h2" style="font-size:20px">${name}</div>` +
      `<div style="color:${CSS.ash};max-width:420px;line-height:1.6">This station runs on the loot system. It comes online once the gear system is wired into the hub.</div>`
    );
  }

  _blackMarket() {
    const rows = [
      ["Gravewrought Censer +7", "god-roll · +crit, lifesteal", "420 $OSSA"],
      ["Hollow-Eye Cape (Mythic)", "animated · plague-mist trail", "1,150 $OSSA"],
      ["Ballista Core +9", "+tower dmg, faster reload", "300 $OSSA"],
    ];
    const list = rows
      .map(
        (r) =>
          `<div style="display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid #5c451c;padding:9px 0;text-align:left">` +
          `<div><div>${r[0]}</div><div style="color:${CSS.ash};font-size:11px">${r[1]}</div></div>` +
          `<div class="oss-gold" style="white-space:nowrap">${r[2]}</div></div>`
      )
      .join("");
    this._openModal(
      `<div class="oss-h2" style="font-size:20px">The Black Market</div>` +
      `<div style="width:440px;max-width:86vw">${list}</div>` +
      `<div style="color:${CSS.ash};font-size:11px;max-width:440px;line-height:1.6;margin-top:6px">Placeholder listings. Real player-to-player trades settle in $OSSA through your wallet — wired in the economy step (§6, §11).</div>`
    );
  }

  _openModal(html) {
    const { frame: f, inner } = frame();
    inner.style.display = "flex";
    inner.style.flexDirection = "column";
    inner.style.alignItems = "center";
    inner.style.gap = "12px";
    inner.style.textAlign = "center";
    inner.innerHTML = html;
    const close = button("Close", "ghost");
    close.onclick = () => (this.modal.style.display = "none");
    inner.appendChild(close);
    this.modal.innerHTML = "";
    this.modal.appendChild(f);
    this.modal.style.display = "flex";
  }

  // ---- navigation ----------------------------------------------------------
  showLogin() {
    this._hideAll();
    this.openEl.style.display = "flex";
  }

  showClassSelect() {
    this._hideAll();
    this.classEl.style.display = "flex";
    this._renderClass();
  }

  showHub() {
    this._hideAll();
    this.hubEl.style.display = "flex";
    const c = CLASSES[this.selectedClass];
    const who = this.address ? (this.address.length > 10 ? this.address.slice(0, 4) + "…" + this.address.slice(-4) : this.address) : "—";
    const name = this.username || "The Warded";
    this.hubFoot.textContent = `${name}  ·  ${c.name} of ${c.order}  ·  wallet ${who}`;
  }
}
