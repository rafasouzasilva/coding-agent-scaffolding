# Agent-Driven Project Template

A reusable structure for projects developed primarily through coding agents.
Combines four ideas:

1. **Spec-driven development (SDD)** — every feature has a written spec
   before code is written
2. **A harness** — boundaries the agent must satisfy before declaring done
3. **An architecture document** — the technical *how*, separate from the
   feature *what*, to reduce output variation
4. **An evolutive history view** — generated HTML showing how the project
   grew, what depends on what, and what changed when

Influences: Matt Pocock's [skills](https://github.com/mattpocock/skills)
repo (composable skills, `CONTEXT.md`, ADRs, the grilling pattern) and
Karpathy's observations on agent failure modes (silent assumptions, scope
creep, overconfident completion).

## Quickstart

```bash
# 1. Copy this template into your new project
cp -r agent-project-template/ my-new-project/
cd my-new-project/

# 2. Open AGENTS.md in your editor. Skim it. That's the agent's entrypoint.

# 3. Fill in CONTEXT.md, ARCHITECTURE.md, HARNESS.md with your project's
#    starting facts. Keep them short — they grow as you go.

# 4. Delete the example spec
rm -rf .agent/specs/0001-example-feature

# 5. Start a coding agent. Tell it: "Use the grill-spec skill to write our
#    first spec for X." It will read AGENTS.md, then CONTEXT.md, then ask
#    you the right questions.

# 6. After implementation:
node .agent-tools/check-harness.mjs 0001-your-spec
node .agent-tools/build-history.mjs
open docs/history/index.html
```

## The loop

```
   rough idea / "is this even the right thing to build?"
        │
        ▼
   [ideate]   ← standalone chat, no project loaded
   product-thinking discussion: benchmarks, horizon,
   ambitious framings, risks. Driven by user's interest.
        │
        ▼
   product-brief-<slug>-<date>.md   ← single file the user saves
        │
        │  (user takes the file to the project repo,
        │   runs a coding agent there)
        ▼
   [grill-spec — Path B = grounding phase]
        │   reconciles product intent with project reality,
        │   surfaces conflicts, resolves open decisions,
        │   translates intent to behavioral requirements
        │
        │  OR, when no exploration is needed:
        │
   [grill-spec — Path A]   ← straight from idea to draft spec
        │
        ▼
   .agent/specs/NNNN-x/{SPEC,harness,impact}.md
        │
   human reviews; status → accepted
        │
        ▼
   [implement-spec] ──▶ code
        │
        ▼
   [verify-harness] ──▶ pass / fail
        │
        ▼  pass
   status: implemented
        │
        ▼
   [update-history] ──▶ docs/history/index.html
```

`ideate` and `grill-spec` Path B form a deliberate two-stage flow:

- **Stage 1 (ideate):** product thinking, without project constraints.
  What's the right idea? Who's done it before? What's the ambitious
  version? What does it enable next? This stage diverges before it
  converges; Claude contributes benchmarks and opinions actively.
- **Stage 2 (grill-spec Path B, "grounding"):** translate product
  intent into a structured spec for *this* project. Surface conflicts
  between the brief and the codebase, resolve open decisions, convert
  product-level shape into testable behavioral requirements.

The separation matters: product thinking gets corrupted by premature
implementation concerns; specifications get hollow without strategic
context. Each stage protects the other.

Skip ideate when the idea is clear enough that exploration isn't
needed — go straight to `grill-spec` Path A.

## Why this structure

**Specs separate from code.** The spec stays readable after the code
changes. New agents drop in and read intent, not just implementation.

**Harness as a contract, not a hope.** Agents over-claim success. The
harness is the only thing that catches it consistently. Two layers with
distinct jobs: **gates** (executable: typecheck, tests, lint, build) that
fail loudly and block, and **audits** (declarative: judgment-based rules
the agent self-checks and surfaces honestly). Executable-only misses
judgment failures. Declarative-only is the agent grading its own
homework. Both, with gates blocking and audits surfacing, is the
combination that actually works.

**Architecture as the "how".** Most spec systems describe *what* a feature
does. They don't tell the agent *how* to build it consistently with the
rest of the project. `ARCHITECTURE.md` is that constraint. It's why the
output stops drifting between specs.

**History generated, not authored.** If you have to remember to update a
history doc, you won't. The frontmatter in each spec's `impact.md` is the
seam: write it once when you write the spec, and the history view is
always current.

**Skills are small and composable.** Following Pocock: four bootstrap
skills you own, plus whatever you adapt from his repo. Avoid frameworks
that own the whole workflow.

## What this is NOT

- A framework. There's no runtime, no installer. It's a folder layout
  and ~300 lines of vanilla JS.
- Locked to one agent. `AGENTS.md` is the entrypoint convention multiple
  tools now respect. Skills are plain markdown.
- A replacement for thinking. The grilling phase is where the actual
  design work happens. The structure just makes sure it happens.

## When code ships without a spec

The spec flow above is the right path for most feature work, but it's
not the *only* path. Hotfixes, small bugfixes, refactors, and changes
a senior dev knows are right — these can land without a spec. The cost
of admission for skipping the flow is one line in
`.agent/drift/REGISTER.md`:

