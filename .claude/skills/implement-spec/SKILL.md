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
   The SPEC has a **Security section** — read it. Every authn / authz /
   validation / output-handling / secrets / logging requirement listed
   there is load-bearing and must show up in your implementation *and*
   in the negative tests you write. Do not treat the Security section
   as background reading.

2. **Plan in writing first.** Before changing code, post a short plan:
   - The files you will create or modify
   - The order
   - Which acceptance criterion each step satisfies
   - **For each Security item in SPEC**: where it's enforced in code
     and which negative test covers it. Items with no plan entry are
     items you'll forget to implement.

   Wait for confirmation if the plan touches more files than the impact
   suggested.

3. **Implement one vertical slice at a time.** Following Pocock's TDD
   approach where it fits: write the failing test, then the code, then
   refactor. Don't write the whole feature then test.

   For security-relevant behavior, **write the negative test first**
   ("denies when X", "rejects malformed Y", "returns the same response
   for missing-user vs. wrong-password"). Negative tests are easy to
   forget once the happy path passes.

4. **Stay in scope.** If you find a tempting refactor outside this spec,
   note it as a TODO comment and keep moving. Out-of-scope changes go in
   their own future spec — Karpathy's silent-scope-expansion failure mode.

5. **Follow the architecture's security patterns.** `.agent/ARCHITECTURE.md`
   has a Security architecture section: input validation at boundaries,
   tagged errors that don't leak internals, secrets only via settings,
   no custom crypto, the LLM input/output rules (delimited wrappers,
   output as untrusted). Apply these without being prompted — they're
   *patterns*, not optional flair.

6. **Update inline diagrams.** If this spec changes a relationship,
   persona, module boundary, trust crossing, or any structural shape
   that an existing diagram visualizes, update the diagram in the
   same change. Diagrams are inline mermaid blocks, never standalone
   files — see `.agent/ARCHITECTURE.md` → "Documentation diagrams"
   for where they live (`ARCHITECTURE.md`, `CONTEXT.md`, or this
   spec's own `SPEC.md`). List the doc you updated in
   `touches_architecture` so the diagram change is visible at the
   impact layer. If no diagram is affected, no action is required —
   but verify by walking each diagram in the docs listed in
   `touches_architecture`.

7. **Run the harness before claiming done.** Invoke `verify-harness`. Do
   not report success based on "the code looks right". The harness now
   includes security gates (`bandit`, `pip-audit`, `gitleaks`) — these
   must exit 0 too, not just the test suite.

8. **Update status.** When harness passes, edit `impact.md` to
   `status: implemented` and update the `updated:` date. Then invoke
   `update-history`.

## Failure modes to avoid

- Editing files outside `touches_architecture` without flagging it
- Skipping the harness because "it's obvious it works"
- Marking `implemented` while any acceptance checkbox is unchecked
- Fixing unrelated bugs in the same change (separate spec, separate session)
- **Skipping negative tests** — happy-path-only coverage misses the
  failure modes the Security section was specifically added to catch
- **Disabling a security gate** to make the build pass — gates encode
  decisions; if a gate is wrong, propose removing it via an ADR, not by
  silently `# nosec`-ing every line
- **Leaving diagrams stale after a structural change** — a diagram
  that no longer matches the code is worse than no diagram; future
  readers (and agents) will trust it and be misled. The diagram
  update belongs in the same change as the code that invalidates it
