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
3. **`.agent/ROADMAP.md`** — the project's *current state*: what's
   implemented, what's accepted, what's proposed, what's planned, and
   what the immediate next spec is. This is the file a fresh session
   (e.g. after a `/clear` or equivalent reset) reads to know where to
   pick up. Hand-maintained by `grill-spec`, `implement-spec` step 8,
   and verified by `update-history`.
4. **`.agent/HARNESS.md`** — the global boundaries you must satisfy before
   declaring any task complete. These are non-negotiable.
5. **`.agent/specs/`** — feature specifications. Each folder is one SDD.
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
- `reconcile-drift` — periodic catch-up flow for code that shipped without
  going through the spec flow (hotfixes, refactors, exploratory work)
- `review-change` — walk a reviewer through a PR or branch end-to-end:
  intent vs. effect, spec alignment, drift surfacing, cross-cutting
  concerns, and ready-to-post review comments

## Choosing the right starting skill

- **"I want to think through whether this is even the right idea"** →
  `ideate` in a separate chat
- **"I have a product brief, ground it in this project"** → `grill-spec`
  Path B
- **"I have a clear feature in mind, no need to explore"** → `grill-spec`
  Path A
- **"The spec is ready, build it"** → `implement-spec`
- **"This existing codebase has no docs"** → `reverse-engineer`
- **"We've been shipping without specs, catch up the docs"** →
  `reconcile-drift`
- **"Review this PR / branch / change before merge"** → `review-change`

## Direct-to-code is allowed

The spec flow above is the right path for most feature work, but you do
not have to go through it. Hotfixes, small bugfixes, refactors,
exploratory work, and changes a senior dev knows are right — these can
land without a spec. **The cost of admission for skipping the flow is
one line in `.agent/drift/REGISTER.md`.**

When you (or your agent) ship without a spec:
1. Add a YAML entry to `.agent/drift/REGISTER.md` with the commit/PR
   ref, what changed, and whether a spec is `not-applicable`, `needed`,
   or `deferred`.
2. The `check-drift.mjs` tool will surface unaccounted-for changes in
   CI as 🟡 yellow.
3. The `reconcile-drift` skill handles periodic cleanup.

This is deliberate: the system that's strict enough to be respected is
the one that gets bypassed silently. Acknowledged drift is information;
silent drift is rot.

### Proactive register prompts (mandatory for agents)

You — the agent — must **proactively bring up the register** when the
user is doing direct-to-code work that's substantive enough to deserve
acknowledgment. Do not wait for them to remember; they're not going to.

**When to prompt.** Recommend a register entry when you've helped with,
or are about to commit, any of:

- A change that adds, removes, or modifies a **public API surface**
  (HTTP endpoint, exported function signature, CLI flag, message schema)
- A change that adds or removes a **module, file, or package** at any
  level
- A change that modifies behavior of code under any existing spec's
  `touches_architecture`
- A **bugfix that changes observable behavior** (not "the error message
  is now clearer" — "the function now returns null instead of throwing")
- An **experiment or spike that's being kept** (not throwaway exploration)
- More than ~50 lines of changes across more than 2 files, unless those
  changes are obviously cosmetic (formatting, comments, rename)

**When NOT to prompt.** Don't be annoying about it. Skip the prompt for:

- Typo fixes, formatting, dependency bumps, internal renames
- Changes you made while implementing an accepted spec (those go through
  the normal flow — `implement-spec` → `verify-harness`)
- Changes the user explicitly said are throwaway / exploratory
- A change that the user just added a register entry for in the same
  session

**How to prompt.** Surface it once, plainly, without nagging:

> Heads up — this change <names the trigger above>. Worth a one-liner
> in `.agent/drift/REGISTER.md`? I can draft the entry. Likely
> `spec_status: not-applicable` (just an internal refactor) | `needed`
> (this affects behavior we'd want to spec) | `deferred` (worth a spec,
> but not now).

If the user says yes, draft the YAML entry (you have the commit info
and a one-line description from your own work) and append it to the
register. If they say no or ignore the prompt, do not re-raise it for
the same change in the same session.

**Why this matters.** Direct-to-code work that isn't acknowledged is
exactly the failure mode the drift system exists to prevent. Without
proactive prompts, the register stays empty even on a healthy team —
because nobody remembers to update it mid-coding. The mandate is on
you, not on the human.

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