```yaml
- date: 2026-05-18
  ref: abc1234
  kind: hotfix
  area: payment-service
  one_line: "Fixed race condition in payment retry"
  spec_status: needed   # or not-applicable, or deferred
```

**Code review is where drift gets caught.** The `review-change` skill
walks a reviewer through a PR end-to-end: intent vs. effect, spec
alignment, drift surfacing, cross-cutting concerns. Drift findings get
turned into register entries or spec updates that land *with* the PR,
before merge. Catching drift before merge beats catching it after by
a wide margin — the author still has context, the reviewer is right
there, and nothing has been built on top of the divergence yet.

`.agent-tools/check-drift.mjs` is the underlying detection tool. It
produces a three-tier report:
- 🔴 **Red:** explicit inconsistency (spec says X, code says not-X)
- 🟡 **Yellow:** code area changed without spec update or register entry
- 🟢 **Green:** drift accounted for

The `review-change` skill calls it for per-PR drift surfacing. You can
also run it directly for periodic audits, or wire it into CI as a
safety net with `--strict` (which exits 1 on red). CI is the *last*
line of defense, not the first.

For accumulated drift (a backlog of yellow items, or work that
slipped past review), the `reconcile-drift` skill handles triage:
most items are 10-second `not-applicable` register entries; some are
small spec updates; a few escalate to real new specs via `grill-spec`.

The point is that drift is *information*, not a defect. A growing
yellow count means the team has been shipping without specs; an
accumulating red count means the specs are folklore. Both are
addressable — but only if you can see them.

## Files at a glance

```
AGENTS.md                          canonical entrypoint (all agents)
.agent/
  CONTEXT.md                       shared language, invariants
  ARCHITECTURE.md                  technical how
  HARNESS.md                       gates (executable) + audits (declarative)
  agents/                          adapters for specific tools — optional
    claude-code.md                   → copy to CLAUDE.md
    github-copilot.md                → copy to .github/copilot-instructions.md
    devin.md                         → Devin Playbook + Knowledge instructions
    devin-blueprint.example.yaml     → copy to .devin/blueprint.yaml
  specs/_template/                 starting point for new specs
  specs/NNNN-name/
    SPEC.md                        behavior
    harness.md                     per-spec checks
    impact.md                      frontmatter → history view
  adr/                             architectural decisions
  discovery/                       reverse-engineering artifacts
  drift/
    README.md                      drift philosophy
    REGISTER.md                    one-liner log of un-spec'd changes
  skills/                          ideate, grill-spec, implement-spec,
                                   verify-harness, update-history,
                                   reverse-engineer, reconcile-drift,
                                   review-change
  starter-packs/                   optional paste-in content for common stacks
    python-fastapi-frontend/         Python + FastAPI + LangGraph/Pydantic-AI + Angular/React
.agent-tools/
  check-harness.mjs                executable check runner
  validate-specs.mjs               frontmatter validator (CI)
  build-history.mjs                generates docs/history/index.html
  check-drift.mjs                  reports drift between specs and code
docs/history/                      GENERATED — do not edit
src/                               your code (or backend/ + web/ for full-stack)
```

## Onboarding an existing codebase

If you're adopting this template on a project that already has code:
**don't write the docs by hand**. Use the `reverse-engineer` skill in
`.agent/skills/reverse-engineer/`. It runs in three phases:

1. **Survey** the codebase, identify candidate areas to document, stop
2. **Reverse-engineer** one area at a time, producing draft specs at
   `status: discovered` plus `FINDINGS.md` for bugs and ambiguities
3. **Backfill** `ARCHITECTURE.md` and `CONTEXT.md` from accumulated specs

The `discovered` status means "describes observed behavior, not
verified intent." A human review pass converts it to `proposed` /
`accepted` / `implemented`. Detailed walkthrough in
`.agent/skills/reverse-engineer/ONBOARDING.md`.

## Stacks

The template's core is stack-neutral. Concrete starting content for common
stacks lives under `.agent/starter-packs/`. To bootstrap a Python +
FastAPI + LangGraph/Pydantic-AI project with an Angular or React frontend:

```bash
# Read the pack's README, then merge each *.snippet.md into the
# corresponding .agent/*.md, trimming what doesn't apply.
cat .agent/starter-packs/python-fastapi-frontend/README.md
```

The packs are paste-in references, not active code. After applying one,
nothing in the tooling knows or cares — the files under `.agent/` are
the source of truth.

## Working with multiple agents

The repo is structured so the *same* `.agent/` directory drives any tool.
Activate the adapter for each tool that's actually working in the repo:

```bash
# Claude Code (reads CLAUDE.md, also reads AGENTS.md natively)
cp .agent/agents/claude-code.md CLAUDE.md

# GitHub Copilot (IDE Chat / code review path)
mkdir -p .github && cp .agent/agents/github-copilot.md .github/copilot-instructions.md
# (Copilot's coding agent reads AGENTS.md natively, so for that path no
# adapter is strictly needed)

# Devin
# 1. Paste the Playbook from .agent/agents/devin.md into Devin → Library → Playbooks
# 2. cp .agent/agents/devin-blueprint.example.yaml .devin/blueprint.yaml  (then edit)
# 3. Add a Knowledge entry in Devin's UI pointing at AGENTS.md
```

All adapters delegate to the same `.agent/` content. You can have several
installed at once — they don't conflict because none of them duplicates
context, they only point at it.
