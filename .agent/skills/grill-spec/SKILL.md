---
name: grill-spec
trigger: when the user proposes a new feature, change, or "let's add..."; or when the user hands you a product brief produced by the ideate skill
---

# Skill: grill-spec

Turn a rough idea — or a **product brief** from the `ideate` skill — into
a draft SDD. Inspired by Pocock's `/grill-with-docs`.

## Two entry paths

**Path A — rough idea in chat.** The user describes a feature
verbally. You run the full grilling described below.

**Path B — product brief from `ideate` (the grounding phase).** The
user attaches or pastes a markdown file produced by the `ideate`
skill (typically named `product-brief-<slug>-<date>.md`).

That file captures **product intent**, not feature requirements. It
was produced in a standalone discussion without project context. Your
job in Path B is the **grounding phase**: translating product intent
into a structured spec that fits this specific project. Specifically:

1. **Read the file end to end before anything else.** Pay attention
   to: Why-this/why-now, Shape, Horizon, Open decisions, and
   Discussion notes. The Horizon section in particular tells you
   what this spec is *for* in the longer arc — that matters when
   implementation choices arise.

2. **Reconcile against the project.** Read `.agent/ROADMAP.md` first
   (it tells you what's already implemented, accepted, proposed, and
   planned — including whether the brief's idea is already on the
   Horizon list), then `.agent/CONTEXT.md`, `.agent/ARCHITECTURE.md`,
   and every existing `impact.md` under `.agent/specs/`. Look for:
   - Terminology in the brief that conflicts with `CONTEXT.md`
   - "Touches" or shape elements that don't fit `ARCHITECTURE.md`'s
     module boundaries
   - Overlap with existing specs (the brief was written without
     knowing about them)
   - Foundational assumptions in the brief that the codebase doesn't
     support yet
   - **Inline mermaid diagrams** that the proposed shape would
     invalidate or extend. Walk each diagram in `ARCHITECTURE.md` /
     `CONTEXT.md`; if the new spec adds a persona, changes a
     boundary, or introduces a trust crossing the diagram doesn't
     show, name which diagrams the implementing change will need to
     update. The diagram update lands during `implement-spec`, but
     the obligation is surfaced here.

3. **Surface conflicts to the user before creating any files.**
   Present them as a list and ask which way to resolve each. Do NOT
   silently translate intent into implementation. Examples:
   - "The brief says X; the project uses term Y for the same concept.
     Update the brief, update CONTEXT.md, or note both?"
   - "The brief assumes capability Z; I don't see Z in the codebase.
     Is Z a prerequisite spec, or am I missing it?"
   - "The brief overlaps with spec NNNN-x in module M. Extension,
     replacement, or different problem?"

4. **Resolve open decisions.** The brief has an "Open decisions"
   section listing what was deliberately deferred. Grill the user
   on each, in project context. These are the decisions Path A would
   have produced through grilling — you're doing the same work, but
   informed by the brief's product framing.

5. **Translate intent to behavioral requirements.** The brief's
   "Shape" section is product-level ("the user experiences X"). You
   convert this to testable behavioral requirements ("the system does
   X when Y"). The brief deliberately left this work to you; do it
   carefully, and check your translation with the user before
   committing.

6. **Carry forward the strategic context.** Don't lose the brief's
   richer framing when you create the spec files. In particular:
   - The Horizon section informs `impact.md` — flag whether this is
     foundational or a leaf, and what follow-on specs are implied
   - Innovation framing and Discussion notes get summarized in
     `SPEC.md` (under "Context" or similar) so future readers
     understand *why* this spec exists, not just *what* it does

7. **Create the spec folder** with `status: proposed`. Reference the
   source brief at the top of `SPEC.md`:

   > **Source:** product brief from ideate session,
   > `<filename>`. Strategic context lives in that file; this spec
   > is the grounded form.

8. **Update `.agent/ROADMAP.md`** in the same change: add a one-line
   entry under "Proposed (drafted, not yet accepted)" referencing the
   new spec. If the brief's Horizon implied follow-on themes that
   aren't already on the planned/horizon list, append them there too
   — that's how the strategic context survives across `/clear`.

If the user just says "I have a feature idea" without pointing you at
a brief, you're on Path A.

## When to use (Path A)

The user describes something they want built and there is no spec for
it yet. Do **not** start coding. Do **not** write the spec without
asking questions.

## Steps (Path A)

1. **Read** `.agent/ROADMAP.md` first — it tells you the current focus,
   what's already implemented, what's accepted, what's proposed, and
   what's on the planned/horizon list (this idea may already be there,
   in which case you're drafting the spec the roadmap was pointing at).
   Then read `.agent/CONTEXT.md` and `.agent/ARCHITECTURE.md` so your
   questions use the project's existing language. Note any inline
   mermaid diagrams — they summarize relationships the spec may need to
   extend or invalidate, and the implementing change is responsible for
   updating any diagram its scope touches.

2. **Read** every `impact.md` under `.agent/specs/` so you understand what
   already exists and what this proposal might affect.

3. **Grill the user.** Ask focused questions one or two at a time, not a wall.
   You're done grilling when:
   - The outcome is observable and unambiguous
   - Every behavioral requirement is testable
   - Non-goals are explicit
   - You can name the existing specs this depends on or might break

4. **If terminology is unclear**, propose additions to `CONTEXT.md` and get
   confirmation before writing the spec.

5. **Find the next spec number** by listing `.agent/specs/` and picking
   `max+1`, zero-padded to 4 digits.

6. **Create the spec folder** by copying `_template/` and filling all three
   files. Set `status: proposed` in `impact.md`.

7. **Update `.agent/ROADMAP.md`** in the same change: add a one-line
   entry under "Proposed (drafted, not yet accepted)" referencing the
   new spec. If the idea came from the planned/horizon list, remove or
   mark the corresponding entry there (e.g. `→ drafted as 00NN`).

8. **Surface conflicts.** If any existing spec's `impact.md` lists modules
   you'll change, name them explicitly to the user. Do not bury this.

9. **Stop.** Do not implement. The user reviews, edits, and changes status
   to `accepted` themselves (or asks you to, with confirmation).

## Failure modes to avoid

- Writing the spec on the first message without asking anything
- Inventing requirements the user didn't state
- Skipping the conflict check
- Marking the spec `accepted` yourself
