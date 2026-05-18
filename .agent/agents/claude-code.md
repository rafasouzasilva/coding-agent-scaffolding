<!--
Install: copy or symlink this file to CLAUDE.md at the repo root.
  cp .agent/agents/claude-code.md CLAUDE.md
or
  ln -s .agent/agents/claude-code.md CLAUDE.md
-->

# Claude Code instructions

This project uses an agent-agnostic structure. Your real instructions live
in **`AGENTS.md`** at the repo root. Read it before doing anything else.

In particular, before any task:
1. Read `AGENTS.md`
2. Read `.agent/CONTEXT.md`, `.agent/ARCHITECTURE.md`, `.agent/HARNESS.md`
3. For feature work, read the relevant `.agent/specs/NNNN-x/` folder
4. Use the skills in `.agent/skills/` — invoke them by name when relevant

Do not duplicate or "summarize" the contents of `.agent/` into this file.
The whole point of the structure is one source of truth.
