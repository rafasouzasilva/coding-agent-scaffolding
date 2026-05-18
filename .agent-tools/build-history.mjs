#!/usr/bin/env node
/**
 * build-history.mjs
 *
 * Reads every spec's impact.md frontmatter and every ADR, produces:
 *   docs/history/data.json    machine-readable
 *   docs/history/index.html   visualization (timeline + graph + matrix + decisions)
 *
 * The HTML is self-contained — no build step, no node_modules. Open it.
 */

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SPECS_DIR = join(ROOT, ".agent", "specs");
const ADR_DIR = join(ROOT, ".agent", "adr");
const OUT_DIR = join(ROOT, "docs", "history");

function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2];
    if (!(v.trim().startsWith("[") && v.includes("]"))) {
      const hash = v.indexOf("#");
      if (hash >= 0) v = v.slice(0, hash);
    } else {
      const closeIdx = v.lastIndexOf("]");
      const tail = v.slice(closeIdx + 1);
      const hash = tail.indexOf("#");
      if (hash >= 0) v = v.slice(0, closeIdx + 1 + hash);
    }
    v = v.trim();
    if (v.startsWith("[") && v.endsWith("]")) {
      v = v.slice(1, -1).split(",").map(s => s.trim()).filter(Boolean);
    }
    out[kv[1]] = v;
  }
  return out;
}

function parseAdr(content, filename) {
  const titleMatch = content.match(/^#\s+(.+)/m);
  const statusMatch = content.match(/##\s+Status\s*\n+\s*([^\n]+)/i);
  const idMatch = filename.match(/^(\d+)/);
  const status = statusMatch ? statusMatch[1].trim() : "unknown";
  const dateMatch = status.match(/(\d{4}-\d{2}-\d{2})/);
  return {
    file: filename,
    id: idMatch ? "ADR-" + idMatch[1] : filename,
    title: titleMatch ? titleMatch[1] : filename,
    status: status.split("—")[0].trim().toLowerCase(),
    date: dateMatch ? dateMatch[1] : null,
  };
}

const specs = [];
if (existsSync(SPECS_DIR)) {
  for (const dir of readdirSync(SPECS_DIR)) {
    if (dir.startsWith("_")) continue;
    const impact = join(SPECS_DIR, dir, "impact.md");
    if (!existsSync(impact)) continue;
    const fm = parseFrontmatter(readFileSync(impact, "utf8"));
    specs.push({ dir, ...fm });
  }
}

const adrs = [];
if (existsSync(ADR_DIR)) {
  for (const f of readdirSync(ADR_DIR)) {
    if (!f.endsWith(".md")) continue;
    adrs.push(parseAdr(readFileSync(join(ADR_DIR, f), "utf8"), f));
  }
}

const data = { generated: new Date().toISOString(), specs, adrs };
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "data.json"), JSON.stringify(data, null, 2));

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Project history</title>
<style>
  :root {
    --bg: #0f1115; --fg: #e8eaed; --muted: #8a93a3; --line: #232733;
    --proposed: #d4a017; --accepted: #4fa3ff; --implemented: #4caf83; --superseded: #6b6b6b;
    --discovered: #e07b5f;
    --adr: #b07cf0;
  }
  body { margin: 0; font: 14px/1.5 -apple-system, system-ui, sans-serif; background: var(--bg); color: var(--fg); }
  header { padding: 24px 32px; border-bottom: 1px solid var(--line); }
  h1 { margin: 0 0 4px; font-size: 20px; font-weight: 600; }
  .meta { color: var(--muted); font-size: 12px; }
  nav { display: flex; gap: 8px; padding: 12px 32px; border-bottom: 1px solid var(--line); flex-wrap: wrap; }
  nav button { background: transparent; color: var(--fg); border: 1px solid var(--line); padding: 6px 14px; border-radius: 6px; cursor: pointer; font: inherit; }
  nav button.active { background: var(--line); }
  main { padding: 24px 32px; }
  .view { display: none; }
  .view.active { display: block; }

  .timeline { border-left: 2px solid var(--line); padding-left: 20px; }
  .entry { margin-bottom: 24px; position: relative; }
  .entry::before { content: ""; position: absolute; left: -27px; top: 6px; width: 10px; height: 10px; border-radius: 50%; background: var(--muted); }
  .entry.proposed::before { background: var(--proposed); }
  .entry.accepted::before { background: var(--accepted); }
  .entry.implemented::before { background: var(--implemented); }
  .entry.superseded::before { background: var(--superseded); }
  .entry.discovered::before { background: var(--discovered); }
  .entry.adr::before { background: var(--adr); border-radius: 2px; transform: rotate(45deg); }
  .entry h3 { margin: 0; font-size: 15px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-left: 8px; vertical-align: middle; }
  .badge.proposed { background: rgba(212,160,23,.15); color: var(--proposed); }
  .badge.accepted { background: rgba(79,163,255,.15); color: var(--accepted); }
  .badge.implemented { background: rgba(76,175,131,.15); color: var(--implemented); }
  .badge.superseded { background: rgba(107,107,107,.2); color: var(--superseded); text-decoration: line-through; }
  .badge.discovered { background: rgba(224,123,95,.15); color: var(--discovered); }
  .badge.adr { background: rgba(176,124,240,.15); color: var(--adr); }
  .meta-row { color: var(--muted); font-size: 12px; margin-top: 4px; }
  .links { margin-top: 6px; font-size: 12px; }
  .links span { margin-right: 12px; }

  #graph-svg { width: 100%; height: 600px; border: 1px solid var(--line); border-radius: 8px; background: #0a0c10; display: block; }
  .node text { font: 12px sans-serif; fill: var(--fg); }
  .link { stroke: var(--muted); stroke-opacity: .6; fill: none; }

  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--line); font-size: 13px; vertical-align: top; }
  th { color: var(--muted); font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; }
  code { background: var(--line); padding: 1px 6px; border-radius: 4px; font-size: 12px; }
  .legend { display: flex; gap: 16px; font-size: 12px; color: var(--muted); margin-bottom: 12px; }
  .legend span::before { content: "●"; margin-right: 4px; }
  .legend .l-proposed::before { color: var(--proposed); }
  .legend .l-accepted::before { color: var(--accepted); }
  .legend .l-implemented::before { color: var(--implemented); }
  .legend .l-superseded::before { color: var(--superseded); }
  .legend .l-discovered::before { color: var(--discovered); }
  .legend .l-adr::before { color: var(--adr); content: "◆"; }
