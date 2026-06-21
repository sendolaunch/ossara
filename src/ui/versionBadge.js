// Commit-SHA version badge — the cheapest stale-deploy catcher (CLAUDE.md
// deploy-verify rule). Vite replaces __COMMIT_SHA__ at build time via a define
// in vite.config.js: on Vercel it's VERCEL_GIT_COMMIT_SHA (short), locally "dev".

const SHA = typeof __COMMIT_SHA__ !== "undefined" ? __COMMIT_SHA__ : "dev";

export function mountVersionBadge() {
  if (document.getElementById("oss-version")) return;
  const el = document.createElement("div");
  el.id = "oss-version";
  el.textContent = `OSSARA · ${SHA}`;
  Object.assign(el.style, {
    position: "fixed",
    bottom: "6px",
    right: "8px",
    font: "10px ui-monospace, monospace",
    color: "rgba(233,228,210,0.5)",
    letterSpacing: "0.5px",
    pointerEvents: "none",
    zIndex: "9999",
  });
  document.body.appendChild(el);
}
