# Spec: <FEATURE NAME>

> Replace this template content. Keep section names; they're what the
> tooling and other agents look for.

## Problem

<!-- One paragraph. What's broken or missing? Who feels it? -->

## Outcome

<!--
What's true after this is built? Write in the present tense, observable.
"Users can reset their password via email link" — not "implement password
reset".
-->

## Behavioral requirements

<!--
Numbered list. Each item must be testable. Avoid implementation detail
unless it's load-bearing. Example:

1. A request to `POST /password-reset` with a valid email returns 202
   within 500ms regardless of whether the email exists.
2. An email is sent only if the address belongs to an active user.
3. The reset link is valid for 30 minutes and single-use.
-->

## Non-goals

<!--
Explicit list of what this spec does NOT cover. This is where you fight
scope creep. The agent treats anything not listed under Outcome or
Behavioral Requirements as out of scope.
-->

## Security

<!--
**Mandatory section.** Every spec answers every subsection — write
"n/a" with one-sentence justification rather than omitting. The
threat model lives in `.agent/CONTEXT.md`; reference threat IDs
(e.g. T-AUTH, T-LLM01) where they apply.

Negative tests for every authn/authz/validation requirement go in
`harness.md` under "Acceptance criteria" — not optional.
-->

### Authentication

<!--
Who must be authenticated to use this? Is anything public? If a route
is unauthenticated, justify (e.g. /healthz is intentionally public
because hosting needs it).
-->

### Authorization

<!--
What user-owned data does this touch? How is tenancy enforced (which
repo methods take user_id, RLS policies if applicable)? Which routes
require the `get_current_user` dep?
-->

### Input validation

<!--
What inputs cross trust boundaries? What Pydantic models validate
them? Size limits? Format constraints? For LLM-facing inputs:
how is user-controlled content sandboxed in prompts? (T-LLM01)
-->

### Output handling

<!--
What does this spec emit? HTTP responses — what Pydantic response
models? Frontend rendering — escaped where? LLM outputs — how
sanitized before reaching the user / next tool? (T-LLM02)
Errors — what's safe to surface vs. what stays internal?
-->

### Secrets and credentials

<!--
What secrets does this need? Where do they live (env vars via
pydantic-settings)? Any short-lived tokens, refresh patterns, rotation?
Does this touch user credentials in any way?
-->

### Logging and audit

<!--
What does this log? Any PII risk (audit redaction)? Security-relevant
events that should produce a distinct log entry (login success/fail,
authz denial, admin action, agent decision)? Retention plan?
-->

### Threats addressed

<!--
List threat IDs from CONTEXT.md (T-AUTH, T-SESSION, T-IDOR, T-INJECTION,
T-XSS, T-CSRF, T-CRYPTO, T-CONFIG, T-DEPS, T-LOG, T-SSRF,
T-LLM01..T-LLM08) that this spec specifically addresses or relies on.
Note any threats explicitly out of scope for this spec.
-->

## Open questions

<!--
List anything ambiguous. The grilling session should resolve these before
the spec becomes `accepted`. Leaving open questions in an accepted spec
is how silent assumptions sneak in.
-->
