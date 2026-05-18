# Agent Entrypoint

> **This file is the canonical instruction set for every agent working in
> this repo.** Tool-specific entrypoints (`CLAUDE.md`, `.cursor/rules/`,
> `.windsurfrules`, etc.) are thin adapters under `.agent/agents/` that
> all delegate here. If two sources of instructions ever conflict, this
> file wins.

You are working in a project that uses a five-layer spec-driven structure.
Before doing anything, read these in order:

1. **`.agent/CONTEXT.md`** — the project's ubiquitous language and invariants.
   Read this every session. If you don't know a term used here, stop and ask.
2. **`.agent/ARCHITECTURE.md`** — the technical *how*. Patterns, module
   boundaries, conventions you must follow.
3. **`.agent/HARNESS.md`** — the global boundaries you must satisfy before
   declaring any task complete. These are non-negotiable.
4. **`.agent/specs/`** — feature specifications. Each folder is one SDD.
   Read the SPEC.md for whatever you're working on, plus its `impact.md`
   and `harness.md`.

## Operating rules

- **Never declare a task done without running the harness.** Use the
  `verify-harness` skill. If you can't run it, say so explicitly.
- **Never silently extend scope.** If a request implies changes outside
  the current spec, stop and ask. Karpathy's failure mode #1.
- **Use the shared language from `CONTEXT.md`.** Don't invent new terms
  for concepts that already have names.
- **One change at a time.** Implement, verify, then propose the next step.
- **When proposing a new feature, write the spec first.** Use the
  `grill-spec` skill — do not jump to code.

## Available skills

Skills live in `.agent/skills/`. Read the relevant `SKILL.md` before invoking.

- `ideate` — *runs in a standalone chat, outside the project repo*.
  An open-ended product discussion: benchmarks, ambitious framings,
  horizon, risks. Produces a **product brief** (not a spec) that the
  user hands to a coding agent for grounding.
- `grill-spec` — Path A: rough idea → draft spec, inside the project.
  Path B (the **grounding phase**): product brief → draft spec,
  reconciling intent with project reality.
- `implement-spec` — execute an accepted SDD
- `verify-harness` — run the harness, report structured failures
- `update-history` — regenerate `docs/history/` after a spec changes state
- `reverse-engineer` — bring an existing codebase into this structure by
  reading the code and producing draft `discovered` specs

## Choosing the right starting skill

- **"I want to think through whether this is even the right idea"** →
  `ideate` in a separate chat. Open-ended product discussion. Produces
  a product brief.
- **"I have a product brief from ideate, ground it in this project"** →
  `grill-spec` Path B, in the project repo
- **"I have a clear feature in mind, no need to explore"** → `grill-spec`
  Path A directly in the project
- **"The spec is ready, build it"** → `implement-spec`
- **"This existing codebase has no docs"** → `reverse-engineer`

The two-stage flow (ideate → grill-spec Path B) separates *product
thinking* from *project grounding*. Skip ideate when the idea doesn't
need that exploration; skip grill-spec Path A when the idea does.

## State transitions for a spec

For new work:
`proposed` → (after grilling, impact analysis, human approval) → `accepted`
→ (after implementation passes harness) → `implemented`
→ (when a later spec replaces it) → `superseded`

For reverse-engineered work:
`discovered` (drafted from code) → (after human review converts descriptive
to prescriptive, resolves `[INFERRED]` tags, decides what's bug vs feature)
→ `proposed` or `accepted` (or rewritten before promotion)

A `discovered` spec is **descriptive**: this is what the code does today.
A `proposed`/`accepted` spec is **prescriptive**: this is what the code
should do. The conversion is human work, not agent work — see
`.agent/skills/reverse-engineer/SKILL.md` for why.

Update the `status` field in `specs/NNNN-x/impact.md`, then run
`update-history` so the history view stays in sync.
