const TYPE_COLORS = {
  note: "#8ab4f8",
  decision: "#f6a94a",
  task: "#63c19f",
  output: "#e07be0",
  reference: "#b0b7c3",
  department: "#5b6bd0",
  secretary: "#d99a2b",
  log: "#c9c9c9",
};

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

export function renderHtml({ nodes, edges, manifest }) {
  const dataJson = JSON.stringify({ nodes, edges, manifest }).replace(/</g, "\\u003c");
  const legend = Object.entries(TYPE_COLORS)
    .map(
      ([type, color]) =>
        `<span class="legend-item"><span class="dot" style="background:${color}"></span>${escapeHtml(
          type
        )}</span>`
    )
    .join("");

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>つながりの地図</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; font-family: system-ui, sans-serif; background: #0e0f13; color: #eee; }
  @media (prefers-color-scheme: light) { body { background: #f7f7f9; color: #222; } }
  header { padding: 12px 16px; border-bottom: 1px solid rgba(128,128,128,.3); }
  h1 { font-size: 15px; margin: 0 0 6px; }
  #legend { display: flex; flex-wrap: wrap; gap: 10px; font-size: 12px; }
  .legend-item { display: flex; align-items: center; gap: 4px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  #meta { font-size: 11px; opacity: .6; margin-top: 4px; }
  svg { width: 100%; height: calc(100vh - 90px); display: block; }
  .edge { stroke: #888; }
  .edge.inferred { stroke-dasharray: 4 3; }
  .node circle { stroke: rgba(0,0,0,.3); stroke-width: 1px; cursor: pointer; }
  .node text { font-size: 10px; fill: currentColor; pointer-events: none; }
  #tooltip {
    position: fixed; pointer-events: none; background: rgba(20,20,24,.95); color: #fff;
    border-radius: 6px; padding: 8px 10px; font-size: 12px; max-width: 280px; display: none; z-index: 10;
  }
</style>
</head>
<body>
<header>
  <h1>つながりの地図 (notes / decisions / tasks / outputs / references / secretary / departments)</h1>
  <div id="legend">${legend}</div>
  <div id="meta"></div>
</header>
<svg></svg>
<div id="tooltip"></div>
<script id="graph-data" type="application/json">${dataJson}</script>
<script>
(function () {
  const data = JSON.parse(document.getElementById("graph-data").textContent);
  const { nodes, edges, manifest } = data;
  const colors = ${JSON.stringify(TYPE_COLORS)};

  document.getElementById("meta").textContent =
    "生成日時: " + manifest.generatedAt + " / ノード: " + nodes.length + " / エッジ: " + edges.length;

  const svg = document.querySelector("svg");
  const ns = "http://www.w3.org/2000/svg";
  const width = svg.clientWidth || 900;
  const height = svg.clientHeight || 600;

  const sim = nodes.map((n, i) => ({
    ...n,
    x: width / 2 + Math.cos(i) * 200 + (Math.random() - 0.5) * 40,
    y: height / 2 + Math.sin(i) * 200 + (Math.random() - 0.5) * 40,
    vx: 0,
    vy: 0,
  }));
  const byId = new Map(sim.map((n) => [n.id, n]));

  function step() {
    for (const n of sim) {
      n.vx += (width / 2 - n.x) * 0.001;
      n.vy += (height / 2 - n.y) * 0.001;
    }
    for (let i = 0; i < sim.length; i++) {
      for (let j = i + 1; j < sim.length; j++) {
        const a = sim[i], b = sim[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const min = 60;
        if (dist < min) {
          const f = ((min - dist) / dist) * 0.5;
          a.vx += dx * f; a.vy += dy * f;
          b.vx -= dx * f; b.vy -= dy * f;
        }
      }
    }
    for (const e of edges) {
      const a = byId.get(e.from), b = byId.get(e.to);
      if (!a || !b) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const target = 140;
      const f = (dist - target) * 0.002;
      a.vx += dx * f; a.vy += dy * f;
      b.vx -= dx * f; b.vy -= dy * f;
    }
    for (const n of sim) {
      n.x += n.vx; n.y += n.vy;
      n.vx *= 0.75; n.vy *= 0.75;
      n.x = Math.max(20, Math.min(width - 20, n.x));
      n.y = Math.max(20, Math.min(height - 20, n.y));
    }
  }
  for (let i = 0; i < 300; i++) step();

  function el(tag, attrs) {
    const e = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    return e;
  }

  for (const e of edges) {
    const a = byId.get(e.from), b = byId.get(e.to);
    if (!a || !b) continue;
    const line = el("line", {
      class: "edge" + (e.source === "inferred" ? " inferred" : ""),
      x1: a.x, y1: a.y, x2: b.x, y2: b.y,
      "stroke-opacity": Math.max(0.15, e.confidence),
    });
    svg.appendChild(line);
  }

  const tooltip = document.getElementById("tooltip");
  for (const n of sim) {
    const g = el("g", { class: "node", transform: "translate(" + n.x + "," + n.y + ")" });
    const circle = el("circle", { r: 7, fill: colors[n.type] || "#999" });
    const label = el("text", { x: 10, y: 4 });
    label.textContent = n.title || n.id;
    g.appendChild(circle);
    g.appendChild(label);
    g.addEventListener("mouseenter", (ev) => {
      tooltip.style.display = "block";
      tooltip.innerHTML =
        "<strong>" + (n.title || n.id) + "</strong><br>type: " + n.type +
        "<br>path: " + n.path +
        (n.tags && n.tags.length ? "<br>tags: " + n.tags.join(", ") : "");
    });
    g.addEventListener("mousemove", (ev) => {
      tooltip.style.left = ev.clientX + 12 + "px";
      tooltip.style.top = ev.clientY + 12 + "px";
    });
    g.addEventListener("mouseleave", () => { tooltip.style.display = "none"; });
    svg.appendChild(g);
  }
})();
</script>
</body>
</html>
`;
}
