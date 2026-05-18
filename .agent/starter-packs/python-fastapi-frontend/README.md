# Starter pack: Python (FastAPI + LangGraph/Pydantic-AI) + Angular/React

This is a **paste-in starter** for projects with a Python backend and a
JS/TS frontend. Nothing in the template's core is stack-specific — these
files are reference content you copy into `CONTEXT.md`, `ARCHITECTURE.md`,
and `HARNESS.md`, then trim and adapt.

## How to apply

1. Open `CONTEXT.md`, `ARCHITECTURE.md`, `HARNESS.md` in this repo (the
   real ones, under `.agent/`, not in this pack).
2. Replace the placeholders with the corresponding section from this
   pack — or merge if you've already filled some in.
3. Delete what doesn't apply. **Aggressively.** A short, true harness
   beats a long, aspirational one.

## Files in this pack

- `CONTEXT.snippet.md` — domain vocabulary entries common to LLM-app
  projects (agent, graph, node, tool, etc.), so terminology is fixed early
- `ARCHITECTURE.snippet.md` — module boundaries, FastAPI conventions,
  LangGraph/Pydantic-AI patterns, frontend layering
- `HARNESS.snippet.md` — concrete executable checks (ruff, mypy, pytest,
  frontend lint/test) and judgment-based audits for the stack
- `monorepo-note.md` — how to scope harness commands when backend and
  frontend live in the same repo

## When this pack is wrong for you

If you don't use LangGraph or Pydantic-AI, delete those sections from
`ARCHITECTURE.snippet.md`. If you're React-only or Angular-only, delete
the other. If you're not actually monorepo, skip `monorepo-note.md`.

The pack exists to save typing, not to dictate. After applying it, none
of the template's tooling has any awareness that you applied a "pack" —
the files under `.agent/` are the source of truth, period.
