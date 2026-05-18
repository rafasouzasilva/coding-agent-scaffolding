# Context

> **Purpose.** This is the project's shared language between you and the agent.
> Concise definitions for every term that has a specific meaning here.
> Read it every session. Update it when terminology shifts.

## Domain vocabulary

<!-- Add entries as the project develops. Keep each one tight. -->

- **Spec / SDD**: a single feature specification under `.agent/specs/`. Each
  has a SPEC.md (behavior), harness.md (boundaries), impact.md (relationships).
- **Harness**: the set of checks a spec must satisfy before it can be marked
  `implemented`. Two tiers: global (`HARNESS.md`) and per-spec.
- **ADR**: Architectural Decision Record. Lives in `.agent/adr/`. Use when
  a choice has long-lived consequences and a clear alternative was rejected.

## Project-specific terms

<!--
Add domain terms here as you encounter them. Example pattern:

- **Materialization**: the process of giving a planned entity a concrete
  filesystem location. A lesson is "materialized" when it has a path.
-->

## Invariants

<!--
Statements that must be true at all times in this codebase. Agents should
treat violations as bugs. Example:

- All times stored in UTC. Conversion happens only at the UI boundary.
- No business logic in route handlers; route handlers delegate to services.
-->
