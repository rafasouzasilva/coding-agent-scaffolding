# Harness: <FEATURE NAME>

> Per-spec boundaries. Global rules in `.agent/HARNESS.md` also apply.
> Before marking this spec `implemented`, every item here must pass.

## Acceptance criteria (declarative)

<!--
Map each Behavioral Requirement from SPEC.md to a verifiable check.
Format: `[ ] BR-N: <what is true when this passes>`

Include negative tests for every authn/authz/validation requirement
from the Security section — "denies when X", "rejects malformed Y",
"returns same response for missing-user vs. wrong-password".
Tests covering only the happy path miss the failure modes the
Security section was added to catch.
-->

- [ ] BR-1:
- [ ] BR-2:

## Executable checks

<!--
Commands the agent runs to verify. Each must exit 0.

- `pnpm test specs/0001` — feature tests pass
- `pnpm test:e2e password-reset` — e2e covers the happy path
-->

## Out-of-band checks

<!--
Things that can't be automated but must be verified before "implemented":
- Manual smoke test of the email flow against staging
- Visual review of the new UI element
-->

## Rollback plan

<!--
If this ships and breaks something, what's the rollback? A feature flag?
A revert? Document it before you need it.
-->
