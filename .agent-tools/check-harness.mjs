#!/usr/bin/env node
/**
 * check-harness.mjs
 *
 * Runs executable harness checks for the global harness and (optionally)
 * a specific spec. Returns non-zero if anything fails.
 *
 * Usage:
 *   node .agent-tools/check-harness.mjs                # global only
 *   node .agent-tools/check-harness.mjs 0001-x         # global + spec
 *
 * Convention: any line in HARNESS.md or specs/NNNN/harness.md that starts
 * with "$ " (dollar-space) inside an "Executable checks" section is run.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const ROOT = process.cwd();
const AGENT = join(ROOT, ".agent");

function extractCommands(markdown) {
  // Strip HTML comments so example commands inside <!-- ... --> blocks
  // are not picked up. Only "live" $ lines should run.
  const stripped = markdown.replace(/<!--[\s\S]*?-->/g, "");
  // Find the "Executable checks" section and pull lines starting with `$ `
  const lines = stripped.split("\n");
  const cmds = [];
  let inSection = false;
  for (const line of lines) {
    if (/^##\s+Executable checks/i.test(line)) { inSection = true; continue; }
    if (inSection && /^##\s+/.test(line)) break;
    const m = line.match(/^\s*\$\s+(.+?)\s*$/);
    if (inSection && m) cmds.push(m[1]);
  }
  return cmds;
}

function run(cmd) {
  process.stdout.write(`  $ ${cmd}\n`);
  try {
    execSync(cmd, { stdio: "inherit" });
    return { cmd, ok: true };
  } catch (err) {
    return { cmd, ok: false, code: err.status ?? 1 };
  }
}

const results = [];

// Global harness
const globalPath = join(AGENT, "HARNESS.md");
if (existsSync(globalPath)) {
  console.log("\n== Global harness ==");
  const cmds = extractCommands(readFileSync(globalPath, "utf8"));
  if (cmds.length === 0) console.log("  (no executable checks defined)");
  for (const c of cmds) results.push(run(c));
}

// Per-spec harness
const specId = process.argv[2];
if (specId) {
  const specHarness = join(AGENT, "specs", specId, "harness.md");
  if (!existsSync(specHarness)) {
    console.error(`Spec harness not found: ${specHarness}`);
    process.exit(2);
  }
  console.log(`\n== Spec harness: ${specId} ==`);
  const cmds = extractCommands(readFileSync(specHarness, "utf8"));
  if (cmds.length === 0) console.log("  (no executable checks defined)");
  for (const c of cmds) results.push(run(c));
}

// Summary
const failed = results.filter(r => !r.ok);
console.log(`\n== Summary ==`);
console.log(`  Passed: ${results.length - failed.length}/${results.length}`);
if (failed.length) {
  console.log(`  Failed:`);
  failed.forEach(f => console.log(`    - ${f.cmd}`));
  process.exit(1);
}
