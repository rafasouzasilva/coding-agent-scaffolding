---
name: reconcile-drift
trigger: user wants to "reconcile drift", "catch up the docs", "process drift register", runs after `check-drift.mjs` shows yellow/red items, or runs when `review-change` surfaces drift findings that need triage
---

# Skill: reconcile-drift

A triage flow that turns drift signals into either resolved status
(most cases), updated specs (some cases), or new specs (the small set
that actually deserve them).

## Core stance

Drift reconciliation is not busywork. It's a triage activity: most items
take 10 seconds (mark not-applicable, move on), some take 1–2 minutes
(small impact.md update), and a few escalate to real spec work. Your job
is to route fast, not to over-engineer the small stuff.

You are not the reviewer-of-everything. You're a helpful assistant
walking the dev through their drift report and proposing the cheapest
resolution for each item. The dev confirms or redirects.

## When to use

The two primary use modes:

1. **During code review** — the `review-change` skill surfaced drift
   findings that the reviewer wants to triage now, before approving.
   Most common per-PR use. Findings are fresh, the author is reachable,
   and resolutions can land with the PR. Run with a tight scope: just
   the findings from this PR.

2. **Periodic catch-up** — the team runs reconciliation on a cadence
   (per-sprint, per-release) to clear accumulated yellow items that
   slipped past review. Broader scope; expect to walk through more
   items per session.

Less common:

- After a hotfix or rapid feature ship where the register has
  accumulated `needed` or `deferred` entries
- When you suspect drift but want to confirm — run
  `check-drift.mjs` first, then triage what it surfaces

## Steps

### 1. Run the drift report

```
node .agent-tools/check-drift.mjs
```

Read the output. Note the counts of 🔴 red, 🟡 yellow, 🟢 green.

### 2. Triage red items first

Red findings indicate explicit inconsistency: a spec says X, the code or
register says not-X. These can't be ignored without damaging the system's
credibility.

For each red item, ask the user:
- Is the spec correct? If yes: the code (or register) is wrong; the fix
  goes in code/register, not in the spec.
- Is the code correct? If yes: the spec needs updating — likely a status
  change to `superseded` plus a new spec capturing the actual current
  behavior.
- Is it a genuine contradiction nobody noticed? That's a finding — flag
  it, decide direction with the user, propose the smallest fix.

Never silently "fix" a red by editing the spec to match the code without
the user confirming that's the intent. The point of the spec was the
intent; if you erase the intent to match what happened, the spec system
becomes pointless.

### 3. Walk yellow items

Yellow items are "possible drift". For each one, present the dev with
three resolution options:

**Option A — Acknowledged, not-applicable.** The change was real but
doesn't merit a spec update. Action: append a register entry with
`spec_status: not-applicable`. Move on. This is the most common
resolution.

**Option B — Update the existing spec.** The change is a small extension
or correction to an existing spec. Action: update the spec's `SPEC.md`
(behavioral requirements, non-goals) and bump `updated:` in `impact.md`.
Optionally also update `harness.md` if acceptance criteria shifted.

**Option C — Write a new spec.** The change is significant enough to
deserve its own spec. Action: invoke `grill-spec` Path A on this change
specifically. The result is a new spec at `status: discovered` or
`status: proposed` (your call), capturing what was built post-hoc.

Propose the option you think fits, with one-sentence reasoning. The user
confirms or picks differently.

### 4. Walk the register's `needed` entries

For each register entry with `spec_status: needed` and no `follow_up_spec`:
- The dev knew, at the time, that this change deserved a spec.
- Apply the same A/B/C triage. Most of these route to B or C — A is
  unusual here because the dev already flagged the entry as `needed`.

After creating a follow-up spec, update the register entry to set
`follow_up_spec: NNNN` so future runs of the drift report show this as
green.

### 5. Walk the register's `deferred` entries

These are entries the dev decided to defer. Check whether deferral is
still appropriate:
- Has the deferred work landed? (Run git log on the area.)
- Has the situation that made it deferred changed?
- If still deferred and still appropriate: leave it. Note that you
  saw it.
- If no longer appropriate: A/B/C triage as above.

### 6. Summarize what was done

At the end, produce a short summary:

```
Reconciled <date>:
- 🔴 red items: <n resolved> (<list>)
- 🟡 yellow items: <n marked not-applicable, n spec updates, n new specs>
- Register `needed`: <n resolved with follow-up specs>
- Register `deferred`: <n still deferred, n promoted>

New specs created: <list>
Existing specs updated: <list>
Register entries added: <n>
```

Then suggest the dev run `node .agent-tools/build-history.mjs` and
`node .agent-tools/check-drift.mjs` to confirm clean state.

## Anti-patterns to avoid

- **Over-spec'ing trivia.** If a change is genuinely not-applicable
  (rename, dependency bump, typo), do not generate a spec for it.
  Mark and move on.

- **Silent spec rewriting.** When code and spec disagree, never edit
  the spec to match the code without the user confirming that's the
  intent. The disagreement is information; don't erase it.

- **Long sessions.** If the drift report has many items and the user
  is fatiguing, stop and propose continuing later. A half-done
  reconciliation is fine; a low-quality full one is worse.

- **Inventing register entries.** Don't write register entries for
  work you didn't see happen. The register is for changes the dev
  knows about. If `check-drift.mjs` flagged a yellow but the dev
  doesn't recognize the change, escalate — maybe it's someone else's
  work, or maybe the detector is over-firing.

- **Batching changes into one giant spec.** When multiple yellow items
  point at the same area, the temptation is to write one mega-spec
  covering them all. Resist unless they genuinely form one coherent
  feature. Two small specs are healthier than one bloated one.

## Speed expectations

A healthy team's reconciliation session should look like:

- 80% of items: 10-second `not-applicable` register entries
- 15% of items: 1–2 minute spec updates
- 5% of items: a `grill-spec` invocation for a real new spec

If a session is producing many new specs (say >5 in one sitting),
something's wrong upstream — either the team has been bypassing the
spec flow for substantial work, or `check-drift` is over-firing.
Surface this to the user; don't quietly produce 10 specs in one
session.

## What to do when in doubt

The honest default for an unclear item is: ask the user. They have
context this skill doesn't. A 30-second back-and-forth produces better
classification than a confident guess.

Three things to ask, in order:
1. "What was this change for?" (one sentence)
2. "Does any existing spec cover this?" (yes/no/partially)
3. "Is the behavior here something we'd want to test against, or is
    it implementation detail?"

The answers route cleanly to A / B / C.
