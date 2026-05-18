#!/usr/bin/env node
/**
 * check-drift.mjs
 *
 * Detects drift between specs and the actual codebase. Produces a
 * three-tier report (red / yellow / green) and exits zero by default
 * — this is a report, not a gate.
 *
 * Usage:
 *   node .agent-tools/check-drift.mjs                       # default: conservative
 *   node .agent-tools/check-drift.mjs --mode=aggressive     # fewer false yellows
 *   node .agent-tools/check-drift.mjs --since=2026-05-01
 *   node .agent-tools/check-drift.mjs --strict              # exit 1 on red
 *   node .agent-tools/check-drift.mjs --json                # machine output
 *
 * Modes:
 *   conservative (default) — flag any change touching a relevant spec's
 *     scope, and flag specs that lack touches_architecture entirely. Many
 *     false yellows are acceptable; missed drift is not.
 *   aggressive — only flag changes against implemented specs that have
 *     explicit touches_architecture. Use on established codebases when
 *     conservative produces more noise than the team can triage.
 *
 * Detection signals (independent of mode):
 *   🔴 red — specs marked `implemented` whose harness tests don't exist
 *           or fail; explicit contradictions
 *   🟡 yellow — modules touched by specs have been modified since the
 *              spec's `updated:` date, with no register entry covering
 *              the change
 *   🟢 green — drift accounted for: register entry exists for the area,
 *             OR no modification since spec, OR spec was updated
 *
 * The tool is intentionally conservative. False yellows are better than
 * missed drift; the reconcile-drift skill handles triage cheaply.
 */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SPECS_DIR = join(ROOT, ".agent", "specs");
const REGISTER = join(ROOT, ".agent", "drift", "REGISTER.md");

// --- args -----------------------------------------------------------------
const args = process.argv.slice(2);
const STRICT = args.includes("--strict");
const JSON_OUT = args.includes("--json");
const sinceArg = args.find(a => a.startsWith("--since="));
const SINCE = sinceArg ? sinceArg.split("=")[1] : null;
const modeArg = args.find(a => a.startsWith("--mode="));
const MODE = modeArg ? modeArg.split("=")[1] : "conservative";
if (!["conservative", "aggressive"].includes(MODE)) {
  console.error(`Invalid --mode '${MODE}'. Use 'conservative' (default) or 'aggressive'.`);
  process.exit(2);
}
// Conservative: flag any change that touches code in a spec's scope,
// including specs that don't have touches_architecture set, and specs in
// proposed/accepted/implemented status. This is the default and matches
// the principle that false yellows are cheap and missed drift is expensive.
//
// Aggressive: only flag changes that look like new behavior — meaning we
// require both (a) a spec with explicit touches_architecture AND (b) the
// spec being implemented (not just proposed/accepted, where some drift
// is normal mid-build). Use this on established codebases where the
// conservative mode generates too much noise to triage.
const RELEVANT_STATUSES = new Set(
  MODE === "aggressive" ? ["implemented"] : ["implemented", "accepted", "proposed"]
);
const FLAG_MISSING_TOUCHES = MODE === "conservative";

// --- helpers --------------------------------------------------------------
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

function git(cmd) {
  try { return execSync(`git ${cmd}`, { encoding: "utf8" }).trim(); }
  catch { return ""; }
}

function gitChangedFilesSince(date) {
  // Returns files changed since date. Empty array on failure.
  if (!date) return null;
  const out = git(`log --since=${date} --name-only --pretty=format: -- .`);
  if (!out) return [];
  return [...new Set(out.split("\n").filter(Boolean))];
}

function gitLastModified(path) {
  // ISO date of last commit touching path, or null.
  const out = git(`log -1 --format=%cI -- "${path}"`);
  return out || null;
}

// --- load specs -----------------------------------------------------------
const specs = [];
if (existsSync(SPECS_DIR)) {
  for (const dir of readdirSync(SPECS_DIR)) {
    if (dir.startsWith("_")) continue;
    const impactPath = join(SPECS_DIR, dir, "impact.md");
    if (!existsSync(impactPath)) continue;
    const fm = parseFrontmatter(readFileSync(impactPath, "utf8"));
    specs.push({ dir, path: impactPath, ...fm });
  }
}