</style>
</head>
<body>
<header>
  <h1>Project history</h1>
  <div class="meta">Generated ${data.generated} · ${specs.length} spec(s) · ${adrs.length} ADR(s)</div>
</header>
<nav>
  <button data-view="timeline" class="active">Spec timeline</button>
  <button data-view="decisions">Decisions (ADRs + specs)</button>
  <button data-view="graph">Dependencies</button>
  <button data-view="impact">Impact matrix</button>
</nav>
<main>
  <section id="timeline" class="view active">
    <div class="legend"><span class="l-discovered">discovered</span><span class="l-proposed">proposed</span><span class="l-accepted">accepted</span><span class="l-implemented">implemented</span><span class="l-superseded">superseded</span></div>
    <div class="timeline" id="timeline-list"></div>
  </section>
  <section id="decisions" class="view">
    <div class="legend"><span class="l-adr">ADR</span><span class="l-accepted">spec</span></div>
    <div class="timeline" id="decisions-list"></div>
  </section>
  <section id="graph" class="view">
    <div class="legend"><span class="l-proposed">proposed</span><span class="l-accepted">accepted</span><span class="l-implemented">implemented</span></div>
    <svg id="graph-svg"></svg>
  </section>
  <section id="impact" class="view"><table id="impact-table"></table></section>
</main>
<script>
const DATA = ${JSON.stringify(data)};

document.querySelectorAll('nav button').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('nav button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(b.dataset.view).classList.add('active');
    if (b.dataset.view === 'graph') drawGraph();
  };
});

