# Global Harness

> **Purpose.** Boundaries that must hold at all times, regardless of which
> spec is being worked on. Two layers, each with a distinct job.

## The model

The harness has two layers, and the distinction is not cosmetic:

**Executable checks are gates.** They run via
`node .agent-tools/check-harness.mjs`. They fail loudly and cannot be
overridden by an agent's confidence. Use them for anything mechanical:
typecheck, tests, lint, build, schema validation, performance budgets.
If a rule can be expressed as a script that exits non-zero, it belongs
here.

**Declarative rules are audits.** They require judgment that scripts
can't (cheaply) provide: "no business logic in route handlers", "the
public API matches the spec", "errors use the tagged class hierarchy".
The agent self-audits these and reports — pass, fail, or "can't tell".
They cannot block on their own, but a single failing declarative rule
must be surfaced before marking a spec `implemented`.

**Why both.** Executable-only misses judgment failures. Declarative-only
relies on the agent grading its own homework — the exact thing Karpathy
warns about. Together: scripts catch the mechanical, the agent surfaces
the judgment, and the human reviews the audit list.

## Executable checks (gates)

Lines below that start with `$ ` inside this section are picked up by
`.agent-tools/check-harness.mjs` and executed. Add or remove as needed.

<!--
Example (uncomment and adapt as your toolchain solidifies):

$ pnpm typecheck
$ pnpm test
$ pnpm lint
$ pnpm build
-->

## Declarative rules (audits)

The agent self-checks each item below before declaring any task complete.
Report each as PASS / FAIL / UNKNOWN with one sentence of evidence.

<!-- Examples — adapt per project -->

- [ ] No `any` or `unknown` in new TypeScript code without a justifying comment
- [ ] Every new public function has at least one test
- [ ] No direct database access outside `src/repositories/`
- [ ] No `console.log` left in committed code
- [ ] Imports follow the module boundary rules in `ARCHITECTURE.md`
- [ ] No secrets, API keys, or tokens in source

## Failure protocol

When a gate fails:
1. Do **not** mark the spec as `implemented`.
2. Report the raw failure output. Do not paraphrase.
3. Either fix and re-run, or escalate.

When an audit fails:
1. Surface it explicitly — `[FAIL] rule: <one-sentence evidence>`.
2. Do not silently fix it as part of the same change. Audit failures
   often indicate the spec is incomplete; that's a conversation, not a patch.
3. Never disable a harness rule to make it pass. If a rule is wrong,
   propose removing it via an ADR — separate change, separate session.
