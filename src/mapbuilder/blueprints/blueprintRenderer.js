// Dev-only top-down SVG renderer for a blueprint object. Pure + deterministic:
// the same blueprint + options always produce the same string (no Date/random),
// so it is safe to snapshot in tests and to generate a committed SVG. Works in
// both Node (SVG file generation / tests) and the browser (dev preview page).

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function renderBlueprintSVG(bp, opts = {}) {
  const S = opts.cellPx || 18;
  const PAD = opts.pad ?? 34;
  const cols = bp.grid.cols, rows = bp.grid.rows;
  const W = cols * S + PAD, H = rows * S + PAD;
  const X = (c) => +(PAD + c * S).toFixed(1);
  const Y = (r) => +(PAD + r * S).toFixed(1);
  const bandColor = new Map((bp.elevationBands || []).map((b) => [b.id, b.color]));
  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="monospace" data-blueprint="${esc(bp.id)}">`);
  out.push(`<rect width="${W}" height="${H}" fill="#0a0c08"/>`);
  out.push(`<text x="${W / 2}" y="18" fill="#cfe0cf" font-size="14" text-anchor="middle" font-weight="bold">${esc(bp.title || bp.id)}  ·  grid ${cols}x${rows} (N up, W left)</text>`);

  // grid + rulers
  const step = opts.gridStep || 5;
  for (let c = 0; c <= cols; c += step) {
    out.push(`<line x1="${X(c)}" y1="${Y(0)}" x2="${X(c)}" y2="${Y(rows)}" stroke="#ffffff" stroke-opacity="0.06"/>`);
    out.push(`<text x="${X(c)}" y="${PAD - 6}" fill="#7a8a7a" font-size="10" text-anchor="middle">${c}</text>`);
  }
  for (let r = 0; r <= rows; r += step) {
    out.push(`<line x1="${X(0)}" y1="${Y(r)}" x2="${X(cols)}" y2="${Y(r)}" stroke="#ffffff" stroke-opacity="0.06"/>`);
    out.push(`<text x="${PAD - 8}" y="${Y(r) + 4}" fill="#7a8a7a" font-size="10" text-anchor="end">${r}</text>`);
  }

  const rectFor = (b, fill, op, stroke = "none", sw = 0, dash = "") => {
    const da = dash ? ` stroke-dasharray="${dash}"` : "";
    return `<rect x="${X(b.col)}" y="${Y(b.row)}" width="${(b.w * S).toFixed(1)}" height="${(b.h * S).toFixed(1)}" fill="${fill}" fill-opacity="${op}" stroke="${stroke}" stroke-width="${sw}"${da} data-zone="1"/>`;
  };

  // zones (floors first, then platform/ward/pit on top), in declared order = deterministic
  for (const z of bp.zones || []) {
    const isPit = z.band === "pit" || z.kind === "pit";
    const fill = bandColor.get(z.band) || "#444";
    const op = z.kind === "spawn-room" ? 0.85 : isPit ? 0.95 : 0.8;
    out.push(rectFor(z.bounds, fill, op, isPit ? "#e0883a" : (z.kind === "platform" ? "#9ea66e" : "none"), isPit || z.kind === "platform" ? 1.6 : 0, isPit ? "5 4" : ""));
    if (z.label && (opts.labels !== false)) {
      out.push(`<text x="${X(z.bounds.col + z.bounds.w / 2)}" y="${Y(z.bounds.row + z.bounds.h / 2) + 4}" fill="#0d0d08" font-size="10" text-anchor="middle" font-weight="bold">${esc(z.label)}</text>`);
    }
  }

  // stairs
  for (const s of bp.stairs || []) out.push(rectFor(s.bounds, "#9a824e", 0.92, "#c8a85e", 1));

  // routes (lane intent) — optional
  if (opts.routes !== false) {
    const palette = ["#ff9f43", "#ff5d5d", "#ffe14a", "#4ad6ff", "#c08bff", "#7CFC00"];
    (bp.routes || []).forEach((rt, i) => {
      const pts = (rt.points || []).map((p) => `${X(p.col + 0.5)},${Y(p.row + 0.5)}`).join(" ");
      out.push(`<polyline points="${pts}" fill="none" stroke="${palette[i % palette.length]}" stroke-width="2.2" stroke-opacity="0.85" stroke-dasharray="6 4"/>`);
    });
  }

  // chokes
  for (const c of bp.chokes || []) out.push(`<circle cx="${X(c.cell.col + 0.5)}" cy="${Y(c.cell.row + 0.5)}" r="6" fill="none" stroke="#e0883a" stroke-width="2.2"/>`);

  // gates A-E (+ main star)
  for (const g of bp.gates || []) {
    const main = g.importance === "main";
    const x = X(g.cell.col + 0.5), y = Y(g.cell.row + 0.5);
    out.push(`<circle cx="${x}" cy="${y}" r="11" fill="${main ? "#e8c24a" : "#070707"}" fill-opacity="0.95" stroke="#e8c24a" stroke-width="${main ? 3 : 1.5}"/>`);
    out.push(`<text x="${x}" y="${y + 5}" fill="${main ? "#1a1a1a" : "#ffe14a"}" font-size="13" text-anchor="middle" font-weight="bold">${esc(g.label)}</text>`);
    out.push(`<text x="${x}" y="${y - 15}" fill="#ffe14a" font-size="10" text-anchor="middle">${main ? "MAIN GATE ★" : esc(g.wall || "")}</text>`);
  }

  // ward + hero
  if (bp.ward?.cell) {
    out.push(`<circle cx="${X(bp.ward.cell.col + 0.5)}" cy="${Y(bp.ward.cell.row + 0.5)}" r="7" fill="#5cff8f"/>`);
    out.push(`<text x="${X(bp.ward.cell.col + 0.5)}" y="${Y(bp.ward.cell.row + 0.5) - 12}" fill="#5cff8f" font-size="11" text-anchor="middle" font-weight="bold">${esc(bp.ward.label || "WARD")}</text>`);
  }
  if (bp.heroSpawn?.cell) out.push(`<circle cx="${X(bp.heroSpawn.cell.col + 0.5)}" cy="${Y(bp.heroSpawn.cell.row + 0.5)}" r="5" fill="#37d6ff"/>`);

  // elevation legend
  const bands = bp.elevationBands || [];
  const lx = X(cols) - 2 - 232, ly0 = Y(rows) - 2 - bands.length * 16 - 6;
  out.push(`<rect x="${lx - 8}" y="${ly0 - 16}" width="240" height="${bands.length * 16 + 24}" fill="#000" fill-opacity="0.6" stroke="#333"/>`);
  out.push(`<text x="${lx}" y="${ly0 - 4}" fill="#9fb89f" font-size="10" text-anchor="start">ELEVATION (low → high)</text>`);
  bands.forEach((b, i) => {
    const yy = ly0 + i * 16 + 8;
    out.push(`<rect x="${lx}" y="${yy - 10}" width="14" height="12" fill="${b.color}" stroke="#555" stroke-width="0.5"/>`);
    out.push(`<text x="${lx + 22}" y="${yy}" fill="#cfe0cf" font-size="10" text-anchor="start">${esc(b.label)} (${b.height})</text>`);
  });

  out.push("</svg>");
  return out.join("\n");
}

export default renderBlueprintSVG;