// Spec timeline
const sortedSpecs = [...DATA.specs].sort((a,b) => (a.created||'').localeCompare(b.created||''));
document.getElementById('timeline-list').innerHTML = sortedSpecs.map(s => \`
  <div class="entry \${s.status||''}">
    <h3>\${s.spec_id||s.dir} — \${s.title||''}<span class="badge \${s.status}">\${s.status||'?'}</span></h3>
    <div class="meta-row">created \${s.created||'?'} · updated \${s.updated||'?'}</div>
    <div class="links">
      \${(s.depends_on||[]).length ? '<span>depends: ' + (s.depends_on||[]).join(', ') + '</span>' : ''}
      \${(s.supersedes||[]).length ? '<span>supersedes: ' + (s.supersedes||[]).join(', ') + '</span>' : ''}
      \${(s.touches_architecture||[]).length ? '<span>touches: ' + (s.touches_architecture||[]).join(', ') + '</span>' : ''}
      \${(s.adrs||[]).length ? '<span>adrs: ' + (s.adrs||[]).join(', ') + '</span>' : ''}
    </div>
  </div>\`).join('') || '<p style="color:var(--muted)">No specs yet.</p>';

// Decisions timeline: interleave ADRs with specs that reference them
const decisionEvents = [];
DATA.adrs.forEach(a => decisionEvents.push({ type: 'adr', date: a.date || '0000-00-00', item: a }));
DATA.specs.forEach(s => decisionEvents.push({ type: 'spec', date: s.created || '0000-00-00', item: s }));
decisionEvents.sort((a,b) => a.date.localeCompare(b.date));

document.getElementById('decisions-list').innerHTML = decisionEvents.map(e => {
  if (e.type === 'adr') {
    const a = e.item;
    const consumers = DATA.specs.filter(s => (s.adrs||[]).includes(a.id)).map(s => s.spec_id);
    return \`<div class="entry adr">
      <h3>\${a.id} — \${a.title}<span class="badge adr">\${a.status}</span></h3>
      <div class="meta-row">\${a.date || 'no date'} · <code>\${a.file}</code></div>
      \${consumers.length ? '<div class="links"><span>referenced by: ' + consumers.join(', ') + '</span></div>' : ''}
    </div>\`;
  }
  const s = e.item;
  return \`<div class="entry \${s.status||''}">
    <h3>\${s.spec_id||s.dir} — \${s.title||''}<span class="badge \${s.status}">\${s.status||'?'}</span></h3>
    <div class="meta-row">\${s.created || '?'}</div>
    \${(s.adrs||[]).length ? '<div class="links"><span>relies on: ' + (s.adrs||[]).join(', ') + '</span></div>' : ''}
  </div>\`;
}).join('') || '<p style="color:var(--muted)">No decisions yet.</p>';

// Impact matrix
const archModules = [...new Set(DATA.specs.flatMap(s => s.touches_architecture || []))].sort();
const matrixRows = DATA.specs.map(s => \`
  <tr>
    <td><code>\${s.spec_id||s.dir}</code></td>
    <td>\${s.title||''}</td>
    \${archModules.map(m => '<td>' + ((s.touches_architecture||[]).includes(m) ? '●' : '') + '</td>').join('')}
  </tr>\`).join('');
document.getElementById('impact-table').innerHTML = \`
  <thead><tr><th>Spec</th><th>Title</th>\${archModules.map(m => '<th>'+m+'</th>').join('')}</tr></thead>
  <tbody>\${matrixRows || '<tr><td colspan="' + (archModules.length+2) + '">No data</td></tr>'}</tbody>\`;

// Dependency graph
function drawGraph() {
  const svg = document.getElementById('graph-svg');
  const W = svg.clientWidth || 900, H = 600;
  svg.setAttribute('viewBox', \`0 0 \${W} \${H}\`);
  const layer = new Map();
  function depth(id, seen=new Set()) {
    if (layer.has(id)) return layer.get(id);
    if (seen.has(id)) return 0;
    seen.add(id);
    const s = DATA.specs.find(x => x.spec_id === id);
    const deps = s?.depends_on || [];
    const d = deps.length ? 1 + Math.max(...deps.map(d2 => depth(d2, seen))) : 0;
    layer.set(id, d); return d;
  }
  DATA.specs.forEach(s => depth(s.spec_id));
  const byLayer = {};
  for (const [id, l] of layer) (byLayer[l] = byLayer[l] || []).push(id);
  const maxL = Math.max(0, ...Object.keys(byLayer).map(Number));
  const pos = new Map();
  Object.entries(byLayer).forEach(([l, ids]) => {
    ids.forEach((id, i) => {
      pos.set(id, {
        x: 100 + (W-200) * (maxL ? l/maxL : 0.5),
        y: 60 + (H-120) * ((i + 0.5) / ids.length)
      });
    });
  });
  const colorFor = s => ({discovered:'#e07b5f',proposed:'#d4a017',accepted:'#4fa3ff',implemented:'#4caf83',superseded:'#6b6b6b'}[s.status] || '#8a93a3');
  let svgHtml = '';
  DATA.specs.forEach(s => {
    const p = pos.get(s.spec_id); if (!p) return;
    (s.depends_on||[]).forEach(dep => {
      const q = pos.get(dep); if (!q) return;
      svgHtml += \`<path class="link" d="M\${q.x},\${q.y} C\${(q.x+p.x)/2},\${q.y} \${(q.x+p.x)/2},\${p.y} \${p.x},\${p.y}" />\`;
    });
  });
  DATA.specs.forEach(s => {
    const p = pos.get(s.spec_id); if (!p) return;
    svgHtml += \`<g class="node" transform="translate(\${p.x},\${p.y})">
      <circle r="8" fill="\${colorFor(s)}" />
      <text x="14" y="4">\${s.spec_id}</text>
    </g>\`;
  });
  svg.innerHTML = svgHtml || '<text x="20" y="40" fill="#8a93a3">No specs yet.</text>';
}
</script>
</body>
</html>`;

writeFileSync(join(OUT_DIR, "index.html"), html);
console.log(`Wrote ${join(OUT_DIR, "index.html")} (${specs.length} specs, ${adrs.length} ADRs)`);
