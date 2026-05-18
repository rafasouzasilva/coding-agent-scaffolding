# Note: monorepo scoping

If `backend/` and `web/` (or equivalent) live in the same repo, you have
one extra question to answer: when a spec touches only one area, should
the harness run *everything* or only the relevant slice?

The honest answer is **everything, but in two phases**:

1. **During implementation**, run only the affected area's checks. This
   keeps the inner loop fast and avoids the agent waiting on irrelevant
   frontend tests while iterating on a Python service.
2. **Before marking the spec `implemented`**, run the full harness. Skipping
   the other side is how cross-cutting bugs ship — a Pydantic model
   change quietly breaks the generated frontend types, and you don't
   find out until next sprint.

Mechanically:

- The spec's per-spec `harness.md` declares scoped commands relevant to
  the area it touches.
- The global `HARNESS.md` declares the full battery.
- `verify-harness` always runs the global gates last. Per-spec gates are
  for speed; global gates are the contract.

If your harness commands take longer than a couple of minutes total,
split them: a `quick` set (lint + typecheck + unit tests) and a `full`
set that also runs integration/e2e. Run `quick` per iteration and `full`
before status change. Encode the split with section headers (e.g.,
`## Executable checks (quick)` and `## Executable checks (full)`) and
extend `check-harness.mjs` to take a `--scope quick` flag if you go that
direction.
