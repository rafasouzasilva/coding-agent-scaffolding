<!--
Install: copy or symlink this file to .github/copilot-instructions.md
  mkdir -p .github && cp .agent/agents/github-copilot.md .github/copilot-instructions.md

Note: Modern GitHub Copilot (coding agent and recent IDE versions) also reads
AGENTS.md at the repo root natively. If your team is fully on those versions,
this adapter is redundant. It exists to cover IDE versions and Copilot Chat
flows that still expect .github/copilot-instructions.md specifically.
-->

# GitHub Copilot instructions

This project uses an agent-agnostic structure. The canonical instructions
live in **`AGENTS.md`** at the repo root — read it before doing anything else.
If AGENTS.md and this file disagree, AGENTS.md wins.

Required reading order for every task:
1. `AGENTS.md`
2. `.agent/CONTEXT.md` — ubiquitous language and invariants
3. `.agent/ARCHITECTURE.md` — technical conventions
4. `.agent/HARNESS.md` — boundaries you must satisfy
5. The relevant spec folder under `.agent/specs/` if doing feature work

Use the skills in `.agent/skills/` for `grill-spec`, `implement-spec`,
`verify-harness`, and `update-history`. Run
`node .agent-tools/check-harness.mjs` before declaring any task complete.

## Path-specific guidance

If a task is scoped to a particular area, consult the corresponding file in
`.github/instructions/` (if any). Those files supplement, not replace, the
canonical sources above.
