// One-time "name your hero" modal — ornate-stone themed to match Select Heroes.
// Live-validates against sim/username.js, checks availability against Supabase
// (debounced), and on confirm permanently claims the name (web3/heronames.js).
// Because the name is locked forever once claimed, the modal makes that explicit.
//
// Usage:
//   openHeroNameModal(document.getElementById("ui"), {
//     classId: "warden",
//     heroLabel: "Warden",
//     onClaimed: (username) => { /* store on the hero + persist + refresh UI */ },
//   });

import { validateUsername } from "../sim/username.js";
import { isNameAvailable, claimHeroName } from "../web3/heronames.js";

const GOLD = "#c8a14a";
const BONE = "#e9e4d2";
const ASH = "#8f886f";
const BLOOD = "#b9554f";

export function openHeroNameModal(parent, { classId, heroLabel = "Hero", onClaimed }) {
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "absolute", inset: "0", zIndex: "30", display: "flex",
    alignItems: "center", justifyContent: "center",
    background: "rgba(7,8,6,0.78)", backdropFilter: "blur(2px)",
  });

  overlay.innerHTML = `
    <div style="width:min(460px,92vw);border:1px solid ${GOLD};border-radius:14px;
      background:linear-gradient(180deg,#1a1712,#0d0b08);box-shadow:0 0 40px rgba(0,0,0,.6);
      padding:26px 26px 22px;text-align:center;font-family:'Cinzel',serif;color:${BONE}">
      <div style="font-size:22px;letter-spacing:2px;color:${GOLD};font-weight:700">NAME YOUR ${heroLabel.toUpperCase()}</div>
      <div style="color:${ASH};font-size:13px;margin:8px 0 18px;line-height:1.5;font-family:ui-sans-serif,system-ui">
        This name is <b style="color:${BONE}">permanent</b> and unique across all players — it can't be changed or taken by anyone else. Choose well.
      </div>
      <input id="hnInput" maxlength="16" autocomplete="off" spellcheck="false" placeholder="3–16 chars · letters, numbers, _ -"
        style="width:100%;box-sizing:border-box;padding:12px 14px;border-radius:8px;border:1px solid ${ASH};
        background:#060705;color:${BONE};font-size:18px;letter-spacing:1px;text-align:center;outline:none;font-family:'Cinzel',serif" />
      <div id="hnMsg" style="min-height:18px;margin:10px 0 16px;font-size:13px;color:${ASH};font-family:ui-sans-serif,system-ui"></div>
      <div style="display:flex;gap:10px;justify-content:center">
        <button id="hnCancel" style="padding:10px 18px;border-radius:8px;border:1px solid ${ASH};background:transparent;color:${BONE};cursor:pointer;font-family:'Cinzel',serif">Cancel</button>
        <button id="hnClaim" disabled style="padding:10px 22px;border-radius:8px;border:1px solid ${GOLD};
          background:${GOLD};color:#0d0b08;font-weight:700;cursor:pointer;opacity:.5;font-family:'Cinzel',serif">Claim Name</button>
      </div>
    </div>`;

  parent.appendChild(overlay);
  const input = overlay.querySelector("#hnInput");
  const msg = overlay.querySelector("#hnMsg");
  const claimBtn = overlay.querySelector("#hnClaim");
  const cancelBtn = overlay.querySelector("#hnCancel");

  const close = () => overlay.remove();
  let token = 0;
  let okToClaim = false;

  const setMsg = (text, color = ASH) => { msg.textContent = text; msg.style.color = color; };
  const setClaimable = (on) => {
    okToClaim = on;
    claimBtn.disabled = !on;
    claimBtn.style.opacity = on ? "1" : ".5";
    claimBtn.style.cursor = on ? "pointer" : "default";
  };

  let debounce = null;
  input.addEventListener("input", () => {
    setClaimable(false);
    const v = validateUsername(input.value);
    if (!v.ok) { setMsg(v.reason, BLOOD); return; }
    setMsg("Checking availability…");
    const myToken = ++token;
    clearTimeout(debounce);
    debounce = setTimeout(async () => {
      const res = await isNameAvailable(input.value);
      if (myToken !== token) return; // a newer keystroke superseded this check
      if (!res.ok) { setMsg(res.reason, BLOOD); return; }
      if (res.available) { setMsg(`"${v.value}" is available.`, GOLD); setClaimable(true); }
      else setMsg("That name is taken — try another.", BLOOD);
    }, 350);
  });

  claimBtn.addEventListener("click", async () => {
    if (!okToClaim) return;
    setClaimable(false);
    setMsg("Claiming…");
    const res = await claimHeroName(classId, input.value);
    if (res.ok) {
      setMsg(`Claimed "${res.username}".`, GOLD);
      if (onClaimed) onClaimed(res.username);
      close();
    } else {
      setMsg(res.reason, BLOOD);
    }
  });

  cancelBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && okToClaim) claimBtn.click(); if (e.key === "Escape") close(); });
  setTimeout(() => input.focus(), 30);

  return { close };
}
