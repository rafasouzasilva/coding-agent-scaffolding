# Agent adapters

This directory holds **opt-in** adapter files that wire specific agents into
the project. The agent-agnostic core lives in `.agent/`. Every adapter here
does the same thing: tells its tool to read `AGENTS.md` first and then
follow the rules in `.agent/`.

**Do not duplicate content here.** Adapters should be 5–30 lines each and
delegate everything substantive to the canonical files. If you find
yourself copy-pasting context into an adapter, that content belongs in
`.agent/CONTEXT.md` or `.agent/ARCHITECTURE.md` instead.

## Installed adapters

| Tool                   | Reads from                          | Adapter file                  |
| ---------------------- | ----------------------------------- | ----------------------------- |
| Claude Code            | `CLAUDE.md` (root)                  | `claude-code.md`              |
| GitHub Copilot         | `.github/copilot-instructions.md`   | `github-copilot.md`           |
| Devin                  | Playbook + Knowledge (Devin app)    | `devin.md` (+ blueprint yaml) |
| Any AGENTS.md-aware    | `AGENTS.md` (root)                  | already in place              |

The generic `AGENTS.md` is the source of truth. Several modern tools
(including Copilot's coding agent and Claude Code) read it directly. The
adapters above exist either for legacy paths (`CLAUDE.md`,
`.github/copilot-instructions.md`) or for tools that configure context
out-of-band (Devin's Playbooks/Knowledge in its app).

## Activating an adapter

Each adapter file has install instructions in a comment at the top. Quick
reference for this project's targets:

```bash
# Claude Code
cp .agent/agents/claude-code.md CLAUDE.md

# GitHub Copilot (covers IDE Chat and code review;
# coding agent additionally reads AGENTS.md natively)
mkdir -p .github && cp .agent/agents/github-copilot.md .github/copilot-instructions.md

# Devin
# 1. Paste the Playbook from devin.md into Devin → Library → Playbooks
# 2. cp .agent/agents/devin-blueprint.example.yaml .devin/blueprint.yaml
# 3. In Devin → Settings → Knowledge, add one entry pointing at AGENTS.md
```

You can install several at once. They all converge on `.agent/`, so the
agents will read identical context regardless of which tool is in play.

## Adding a new adapter

1. Create `<tool-name>.md` (or appropriate extension) in this directory.
2. Top comment: the one-step install instruction for that tool.
3. Body: a short directive that tells the agent to read `AGENTS.md` and
   follow the rules in `.agent/`. Nothing more.

The point of this pattern: when you switch tools, or run two in parallel,
nothing about the project changes. Only the adapter does.