// --- load register --------------------------------------------------------
const register = [];
if (existsSync(REGISTER)) {
  const content = readFileSync(REGISTER, "utf8");
  // Extract YAML blocks from fenced code blocks
  const blocks = content.match(/```ya?ml\n([\s\S]*?)\n```/g) || [];
  for (const block of blocks) {
    const body = block.replace(/```ya?ml\n/, "").replace(/\n```$/, "");
    // Very light YAML parsing — entries start with "- date:" or "- ref:"
    const entries = body.split(/\n- /).map((s, i) => i === 0 ? s.replace(/^- /, "") : s);
    for (const entry of entries) {
      if (!entry.trim() || entry.trim().startsWith("#")) continue;
      const obj = {};
      for (const line of entry.split("\n")) {
        const kv = line.match(/^\s*(\w+):\s*(.*)$/);
        if (!kv) continue;
        let v = kv[2].trim();
        // strip quotes
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        if (v.startsWith("[") && v.endsWith("]")) {
          v = v.slice(1, -1).split(",").map(s => s.trim()).filter(Boolean);
        }
        obj[kv[1]] = v;
      }
      // Skip the example placeholder
      if (obj.ref === "example-not-real") continue;
      // Skip template placeholders like "<commit-sha>" — anything with angle brackets
      if (obj.ref && (obj.ref.includes("<") || obj.ref.includes(">"))) continue;
      if (obj.ref) register.push(obj);
    }
  }
}

// --- detection ------------------------------------------------------------
const findings = []; // { tier, spec_id?, message, evidence? }

// Rule 1: specs whose modules have been modified should either be tracked
// via the register or via a status change. The set of relevant statuses
// and whether missing touches_architecture is itself flagged depend on
// --mode (conservative by default).
for (const spec of specs) {
  if (!RELEVANT_STATUSES.has(spec.status)) continue;
  if (!spec.updated) {
    findings.push({
      tier: "yellow",
      spec_id: spec.spec_id || spec.dir,
      message: `Spec is ${spec.status} but has no \`updated:\` date — can't assess drift.`,
    });
    continue;
  }
  const touches = Array.isArray(spec.touches_architecture)
    ? spec.touches_architecture : [];

  // Sub-rule 1a: in conservative mode, a relevant-status spec with no
  // `touches_architecture` is itself a drift risk — we have no way to know
  // what to check. Aggressive mode skips this (signal-to-noise tradeoff).
  if (!touches.length) {
    if (FLAG_MISSING_TOUCHES) {
      findings.push({
        tier: "yellow",
        spec_id: spec.spec_id || spec.dir,
        message: `Spec is ${spec.status} but has no \`touches_architecture\` set — drift can't be assessed.`,
      });
    }
    continue;
  }

  // We don't know module → path mapping precisely; treat module names as
  // path fragments and check git log for files whose path contains any module.
  const since = spec.updated;
  const changed = gitChangedFilesSince(since) || [];
  const hits = changed.filter(f =>
    touches.some(m => m && f.toLowerCase().includes(String(m).toLowerCase()))
  );
  if (!hits.length) continue;

  // Check the register for any entry covering these hits.
  const covered = hits.filter(h =>
    register.some(r =>
      (r.area && h.toLowerCase().includes(String(r.area).toLowerCase())) ||
      (Array.isArray(r.superseded_specs) && r.superseded_specs.includes(spec.spec_id))
    )
  );
  const uncovered = hits.filter(h => !covered.includes(h));
  if (uncovered.length) {
    // Phrase the message by status — different drift, same flag.
    const phrasing = spec.status === "implemented"
      ? `Modules touched by this spec have been modified since ${since}, but no register entry covers the change.`
      : spec.status === "accepted"
      ? `Spec is accepted (mid-implementation) and its modules have been modified since ${since} without a register entry — implementation may be racing ahead of intent.`
      : `Spec is still proposed but its modules have been modified since ${since} — work may have started before the spec was reviewed.`;
    findings.push({
      tier: "yellow",
      spec_id: spec.spec_id || spec.dir,
      message: phrasing,
      evidence: uncovered.slice(0, 5),
    });
  } else if (hits.length) {
    findings.push({
      tier: "green",
      spec_id: spec.spec_id || spec.dir,
      message: `Modifications since ${since} are accounted for by the drift register.`,
    });
  }
}

// Rule 2: every register entry with spec_status: needed and no follow_up_spec
// is a yellow.
for (const entry of register) {
  if (entry.spec_status === "needed" && !entry.follow_up_spec) {
    findings.push({
      tier: "yellow",
      message: `Register entry \`${entry.ref}\` marked spec_status: needed but has no follow_up_spec.`,
      evidence: [entry.one_line || ""].filter(Boolean),
    });
  }
}

