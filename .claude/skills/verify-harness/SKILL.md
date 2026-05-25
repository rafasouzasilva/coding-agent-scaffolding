---
name: verify-harness
trigger: before declaring any spec implemented; on user request "check the harness"
---

# Skill: verify-harness

Run every applicable harness check and report the result structurally.
The harness has two layers (see `.agent/HARNESS.md`) and you treat them
differently.

## Steps

1. **Identify scope.** Which spec are we verifying? If unclear, ask.

2. **Run the gates (executable).**
   - `node .agent-tools/check-harness.mjs <spec-id>` runs the global
     executable rules plus the spec's `harness.md` executable commands.
   - Capture output verbatim; do not paraphrase failures.
   - If any gate fails, the spec **cannot** be marked implemented — stop
     here, report, and either fix or escalate.

3. **Run the audits (declarative).** For each unchecked item in
   `.agent/HARNESS.md` "Declarative rules" and the spec's "Acceptance
   criteria", inspect the relevant files and decide:
   - **PASS** — you verified it and it holds (cite the evidence: file/line)
   - **FAIL** — you verified it and it doesn't (cite the evidence)
   - **UNKNOWN** — you can't tell from what's available, and that itself
     is information the human needs

   Be honest. "UNKNOWN" is a legitimate answer; "PASS" without evidence
   is the failure mode this whole system exists to prevent.

4. **Report.** Single structured block:

   ```
   Harness: <spec-id>

   Gates (executable):     <n/N passed>
     [PASS] pnpm typecheck
     [FAIL] pnpm test
       <first failure excerpt, unmodified>

   Audits (declarative):   <pass/fail/unknown counts>
     [PASS] no business logic in route handlers
       evidence: src/api/payment.ts:14 delegates to PaymentService
     [FAIL] errors use tagged class hierarchy
       evidence: src/services/user.ts:88 throws new Error("not found")
     [UNKNOWN] every public function has a test
       reason: did not enumerate every export

   Acceptance (this spec): <n/N passed>
     [PASS] BR-1
     [FAIL] BR-2: no test asserts redirect target
   ```

5. **Do not auto-fix.** A harness run is a *report*, not a fix loop. If
   the user wants you to fix, they'll say so — and that's a fresh
   `implement-spec` cycle, not a silent patch.

## When called from another skill

If `implement-spec` (or another long-running flow) is invoking you,
the caller should consider running this verification in a subagent
rather than inline. Pytest output on a large suite (hundreds of
tests, especially on failure) can balloon the calling conversation's
cached-input footprint for the rest of the session. The structured
report in step 4 is exactly what a subagent returns — no information
is lost vs. running inline, but the verbose tool output stays in the
subagent's context, not the main thread's.

## Failure modes to avoid

- Marking an audit `PASS` without citing evidence
- Conflating gate failures and audit failures (gates block, audits surface)
- "Fixing" failures inline before showing the user the report
- Skipping audits because the gates passed (they catch different things)
