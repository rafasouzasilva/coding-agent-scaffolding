# Discovery

This directory holds **process artifacts from the reverse-engineering
workflow** — the survey, findings, and completion summary produced when
onboarding an existing codebase into this template.

Files you'll find here:

- `SURVEY.md` — Phase 1 output from the `reverse-engineer` skill: the
  shape of the codebase and candidate areas to document.
- `COMPLETE.md` — Phase 3 summary: what was documented, coverage gaps,
  and recommendations for the human review pass.

Per-spec `FINDINGS.md` files live alongside their specs under
`.agent/specs/NNNN-x/FINDINGS.md`, not here.

## What about product briefs from the ideate skill?

The `ideate` skill runs in a **standalone chat outside the project repo**.
Its output is a single markdown file — a **product brief** — that the
user saves locally and brings into the project later for the grounding
phase (`grill-spec` Path B).

When `grill-spec` Path B creates a spec from a product brief, you can
optionally preserve the original brief next to the resulting spec:

```
.agent/specs/NNNN-x/
  SPEC.md
  harness.md
  impact.md
  BRIEF.md          ← original product brief, preserved
```

This is optional but recommended for foundation-level specs (those
marked as such in the Horizon section of the brief). The brief
contains strategic context — Why-this/why-now, Horizon, Innovation
framing, Discussion notes — that the structured spec doesn't fully
capture. Six months later, when someone asks "why is this spec
shaped this way?", the brief is the answer.

For leaf-level work, the brief can be discarded after grounding.

## Editing policy

Files in this directory are **read-mostly history**. Refer to them when
you need to understand decisions made during onboarding. Don't edit them
after creation; if findings change as you work on the code, that's a
new spec revision or follow-up, not an edit to the historical record.

The same applies to preserved `BRIEF.md` files in spec folders.
