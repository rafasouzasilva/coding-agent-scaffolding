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

1. Run `node .agent-tools/build-history.mjs`. It reads every
   `specs/*/impact.md` frontmatter and every `adr/*.md`, and writes:
   - `docs/history/data.json` — machine-readable
   - `docs/history/index.html` — the visualization

2. **Do not hand-edit anything in `docs/history/`.** It's generated.
   Source of truth is the spec and ADR files.

3. If the build fails, the most common cause is malformed frontmatter in
   an `impact.md`. Report which file and what's wrong. Do not silently
   "fix" frontmatter — confirm with the user.
