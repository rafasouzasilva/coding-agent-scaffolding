# Drift

> This directory exists because sometimes code ships without going
> through the full spec flow — and that's okay, as long as the
> system knows.

## The problem

The spec-driven flow (`ideate` → `grill-spec` → `implement-spec`) is
the right path for most feature work. But:

- A senior dev knows the codebase cold and wants to just write the code
- A bugfix or hotfix needs to ship in 20 minutes
- An exploratory refactor doesn't have a clear spec shape yet
- The work is so small that writing a spec costs more than the change

Forcing every line of code through specs would either get bypassed
silently (worst outcome — invisible drift) or slow the team down for
no benefit (also bad — spec systems get abandoned when they cost more
than they pay back).

## The approach

We accept that work happens outside the spec flow. We just make sure
the system *knows* it happened. Four pieces, with code review as the
**primary** surface where drift gets caught:

1. **`REGISTER.md`** — a lightweight log where devs append a one-line
   entry when they ship without a spec. 30 seconds of effort.

2. **`review-change` skill** — the primary surface. When the reviewer
   walks through a PR using this skill, it surfaces drift findings
   alongside spec-alignment checks and cross-cutting concerns. The
   reviewer decides what register entries or spec updates need to
   land *with* the change before merge. Catching drift before merge
   beats catching it after by a wide margin.

3. **`check-drift.mjs`** (in `.agent-tools/`) — the underlying
   detection tool. Called by `review-change`; also runnable directly
   for periodic audits or as an optional CI safety net. Reports drift
   in three tiers (red 🔴, yellow 🟡, green 🟢). Two modes:
   - `--mode=conservative` (default): flag any change touching a spec's
     scope, and flag specs that lack `touches_architecture` entirely.
     Best on most projects; false yellows are cheap.
   - `--mode=aggressive`: only flag changes against `implemented` specs
     with explicit `touches_architecture`. Use on established repos
     where conservative produces too much noise.

4. **`reconcile-drift` skill** (in `.agent/skills/`) — periodic
   catch-up. Reads the drift report, walks the dev through triage
   (mark not-applicable, update existing specs, write follow-up specs).
   Use this when drift has accumulated (a backlog of yellow items, or
   work that slipped past review uninspected). The per-PR review is
   the first line of defense; this is the cleanup pass.

## Where drift gets caught

Listed in order of preference — the earlier in the list, the better:

1. **Author proactively logs** — agent prompts the dev to add a
   register entry when shipping direct-to-code (`AGENTS.md` mandates
   this). 30 seconds, fresh context, zero coordination cost.

2. **Code review** — reviewer uses `review-change` and catches drift
   the author missed. Before merge, so it lands with the PR.

3. **Periodic reconciliation** — team runs `reconcile-drift` on a
   cadence (per-sprint, per-release). Catches drift that slipped past
   review. Costs more because context is older.

4. **CI safety net** (optional) — `check-drift.mjs --strict` runs in
   CI and fails on red findings. Catches what slipped past review and
   reconciliation. Costs the most because it can block a merge after
   approval, which is high-friction.

Most teams will use 1, 2, and 3. Add 4 only if those aren't enough.

## Health signals

You can tell at a glance whether the system is healthy:

- **Healthy:** Most register entries are `not-applicable` or have
  follow-up specs linked. Reviews catch drift before merge; the
  occasional yellow that slips through gets resolved at the next
  reconciliation.
- **Drifting:** 🟡 yellow items accumulate. The register has many
  `needed` entries with no follow-up spec. Reviews are skipping the
  drift step or rubber-stamping it.
- **Decoupled:** 🔴 red inconsistencies persist for weeks. Specs say
  one thing, code says another, nobody's reconciling. At this point,
  the specs are folklore; consider running `reverse-engineer` to
  rebuild ground truth.

The point is to make these signals visible so the team can act on them
before reaching the "decoupled" state.

## What this is NOT

- **Not a gate by default.** The drift check is a report; even in CI
  it doesn't block merges unless you opt in with `--strict`. Each
  project chooses whether to make any tier blocking.
- **Not auto-generated specs.** The register stays lightweight on
  purpose. Real specs require human decisions and shouldn't be
  spawned by every commit.
- **Not a coverage metric.** "Percentage of code covered by specs" is
  the wrong question. The right questions are: "is there inconsistency
  between docs and code?" and "is the team reconciling drift on a
  reasonable cadence?"
- **Not a substitute for the spec flow.** Most feature work should
  still start from a spec. The drift system is the safety net, not
  the path.
