#!/usr/bin/env node
/**
 * validate-specs.mjs
 *
 * Sanity-checks every spec folder:
 * - has SPEC.md, harness.md, impact.md
 * - impact.md frontmatter parses and has required fields
 * - depends_on / supersedes reference real spec_ids
 *
 * Run in CI so malformed specs fail the build, not the history view.
 */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const SPECS = join(process.cwd(), ".agent", "specs");
const REQUIRED = ["spec_id", "title", "status", "created", "updated"];
const STATUSES = ["discovered", "proposed", "accepted", "implemented", "superseded"];

function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    const [, k, raw] = kv;
    // Strip trailing inline comments ("# ...") but only when not inside
    // a bracket list. Keeps "[a, b]" intact while removing trailing notes.
    let v = raw;
    if (!(v.trim().startsWith("[") && v.includes("]"))) {
      const hash = v.indexOf("#");
      if (hash >= 0) v = v.slice(0, hash);
    } else {
      // For bracket lists, only strip a comment after the closing bracket.
      const closeIdx = v.lastIndexOf("]");
      const tail = v.slice(closeIdx + 1);
      const hash = tail.indexOf("#");
      if (hash >= 0) v = v.slice(0, closeIdx + 1 + hash);
    }
    v = v.trim();
    if (v.startsWith("[") && v.endsWith("]")) {
      v = v.slice(1, -1).split(",").map(s => s.trim()).filter(Boolean);
    }
    out[k] = v;
  }
  return out;
}

const errors = [];
const specs = readdirSync(SPECS)
  .filter(n => !n.startsWith("_") && statSync(join(SPECS, n)).isDirectory());

const known = new Set(specs);

for (const dir of specs) {
  const base = join(SPECS, dir);
  for (const f of ["SPEC.md", "harness.md", "impact.md"]) {
    if (!existsSync(join(base, f))) errors.push(`${dir}: missing ${f}`);
  }
  const impactPath = join(base, "impact.md");
  if (!existsSync(impactPath)) continue;
  const fm = parseFrontmatter(readFileSync(impactPath, "utf8"));
  if (!fm) { errors.push(`${dir}: impact.md has no frontmatter`); continue; }
  for (const k of REQUIRED) if (!fm[k]) errors.push(`${dir}: missing ${k}`);
  if (fm.status && !STATUSES.includes(fm.status)) {
    errors.push(`${dir}: invalid status '${fm.status}'`);
  }
  for (const ref of [].concat(fm.depends_on || [], fm.supersedes || [])) {
    if (ref && !known.has(ref)) errors.push(`${dir}: unknown reference '${ref}'`);
  }
}

if (errors.length) {
  console.error("Spec validation failed:");
  errors.forEach(e => console.error("  - " + e));
  process.exit(1);
}
console.log(`OK: ${specs.length} spec(s) valid`);
