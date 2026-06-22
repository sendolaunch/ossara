// Tiny dash-cooldown indicator for the hub. A small pip near the bottom of the
// screen: a dark wedge sweeps away as the dash recharges, and the pip glows green
// when the dash is ready again. hub3d feeds it the remaining-cooldown fraction
// each frame (1 = just used, 0 = ready).

export class DashPip {
  constructor(uiRoot) {
    this.el = document.createElement("div");
    Object.assign(this.el.style, {
      position: "absolute", bottom: "22px", left: "50%", transform: "translateX(-50%)",
      width: "30px", height: "30px", borderRadius: "50%",
      border: "1.5px solid #6ee65a", background: "rgba(7,8,6,0.6)",
      zIndex: "5", pointerEvents: "none", overflow: "hidden",
      transition: "box-shadow .15s, border-color .15s, opacity .2s",
      boxShadow: "0 0 10px rgba(110,230,90,0.55)",
    });

    // dark wedge that covers the pip and shrinks (conic) as it cools down
    this.sweep = document.createElement("div");
    Object.assign(this.sweep.style, { position: "absolute", inset: "0", borderRadius: "50%", background: "transparent" });

    this.icon = document.createElement("div");
    Object.assign(this.icon.style, {
      position: "absolute", inset: "0", display: "flex", alignItems: "center", justifyContent: "center",
      font: "800 15px 'Cinzel', ui-monospace, monospace", color: "#E9E4D2",
    });
    this.icon.textContent = "»";

    this.el.appendChild(this.sweep);
    this.el.appendChild(this.icon);
    (uiRoot || document.body).appendChild(this.el);
    this._cooling = -1;
  }

  // frac = remaining cooldown fraction (1 just used → 0 ready)
  update(frac) {
    frac = Math.max(0, Math.min(1, frac));
    if (frac === this._cooling) return;
    this._cooling = frac;
    if (frac <= 0) {
      this.el.style.borderColor = "#6ee65a";
      this.el.style.boxShadow = "0 0 10px rgba(110,230,90,0.55)";
      this.icon.style.color = "#E9E4D2";
      this.sweep.style.background = "transparent";
    } else {
      this.el.style.borderColor = "#7c6f55";
      this.el.style.boxShadow = "none";
      this.icon.style.color = "#7c6f55";
      this.sweep.style.background = `conic-gradient(rgba(0,0,0,0.6) ${frac * 360}deg, rgba(0,0,0,0) 0)`;
    }
  }
}
