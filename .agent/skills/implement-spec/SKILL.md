---
name: implement-spec
trigger: user asks to implement, build, or "do" a spec that is `accepted`
---

# Skill: implement-spec

Execute an accepted SDD with the harness in mind from the first line.

## Preconditions

- The spec exists under `.agent/specs/NNNN-x/`
- Its `impact.md` has `status: accepted`
- You have read `CONTEXT.md`, `ARCHITECTURE.md`, `HARNESS.md`

If any precondition fails, stop and report. Do not "implement" a `proposed`
spec — that bypasses the review the proposal exists to enable.

## Steps

1. **Read all three spec files** (SPEC, harness, impact) end to end.

2. **Plan in writing first.** Before changing code, post a short plan:
   - The files you will create or modify
   - The order
   - Which acceptance criterion each step satisfies

   Wait for confirmation if the plan touches more files than the impact
   suggested.

3. **Implement one vertical slice at a time.** Following Pocock's TDD
   approach where it fits: write the failing test, then the code, then
   refactor. Don't write the whole feature then test.

4. **Stay in scope.** If you find a tempting refactor outside this spec,
   note it as a TODO comment and keep moving. Out-of-scope changes go in
   their own future spec — Karpathy's silent-scope-expansion failure mode.

5. **Run the harness before claiming done.** Invoke `verify-harness`. Do
   not report success based on "the code looks right".

6. **Update status.** When harness passes, edit `impact.md` to
   `status: implemented` and update the `updated:` date. Then invoke
   `update-history`.

## Failure modes to avoid

- Editing files outside `touches_architecture` without flagging it
- Skipping the harness because "it's obvious it works"
- Marking `implemented` while any acceptance checkbox is unchecked
- Fixing unrelated bugs in the same change (separate spec, separate session)
