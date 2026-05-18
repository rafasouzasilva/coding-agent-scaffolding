# Architecture

> **Purpose.** This is the technical *how* — the patterns, structure, and
> conventions the agent must follow when implementing any spec. Specs say
> *what*; this file says *how*. Reduces output variation.

## Stack

<!-- e.g., Node 20, TypeScript strict, PostgreSQL, Vitest -->

## Module structure

<!--
Describe the top-level modules and what each is responsible for. Be specific
about boundaries — what may import what.

Example:
- `src/domain/` — pure business logic, no IO, no framework deps.
- `src/services/` — orchestrates domain + repositories. May call IO.
- `src/repositories/` — only place that talks to the database.
- `src/api/` — HTTP handlers. Thin; delegates to services.
-->

## Patterns

<!--
Concrete patterns to use and patterns to avoid. Examples:

### Repositories
Every entity has a repository in `src/repositories/`. Repositories return
domain objects, never raw rows. The signature shape is:
`findById(id): Promise<Entity | null>` — null, not throw, when missing.

### Errors
Use tagged error classes from `src/errors.ts`. Do not throw plain `Error`
across module boundaries.

### Async
All IO functions return Promises. No callbacks. No sync filesystem in
request paths.
-->

## What NOT to do

<!--
Anti-patterns specific to this project. Examples:
- Don't add ORMs; the repository layer uses raw queries on purpose.
- Don't introduce new top-level dependencies without an ADR.
- Don't use default exports.
-->

## When to write an ADR

Write an ADR in `.agent/adr/` when:
- The decision has long-lived consequences
- A clear alternative was considered and rejected
- A future contributor (human or agent) would reasonably ask "why this way?"

Do *not* write an ADR for: routine implementation choices, naming, anything
already covered by this file.
