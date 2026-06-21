// Shared ornate UI theme — DD-style chrome in the OSSARA palette (§12).
// Injects a stylesheet + the display font once, and exposes the brand mask SVG.

let injected = false;

export function injectTheme() {
  if (injected) return;
  injected = true;

  // fantasy display font
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=EB+Garamond:ital@0;1&display=swap";
  document.head.appendChild(link);

  const css = `
  .oss-screen{
    position:absolute; inset:0; display:none; flex-direction:column;
    align-items:center; justify-content:center; gap:22px; overflow:hidden;
    color:#E9E4D2; font-family:'EB Garamond', Georgia, serif;
    background:
      radial-gradient(ellipse at 18% 12%, rgba(110,230,90,0.14), transparent 42%),
      radial-gradient(ellipse at 82% 14%, rgba(200,161,74,0.12), transparent 42%),
      radial-gradient(ellipse at 50% 125%, rgba(110,230,90,0.10), transparent 55%),
      repeating-linear-gradient(0deg, transparent 0 46px, rgba(255,255,255,0.018) 46px 48px),
      repeating-linear-gradient(90deg, transparent 0 92px, rgba(0,0,0,0.25) 92px 96px),
      linear-gradient(180deg, #0c0e08 0%, #060704 100%);
  }
  .oss-screen::after{ /* vignette */
    content:""; position:absolute; inset:0; pointer-events:none;
    box-shadow: inset 0 0 220px 60px rgba(0,0,0,0.85);
    background: radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(0,0,0,0.55) 100%);
  }
  .oss-fog{ position:absolute; inset:-10% -10% auto -10%; height:60%; pointer-events:none;
    background: radial-gradient(ellipse at 30% 0%, rgba(110,230,90,0.10), transparent 60%),
                radial-gradient(ellipse at 75% 10%, rgba(110,230,90,0.07), transparent 55%);
    animation: ossFog 14s ease-in-out infinite alternate; filter: blur(6px);}
  @keyframes ossFog{ from{ transform:translateX(-3%);} to{ transform:translateX(4%);} }
  @keyframes ossFlick{ 0%,100%{opacity:.9} 45%{opacity:.6} 70%{opacity:1} }

  .oss-title{ font-family:'Cinzel', serif; font-weight:900; letter-spacing:10px;
    color:#F2EDDC; text-shadow:0 0 18px rgba(110,230,90,0.45), 0 3px 6px #000; margin:0; }
  .oss-tag{ font-family:'Cinzel', serif; letter-spacing:5px; text-transform:uppercase;
    color:#6EE65A; font-size:13px; }
  .oss-h2{ font-family:'Cinzel', serif; font-weight:700; letter-spacing:6px; color:#F2EDDC;
    text-shadow:0 0 12px rgba(110,230,90,0.35); margin:0 0 6px; }

  /* carved gold frame around a dark parchment panel */
  .oss-frame{ position:relative; padding:5px; border-radius:16px;
    background:linear-gradient(150deg,#e0bb63 0%,#7a5d24 28%,#caa24c 55%,#5c451c 80%,#d8b25a 100%);
    box-shadow:0 10px 40px rgba(0,0,0,0.7), 0 0 0 1px #2a2010; }
  .oss-inner{ background:
      radial-gradient(ellipse at 50% 0%, rgba(110,230,90,0.06), transparent 60%),
      linear-gradient(180deg,#17150e 0%, #0d0c08 100%);
    border-radius:12px; padding:22px 26px; }
  .oss-frame::before, .oss-frame::after{ content:""; position:absolute; width:14px; height:14px;
    background:#e7c971; transform:rotate(45deg); box-shadow:0 0 8px rgba(231,201,113,0.7); }
  .oss-frame::before{ top:-3px; left:50%; margin-left:-7px; }
  .oss-frame::after{ bottom:-3px; left:50%; margin-left:-7px; }

  .oss-btn{ cursor:pointer; font-family:'Cinzel', serif; font-weight:700; letter-spacing:2px;
    color:#E9E4D2; padding:11px 22px; border-radius:9px; border:2px solid #5c4a1f;
    background:linear-gradient(180deg,#34362a 0%, #181a11 100%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 8px rgba(0,0,0,0.6);
    transition:all .12s ease; }
  .oss-btn:hover{ border-color:#caa24c; color:#fff;
    box-shadow:inset 0 1px 0 rgba(255,255,255,0.12), 0 0 16px rgba(110,230,90,0.45); }
  .oss-btn.primary{ color:#1a160a; border-color:#f0d98c;
    background:linear-gradient(180deg,#e8c96f 0%, #b6862d 100%); }
  .oss-btn.primary:hover{ box-shadow:0 0 22px rgba(110,230,90,0.6); }
  .oss-btn.ghost{ background:linear-gradient(180deg,#1d1f16,#101108); }

  .oss-arrow{ cursor:pointer; font-family:'Cinzel',serif; font-size:34px; line-height:1;
    color:#caa24c; background:none; border:none; padding:8px 14px; text-shadow:0 0 10px rgba(0,0,0,.8);
    transition:all .12s ease; }
  .oss-arrow:hover{ color:#6EE65A; transform:scale(1.15); }

  .oss-muted{ color:#8f886f; }
  .oss-gold{ color:#caa24c; }
  .oss-plague{ color:#6EE65A; }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
}

// OSSARA brand mask (the plague-doctor coin mark, from §12 / hollow-brand.html).
export function maskSVG(size = 150) {
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 200 200" aria-label="OSSARA mask"
       style="filter:drop-shadow(0 0 22px rgba(110,230,90,0.55)) drop-shadow(0 6px 10px #000)">
    <defs>
      <radialGradient id="ossGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#aaff88"/><stop offset="55%" stop-color="#6EE65A"/>
        <stop offset="100%" stop-color="#2c6b27"/>
      </radialGradient>
      <linearGradient id="ossBone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#F2EDDC"/><stop offset="100%" stop-color="#cfc7af"/>
      </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="96" fill="#0c0e0b" stroke="#caa24c" stroke-width="3"/>
    <circle cx="100" cy="100" r="86" fill="none" stroke="#5c451c" stroke-width="1.5"/>
    <path d="M100 38 C 66 38, 46 64, 46 96 C 46 128, 74 158, 100 178 C 126 158, 154 128, 154 96 C 154 64, 134 38, 100 38 Z"
          fill="url(#ossBone)" stroke="#8f886f" stroke-width="2"/>
    <path d="M100 40 L100 120" stroke="#b9b29a" stroke-width="2" opacity="0.5"/>
    <path d="M100 96 L84 150 M100 96 L116 150" stroke="#a59d83" stroke-width="2" opacity="0.6"/>
    <circle cx="78" cy="92" r="15" fill="#0c0e0b" stroke="#8f886f" stroke-width="3"/>
    <circle cx="122" cy="92" r="15" fill="#0c0e0b" stroke="#8f886f" stroke-width="3"/>
    <circle cx="78" cy="92" r="8" fill="url(#ossGlow)"/>
    <circle cx="122" cy="92" r="8" fill="url(#ossGlow)"/>
    <path d="M76 44 L82 34 L90 42 L100 30 L110 42 L118 34 L124 44"
          fill="none" stroke="#6EE65A" stroke-width="2" opacity="0.4" stroke-linejoin="round"/>
  </svg>`;
}