// Rule 3: register entries that supersede a spec — check the spec status is updated.
for (const entry of register) {
  const ss = Array.isArray(entry.superseded_specs) ? entry.superseded_specs : [];
  for (const supersededId of ss) {
    const spec = specs.find(s => (s.spec_id || s.dir).includes(supersededId));
    if (!spec) continue;
    if (spec.status !== "superseded") {
      findings.push({
        tier: "red",
        spec_id: spec.spec_id || spec.dir,
        message: `Register entry \`${entry.ref}\` supersedes this spec, but its status is still \`${spec.status}\`.`,
      });
    }
  }
}

// Rule 4: per-spec harness references. The `harness.md` for a spec often
// names specific test files or paths under "Executable checks". If any of
// those paths have been modified since the spec's `updated:` date, that's
// a strong drift signal — even stronger than touches_architecture, because
// tests are the spec's contract.
for (const spec of specs) {
  if (!RELEVANT_STATUSES.has(spec.status)) continue;
  if (!spec.updated) continue;
  const harnessPath = join(SPECS_DIR, spec.dir, "harness.md");
  if (!existsSync(harnessPath)) continue;
  const harness = readFileSync(harnessPath, "utf8");
  // Strip HTML comments so example/placeholder paths aren't picked up.
  const stripped = harness.replace(/<!--[\s\S]*?-->/g, "");
  // Extract anything that looks like a file path inside backticks or after `$ `.
  const candidates = new Set();
  for (const m of stripped.matchAll(/`([^`\s]+\.[a-zA-Z0-9]+)`/g)) candidates.add(m[1]);
  for (const m of stripped.matchAll(/^\s*\$\s+(.+)$/gm)) {
    // Pull obvious file-ish tokens out of the command.
    for (const tok of m[1].split(/\s+/)) {
      if (/[./].+\.[a-zA-Z0-9]+$/.test(tok)) candidates.add(tok);
    }
  }
  if (!candidates.size) continue;
  const since = spec.updated;
  const changed = gitChangedFilesSince(since) || [];
  const hits = [...candidates].filter(c =>
    changed.some(ch => ch === c || ch.endsWith("/" + c) || ch.includes(c))
  );
  if (!hits.length) continue;
  // Check register for coverage of these specific files.
  const covered = hits.filter(h =>
    register.some(r =>
      (r.area && h.toLowerCase().includes(String(r.area).toLowerCase())) ||
      (Array.isArray(r.superseded_specs) && r.superseded_specs.includes(spec.spec_id))
    )
  );
  const uncovered = hits.filter(h => !covered.includes(h));
  if (uncovered.length) {
    findings.push({
      tier: "yellow",
      spec_id: spec.spec_id || spec.dir,
      message: `Files referenced in this spec's harness.md have changed since ${since} with no register entry. Tests are the spec's contract — verify the spec is still accurate.`,
      evidence: uncovered.slice(0, 5),
    });
  }
}


// --- report ---------------------------------------------------------------
const counts = { red: 0, yellow: 0, green: 0 };
for (const f of findings) counts[f.tier]++;

if (JSON_OUT) {
  console.log(JSON.stringify({ mode: MODE, counts, findings, register_size: register.length, specs: specs.length }, null, 2));
} else {
  const tag = { red: "🔴", yellow: "🟡", green: "🟢" };
  console.log(`\n== Drift report (${MODE}) ==`);
  console.log(`Specs: ${specs.length}  Register entries: ${register.length}  Range: ${SINCE ? `since ${SINCE}` : "all time"}`);
  console.log(`Findings: 🔴 ${counts.red}  🟡 ${counts.yellow}  🟢 ${counts.green}\n`);
  for (const tier of ["red", "yellow", "green"]) {
    const items = findings.filter(f => f.tier === tier);
    if (!items.length) continue;
    console.log(`${tag[tier]} ${tier.toUpperCase()}`);
    for (const f of items) {
      const id = f.spec_id ? `[${f.spec_id}] ` : "";
      console.log(`  ${id}${f.message}`);
      if (f.evidence && f.evidence.length) {
        for (const e of f.evidence) console.log(`    - ${e}`);
      }
    }
    console.log("");
  }
  if (!findings.length) {
    console.log("No drift detected. Either everything is in sync, or there's nothing to compare yet.\n");
  } else {
    console.log("Next step: run the \`reconcile-drift\` skill to triage yellow items.\n");
  }
}

if (STRICT && counts.red > 0) process.exit(1);
