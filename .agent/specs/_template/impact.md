---
spec_id: NNNN-feature-slug
title: <human readable>
status: proposed              # discovered | proposed | accepted | implemented | superseded
created: YYYY-MM-DD
updated: YYYY-MM-DD
depends_on: []                # list of spec_ids this requires
touches_architecture: []      # module names from ARCHITECTURE.md
adrs: []                      # adr ids this spec relies on or creates
supersedes: []                # spec_ids this replaces (set status of those to 'superseded')
---

# Impact: <FEATURE NAME>

> This file is the seam between this spec and everything else. Frontmatter
> drives the history view; prose below explains the reasoning.

## What this spec changes

<!--
Describe in plain language what existing behavior, modules, or contracts
this spec will alter. Be specific.
-->

## What this spec is built on

<!--
List the prior specs (by id and title) this depends on, and *why*. If
this spec couldn't exist without them, that's a dependency.
-->

## What this spec might break

<!--
Honest assessment of risk to existing implemented specs. For each entry,
note the affected spec_id and what could go wrong. This is the artifact
the next "proposal" reads when checking conflict.
-->

## Architectural impact

<!--
If this spec requires changes to ARCHITECTURE.md or a new ADR, list them.
If the architectural change is large, create the ADR first, link it here,
and only then accept this spec.
-->
