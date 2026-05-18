<!--
Install (two parts; both are recommended for Devin):

1. Commit a Devin Playbook that points at AGENTS.md. In the Devin app:
   Library → Playbooks → New Playbook. Paste the "Playbook content" section
   below. Trigger it at the start of every Devin session that touches this repo.

2. Optionally provide an environment blueprint:
   cp .agent/agents/devin-blueprint.example.yaml .devin/blueprint.yaml
   (and edit for your stack). This makes Devin's VM start with the harness
   commands runnable, so it can actually invoke them.

Devin Knowledge is configured in Devin's UI (not committed). Add one
short entry pointing at this file — Devin will then automatically read
AGENTS.md at session start.
-->

# Devin adapter

This project uses an agent-agnostic structure. The canonical instructions
live in **`AGENTS.md`** at the repo root.

## Playbook content (paste into Devin → Library → Playbooks)

> **Playbook title:** Bootstrap project context
>
> **When to use:** At the start of every session in this repository.
>
> **Steps:**
> 1. Open and read `AGENTS.md` end to end.
> 2. Open and read `.agent/CONTEXT.md`, `.agent/ARCHITECTURE.md`, and
>    `.agent/HARNESS.md`.
> 3. If the user request relates to an existing spec, open the matching
>    folder under `.agent/specs/` and read all three files (SPEC, harness,
>    impact).
> 4. For new features, **do not jump to implementation.** Use the
>    `grill-spec` skill from `.agent/skills/grill-spec/SKILL.md`.
> 5. Before declaring any task complete, run
>    `node .agent-tools/check-harness.mjs <spec-id>` and report the
>    output verbatim. Do not paraphrase failures.
> 6. After any spec status change, run
>    `node .agent-tools/build-history.mjs`.

## Notes on Devin specifically

- Devin's Skills (committed `SKILL.md` files) and ours (under
  `.agent/skills/`) follow the same pattern. Devin should pick them up
  automatically; if it does not, add a Knowledge entry pointing at
  `.agent/skills/`.
- Devin's machine is its own VM. The harness command must be runnable
  from a fresh checkout — that's what the blueprint is for.
- When Devin opens a PR, ensure the description references the spec ID
  it implements. That makes the history view downstream of `git log`
  actually useful.
