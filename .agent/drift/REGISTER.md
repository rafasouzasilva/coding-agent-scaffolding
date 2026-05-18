# Drift register

> A lightweight acknowledgment that code shipped without going through
> the full spec flow. Append a YAML block when you (or your agent) make
> changes that didn't start from an accepted spec.
>
> **This is not a punishment.** Some work doesn't need a spec; the
> register exists so the system *knows* that, instead of guessing.

## How to use

Append an entry under "## Entries" below. Each entry is YAML inside
a fenced code block, like the examples. Three fields are required
(`ref`, `kind`, `one_line`); the rest are optional but recommended.

```yaml
- date: YYYY-MM-DD
  ref: <commit-sha or PR number — required>
  kind: hotfix | bugfix | refactor | feature | experiment | chore
  area: <module / feature area, free text>
  one_line: "Required — one sentence on what changed"
  spec_status: not-applicable | needed | deferred
  superseded_specs: []   # spec_ids made obsolete by this change
  follow_up_spec: NNNN   # if a spec was later written for this, link it
  notes: "Optional — anything the next reader needs to know"
```

### When to mark `spec_status`

- **`not-applicable`** — work that genuinely doesn't merit a spec:
  dependency bumps, renames, internal refactors with no behavior
  change, fixing obvious typos, formatting. The default-honest answer
  for the majority of small changes.

- **`needed`** — work that *should* have been spec-driven and you
  know it. Get on `reconcile-drift` soon. Examples: shipped a new
  user-visible feature under deadline; fixed a bug whose fix changes
  behavior in non-obvious ways; introduced a new module.

- **`deferred`** — work that probably deserves a spec, but writing
  one now isn't the right move (the team is mid-sprint, the change is
  experimental, the right person to write it isn't around). Flag and
  move on; reconcile-drift will surface it later.

### What about hotfixes?

Hotfixes are why this file exists. The flow is:
1. Ship the fix.
2. Within 24 hours, append an entry here with `kind: hotfix` and
   `spec_status: needed` (or `not-applicable` if the fix is genuinely
   trivial).
3. The next reconciliation pass picks it up.

Do not write a spec *before* a hotfix. The cost of doing so is
exactly what makes spec systems get bypassed.

## Entries

<!--
Append below this comment. Keep entries in reverse chronological order
(newest first) so recent work is visible without scrolling.
-->

```yaml
# Example entry — delete this once you have real entries
- date: 2026-05-18
  ref: example-not-real
  kind: chore
  area: tooling
  one_line: "Set up the drift register file in a new project"
  spec_status: not-applicable
  notes: "Replace this with a real entry; this is just a format demo."
```
