---
spec_id: 0001-example-feature
title: Personalized welcome screen
status: proposed
created: 2026-05-17
updated: 2026-05-17
depends_on: []
touches_architecture: [api, web]
adrs: [ADR-0001]                      # adr ids this spec relies on or creates
supersedes: []
---

# Impact: Example Feature

## What this spec changes

Adds a new route `/welcome` and changes the post-signup redirect target.
Introduces a `suggestions.config.ts` file consumed at build time.

## What this spec is built on

Nothing — this is the first spec in the example project.

## What this spec might break

The current post-signup redirect to `/` is referenced by the marketing
team's "first visit" analytics event. Coordinate with them before shipping.

## Architectural impact

No new modules. `suggestions.config.ts` lives in `src/config/` per the
existing config convention. No ADR needed.
