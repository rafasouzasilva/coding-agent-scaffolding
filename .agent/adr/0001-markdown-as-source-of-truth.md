# ADR 0001: Use markdown files as the source of truth for specs

## Status

Accepted — 2026-05-17

## Context

Agents work best when they read durable, plain-text context. We considered:
1. A database-backed spec system with a UI
2. A YAML-only spec format
3. Markdown files with structured frontmatter

## Decision

Markdown with YAML frontmatter. Specs are three files per folder
(SPEC.md, harness.md, impact.md). Frontmatter in impact.md drives the
generated history view.

## Consequences

- Specs are diffable, reviewable in PRs, and version-controlled like code.
- Any agent (Claude, Cursor, others) can read them — no proprietary format.
- The history view is generated, never hand-edited.
- Cost: we need a lightweight validator (`validate-specs.mjs`) to keep
  frontmatter honest. Worth it.

## Alternatives rejected

- A spec DB would force a custom UI and break the "agent reads files" model.
- YAML-only loses the prose richness that helps the grilling phase.
