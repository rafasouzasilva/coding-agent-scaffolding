<!--
Install: copy or symlink this file to CLAUDE.md at the repo root.
  cp .agent/agents/claude-code.md CLAUDE.md
or
  ln -s .agent/agents/claude-code.md CLAUDE.md
-->

# Claude Code instructions

This project uses an agent-agnostic structure. Your real instructions live
in **`AGENTS.md`** at the repo root. Read it before doing anything else.

In particular, before any task:
1. Read `AGENTS.md`
2. Read `.agent/CONTEXT.md`, `.agent/ARCHITECTURE.md`, `.agent/ROADMAP.md`,
   `.agent/HARNESS.md` — in that order. `ROADMAP.md` is the orienting
   read on a cold start: it tells you what's implemented, what's accepted,
   and what the next spec is. If the user says "let's continue" or
   "what's next?" without naming a spec, `ROADMAP.md` is your answer.
3. For feature work, read the relevant `.agent/specs/NNNN-x/` folder
4. Use the skills in `.claude/skills/` — invoke them by name when the
   trigger matches. The skill list and triggers are documented in
   `AGENTS.md` under "Available skills".

Do not duplicate or "summarize" the contents of `.agent/` into this file.
The whole point of the structure is one source of truth.

## Claude-Code-specific operating discipline

These rules are about *how to use Claude Code efficiently*, not about
project content. They exist here (not in `AGENTS.md`) because they
reference Claude-Code-specific mechanics: subagents, `/clear`, `/compact`,
the prompt-cache TTL, `Edit` vs `Write` cost asymmetry.

### Context & cost discipline

A multi-slice implement-spec cycle can accumulate 200k+ tokens of file
reads, test output, and harness reports. Every subsequent turn pays
cached input on all of it. The rules below are not optional — apply
them by default.

- **`Edit`, not `Write`, for modifications.** `Edit` sends only the
  diff. `Write` re-sends the whole file. Reserve `Write` for genuinely
  new files or full rewrites.
- **Do not re-read a file you just edited.** `Edit` would have errored
  if the change didn't apply, and the harness will catch a logic error.
  Re-reading to "verify visually" doubles the cost of every edit.
- **Delegate broad surveys to a subagent.** When a question spans more
  than ~3 files (codebase surveys, "where is X used", "find all
  callers of Y"), use the `Explore` subagent (read-only) or
  `general-purpose` (multi-step). The agent reads in its own context
  and returns a summary — the main thread only pays for the summary,
  not the full file contents.
- **Delegate `verify-harness` for large test surfaces.** When pytest
  output is likely to be verbose (hundreds of tests, or a failure
  scenario), run `verify-harness` via a `general-purpose` subagent
  and have it return only the structured Gates/Audits/Acceptance
  block. The full pytest output otherwise lands in the main
  conversation and you pay cached input on it for every subsequent
  turn.

### Session boundaries

- **`/clear` between specs.** A spec is self-contained. After
  `implement-spec` step 8 flips a spec to `implemented` and
  `update-history` rebuilds the HTML view, recommend `/clear` before
  starting the next spec. The new session reads `.agent/ROADMAP.md`
  to pick up; this is exactly what ROADMAP exists for. Chaining
  specs in one continuous session is the single largest source of
  avoidable cached-input cost.
- **`/compact` at natural breakpoints if not clearing.** If a session
  must continue across spec boundaries, `/compact` at the boundary
  drops the bulk while keeping a usable summary. Don't wait for the
  context warning — by then you've already paid for several turns
  of bloat.

### Skill invocation hygiene

- **Trust the harness over visual verification.** If `verify-harness`
  is green, the spec is done — do not "double-check" by re-reading
  files the harness already validated.
- **One slice at a time.** Implement, run gates, move on. Don't
  write the whole feature then test (this also keeps re-runs of
  the test suite small).

### What NOT to add to this file

Project-content guidance (security patterns, architecture rules,
spec workflow) belongs in `AGENTS.md` and `.agent/`. This file is
*only* for Claude-Code-specific mechanics. If you find yourself
about to add a rule that applies equally to Cursor or Devin, it
belongs in `AGENTS.md` instead.
