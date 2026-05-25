---
name: update-history
trigger: after any spec status change; after ADRs are added
---

# Skill: update-history

Regenerate the HTML history view from the current state of specs and ADRs.

## When to use

- A spec moved from `proposed` to `accepted`
- A spec moved from `accepted` to `implemented`
- A spec was superseded
- A new ADR was added

## Steps

1. **Verify `.agent/ROADMAP.md` reflects the new state** before
   regenerating anything. The skill that triggered this run
   (`implement-spec` step 8, `grill-spec`, or a manual status flip)
   should already have updated ROADMAP.md. If it didn't, fix it now
   — ROADMAP.md is what the next session (after `/clear`) reads to
   know what's done and what's next. The generated HTML view is for
   humans; ROADMAP.md is for the next agent.

2. Run `node .agent-tools/build-history.mjs`. It reads every
   `specs/*/impact.md` frontmatter and every `adr/*.md`, and writes:
   - `docs/history/data.json` — machine-readable
   - `docs/history/index.html` — the visualization

3. **Do not hand-edit anything in `docs/history/`.** It's generated.
   Source of truth is the spec and ADR files plus `ROADMAP.md`.

4. If the build fails, the most common cause is malformed frontmatter in
   an `impact.md`. Report which file and what's wrong. Do not silently
   "fix" frontmatter — confirm with the user.

5. **If this run completes a spec** (i.e. you were just invoked because
   a spec moved to `implemented`), close by recommending the user run
   `/clear` before starting the next spec. Tell them: "ROADMAP.md is
   current and history is rebuilt. Recommend `/clear` — the next
   session will read `.agent/ROADMAP.md` to know what's next." The
   full implement-spec cycle typically accumulates 100k+ tokens of
   file reads, test output, and harness reports — carrying that into
   the next spec wastes cached-input cost on every subsequent turn.
