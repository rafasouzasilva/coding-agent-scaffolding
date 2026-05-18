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

## Open questions

<!--
List anything ambiguous. The grilling session should resolve these before
the spec becomes `accepted`. Leaving open questions in an accepted spec
is how silent assumptions sneak in.
-->
