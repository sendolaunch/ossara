// The Ward-Crystal "go to war" ritual. When you press [E] on the dais, instead of
// the map-select popping instantly, the crystal CHARGES for ~1.5s — a growing
// plague-green vignette + a "Channeling the Ward…" prompt + a progress bar — then
// fires onComplete (which opens map-select). hub3d drives this and pulses the
// crystal mesh by `progress`. Self-contained DOM overlay; no engine deps.

const GREEN = "110,230,90";

export class WardCharge {
  constructor(uiRoot, { duration = 1.5, onComplete } = {}) {
    this.duration = duration;
    this.onComplete = onComplete || (() => {});
    this.active = false;
    this.t = 0;

    this.overlay = document.createElement("div");
    Object.assign(this.overlay.style, {
      position: "absolute", inset: "0", pointerEvents: "none", zIndex: "6",
      display: "none", opacity: "0", transition: "opacity .12s",
    });
    this.overlay.setAttribute("aria-hidden", "true");

    this.label = document.createElement("div");
    Object.assign(this.label.style, {
      position: "absolute", bottom: "96px", left: "50%", transform: "translateX(-50%)",
      color: "#bdf7a8", font: "700 16px 'Cinzel', serif", letterSpacing: "3px",
      textShadow: "0 0 12px rgba(110,230,90,0.7)", whiteSpace: "nowrap", textAlign: "center",
    });
    this.label.textContent = "CHANNELING THE WARD…";

    this.bar = document.createElement("div");
    Object.assign(this.bar.style, {
      position: "absolute", bottom: "82px", left: "50%", transform: "translateX(-50%)",
      width: "220px", height: "4px", borderRadius: "3px", background: "rgba(110,230,90,0.18)",
      overflow: "hidden",
    });
    this.fill = document.createElement("div");
    Object.assign(this.fill.style, { height: "100%", width: "0%", background: "#6ee65a", boxShadow: "0 0 10px #6ee65a" });
    this.bar.appendChild(this.fill);

    this.overlay.appendChild(this.label);
    this.overlay.appendChild(this.bar);
    (uiRoot || document.body).appendChild(this.overlay);
  }

  start() {
    if (this.active) return;
    this.active = true;
    this.t = 0;
    this.overlay.style.display = "block";
    this.overlay.setAttribute("aria-hidden", "false");
    this.overlay.style.opacity = "1";
    this._render(0);
  }

  cancel() {
    this.active = false;
    this.t = 0;
    this.overlay.style.opacity = "0";
    this.overlay.style.display = "none";
    this.overlay.setAttribute("aria-hidden", "true");
  }

  // call each frame while active; returns progress 0..1
  update(dt) {
    if (!this.active) return 0;
    this.t += dt;
    const p = Math.min(1, this.t / this.duration);
    this._render(p);
    if (p >= 1) {
      this.active = false;
      this.overlay.style.opacity = "0";
      this.overlay.style.display = "none";
      this.overlay.setAttribute("aria-hidden", "true");
      this.onComplete();
    }
    return p;
  }

  _render(p) {
    const inner = 34 - p * 26; // vignette tightens inward as it charges
    this.overlay.style.background =
      `radial-gradient(circle at 50% 52%, rgba(${GREEN},${0.04 + p * 0.22}) ${inner}%, rgba(7,14,8,${0.18 + p * 0.55}) 100%)`;
    this.fill.style.width = (p * 100).toFixed(1) + "%";
  }

  get progress() { return this.active ? Math.min(1, this.t / this.duration) : 0; }
}
