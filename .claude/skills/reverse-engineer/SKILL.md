---
name: reverse-engineer
trigger: bringing an existing codebase under this template; user says "document what's here" or "reverse engineer specs"
---

# Skill: reverse-engineer

Bring an existing codebase into the `.agent/` structure by reading the
code and producing draft specs, ADRs, and architecture documentation.

**Read this whole file before doing anything.** This skill has three
phases and they must run in order. Skipping ahead produces specs that
codify bugs and architecture documents that are just directory listings.

## Core stance

You are doing **archaeology, not transcription**. The code tells you
what *is*; you must separately determine what was *intended*. Those
diverge.

Every spec you produce starts at `status: discovered` — a state that
means "this describes observed behavior but has not been reviewed or
verified." It is the user's job, not yours, to promote `discovered`
specs to `proposed`, `accepted`, or `implemented`. If you mark anything
higher than `discovered` you have violated this skill.

You will describe behavior **descriptively** ("the endpoint returns
422 when X"), not **prescriptively** ("the endpoint must return 422
when X"). The user converts descriptive to prescriptive during review.

## Three phases — do not skip ahead

1. **Survey** — read the repo, produce a single overview document.
   Stop. Wait for the user to approve which areas to document.
2. **Reverse-engineer per area** — one approved area at a time, produce
   a draft spec and a findings note. Stop after each area; do not batch.
3. **Backfill architecture and context** — only after specs exist.
   Drafts `ARCHITECTURE.md` and `CONTEXT.md` from accumulated findings.

The reason for the strict order: writing architecture first contaminates
spec extraction with assumptions. Writing specs in batch hides the
findings the user most needs to see.

## Phase 1: Survey

**Goal:** produce one file at `.agent/discovery/SURVEY.md` describing
the codebase shape. **Do not write specs yet.**

Steps:

1. List the top-level directories and key config files
   (`package.json`, `pyproject.toml`, `pom.xml`, etc.). Identify the
   stack and primary frameworks.
2. Read the README and any top-level docs. Note any out-of-date
   sections (commands that don't match config, links that 404).
3. Identify candidate **areas** for documentation. An area is a
   coherent slice — a feature, a domain object, a workflow — not a
   directory. Examples: "user signup flow", "payment processing",
   "session lifecycle", "the X agent and its tools". Aim for 5–20
   areas in a medium codebase. More means you're slicing too thin;
   fewer means you're not separating concerns.
4. For each area, capture in one or two sentences: where its code
   lives, what evidence sources exist (tests? comments? ADRs? recent
   commits? open issues?), and how confident you are that it's a
   coherent area vs an arbitrary slice.
5. List evidence sources that exist project-wide and you'll use later:
   test suite shape, commit log conventions, any existing docs, issue
   tracker conventions.
6. **Coverage candor.** End the survey with a section that names what
   you didn't read or couldn't parse: vendored code, generated files,
   non-obvious tooling, unfamiliar frameworks, anything dense enough
   you skimmed it. The user needs this to know what to trust.

Output template at `.agent/discovery/SURVEY.md`:

```markdown
# Reverse-engineering survey

Generated: <date>
Repo size: <files / lines / language breakdown>
Primary stack: <e.g. Python 3.12 + FastAPI + LangGraph; Angular 17 frontend>

## Candidate areas

### A1 — <name>
- Location: <paths>
- Evidence: <tests? README section? ADR? recent commits?>
- Confidence area is coherent: high / medium / low
- One-sentence description: <what it appears to do>

### A2 — <name>
...

## Evidence sources

- Tests: <framework, coverage if visible, conventions>
- Commits: <conventional commits? squash-merge? PR templates?>
- Docs: <existing READMEs, wikis, ADRs>
- Issue tracker conventions: <labels, templates, link patterns>

## Coverage gaps (read this carefully)

- <files/areas not read>
- <code that was skimmed rather than understood>
- <anything I'm guessing about>
```

**Stop after writing the survey.** Tell the user what you produced,
ask which areas they want documented and in what order. Do not
proceed to Phase 2 without explicit area selection.

## Phase 2: Reverse-engineer per area

**Goal:** for each approved area, produce one draft spec at
`status: discovered` and a findings note.

**One area at a time.** Do not batch. Each area gets its own session
or at minimum its own checkpoint.

Steps for area A:

1. Read every file in the area's paths. Read related tests in full.
   Read recent commits touching those paths (last 20 or so).
2. Read upstream and downstream — what calls into this area, what
   this area calls — at least one level out. Note interfaces.
3. Extract **observable behavior** from the code and tests:
   - What inputs does the area accept?
   - What outputs does it produce?
   - What side effects (database writes, external calls, files,
     emitted events)?
   - What error modes are reachable?
4. Cross-check behavior against tests:
   - For each tested behavior, the test is your evidence.
   - For untested behavior, mark it `[INFERRED]` in the spec.
   - If the code and a test contradict, that's a **finding**, not
     a spec entry. Code might be wrong; test might be stale.
5. Find the next spec number and create
   `.agent/specs/NNNN-<area-slug>/` from `_template/`:
   - `SPEC.md` — descriptive, with `[INFERRED]` tags where evidence
     is weak.
   - `harness.md` — list the *existing* tests covering this area as
     acceptance evidence. If coverage is thin, say so — do not invent
     tests.
   - `impact.md` — frontmatter with `status: discovered`. Fill
     `touches_architecture` based on actual imports. Leave
     `depends_on` empty unless dependence is obvious from code.
6. Create `.agent/specs/NNNN-<area-slug>/FINDINGS.md` with the things
   the user needs to know but that don't belong in the spec:
   - Suspected bugs (cite file:line)
   - Dead code (cite file:line)
   - Tests that contradict observed behavior
   - Confusing names, mismatched terminology
   - Areas where the code and the README disagree
   - Anything you guessed at and want confirmed

7. **Security walk per area.** Before stopping, do a structured pass
   against the project's threat model (`.agent/CONTEXT.md`) and the
   OWASP-mapped audits in `HARNESS.md`. Items found here go into a
   separate `SECURITY.md` in the spec folder (not in the descriptive
   SPEC — security issues are *findings*, not "current intended
   behavior"). Walk each axis:

   - **T-AUTH / T-SESSION** — Any authn/session code in the area? Weak
     hashing? Plaintext passwords? Missing rate limits? Cookies missing
     `HttpOnly`/`Secure`/`SameSite`?
   - **T-IDOR** — Repository methods without `user_id`? Routes without
     `current_user` check? Cross-tenant queries?
   - **T-INJECTION** — Raw SQL with string formatting? `subprocess`
     with `shell=True`? `eval`/`exec`?
   - **T-CRYPTO** — `random` instead of `secrets`? `md5`/`sha1` in
     non-cosmetic use? Hardcoded keys?
   - **T-CONFIG / T-LOG** — Secrets in source? `os.environ` outside
     `config/`? PII in logs? `print` statements? Debug flags on?
   - **T-DEPS** — Unpinned versions? Known-CVE deps?
   - **LLM-tier (LLM01..LLM08)** — Raw user content concatenated into
     prompts? LLM output `eval`'d / rendered without escape? Tools
     without Pydantic schemas? Side-effecting actions without
     confirmation?
   - **Secrets in git history** — even if `.env` is gitignored now,
     `git log -p` may show past leaks. If you find one, escalate
     immediately — that's a credential to rotate, not a finding to
     file.

   For each finding, capture: file:line evidence, threat ID, severity
   (low / medium / high / critical), suggested remediation. **Critical
   findings (hardcoded credentials, obvious injection, data leaks)
   surface immediately**, not just in SECURITY.md.

8. Report back to the user with a 5-line summary: what area, how many
   files read, how many `[INFERRED]` tags, how many findings, **how
   many SECURITY findings (with severity counts)**. Stop. Wait for the
   user to review and tell you to proceed to the next area.

### SPEC.md template for reverse-engineered specs

```markdown
# Spec: <area name> (discovered)

> **This spec describes observed behavior, not intended behavior.**
> It was reverse-engineered from code on <date>. The user must review
> and convert descriptive statements to prescriptive ones before
> promoting status above `discovered`.

## What this area does (observed)

<2-3 sentences describing the area's role.>

## Behavioral observations

1. <Observed behavior 1, descriptive>
   - Evidence: `path/to/file.py:42`, test `tests/x/test_y.py::test_z`
2. <Observed behavior 2>
   - Evidence: `path/to/file.py:88`
   - [INFERRED] — not covered by any test
3. ...

## Inputs

<API shape, function signatures, message schemas>

## Outputs and side effects

<What it returns, what it persists, what it calls.>

## Error modes observed

- <error/exception, when it's raised, where>

## Open questions for the user

- Is <behavior X> intended, or is it a bug we should fix before
  promoting this spec?
- <other ambiguities>
```

### Anti-patterns for Phase 2

- **Do not** write prescriptive language ("must", "shall"). Use
  descriptive language ("returns", "raises", "the code at <path>
  does X").
- **Do not** invent tests that don't exist in the harness.
- **Do not** mark anything `accepted` or `implemented`.
- **Do not** silently fix what looks like a bug. Write it in FINDINGS.md.
- **Do not** combine areas to "save time". Each area gets its own spec.

## Phase 3: Backfill architecture and context

**Goal:** with N specs and their FINDINGS in hand, draft the global
`ARCHITECTURE.md` and `CONTEXT.md`. Only run this after at least the
core areas of the system are documented.

Steps:

1. Read every spec's SPEC.md and FINDINGS.md.
2. Read every `impact.md` to see what each spec touches.
3. Draft `ARCHITECTURE.md`:
   - Stack section: from the survey.
   - Module structure: from observed imports. **Mark each boundary
     as `[OBSERVED]` or `[DELIBERATE]`** — most will be `[OBSERVED]`
     initially. The user converts `[OBSERVED]` to `[DELIBERATE]` for
     boundaries they want to keep, or refactors when they don't.
   - Patterns: only include patterns that appear in 3+ places. A
     pattern used once is a one-off, not a convention.
   - What NOT to do: extract from FINDINGS.md — repeated anti-patterns
     across multiple areas.
   - **Diagram audit:** if pre-existing `ARCHITECTURE.md` or
     `CONTEXT.md` contains inline mermaid diagrams, walk each node
     and edge against the observed code state. A persona that no
     longer exists, a module boundary that's been crossed, a trust
     crossing missing from the threat model — each is a discrepancy.
     Record them as a "Diagrams to reconcile" section in
     `.agent/discovery/COMPLETE.md`. **Do not silently rewrite
     diagrams.** The user reviews each discrepancy and chooses
     whether the code or the diagram is wrong.
4. Draft `CONTEXT.md`:
   - Domain vocabulary: terms that appear in 3+ files and aren't
     standard English. Each entry includes one example file
     reference so the user can verify.
   - Invariants: only things you can demonstrate hold across the
     codebase. Tag each as `[DEMONSTRATED]` (you can point at the
     evidence) or `[CANDIDATE]` (looks true but you didn't exhaustively
     check).
5. Run `node .agent-tools/build-history.mjs` so the history view
   reflects all the new `discovered` specs.
6. Write a final summary at `.agent/discovery/COMPLETE.md`:
   - How many specs, what status they're in
   - Coverage gaps that remain
   - Top recommendations for the user's review pass (which specs
     have the most `[INFERRED]` tags, which FINDINGS are urgent)
   - **Diagrams to reconcile** — from the diagram-audit pass in
     step 3. For each discrepancy, cite the diagram (doc + node/edge)
     and the observed-code evidence so the user can adjudicate
     quickly.

### Anti-patterns for Phase 3

- **Do not** write architecture that just restates the directory
  structure. If it doesn't explain *why* boundaries are where they
  are, it adds no value.
- **Do not** mark observed boundaries as deliberate. The user makes
  that call.
- **Do not** invent invariants from a few examples. "All times are
  UTC" requires checking. "Most times appear to be UTC" is a
  candidate, not an invariant.
- **Do not** include a pattern as a convention if it appears once or
  twice — that's just code, not a pattern.

## Stopping conditions and escalation

Stop and ask the user if:
- An area you were asked to document doesn't actually exist as a
  coherent slice — the code is too tangled or too spread out
- A spec would be longer than ~300 lines — split the area
- You find suspected security issues, hardcoded credentials, or
  obvious data leaks — report immediately, don't bury in FINDINGS
- More than ~30% of an area's behavior is `[INFERRED]` — coverage is
  too thin to produce a useful spec from code alone

## Outputs summary

After all three phases:

```
.agent/discovery/
  SURVEY.md             phase 1 output
  COMPLETE.md           phase 3 summary
.agent/specs/
  NNNN-<area>/
    SPEC.md             descriptive, with [INFERRED] tags
    harness.md          references existing tests
    impact.md           status: discovered
    FINDINGS.md         bugs, dead code, ambiguities
    SECURITY.md         security findings per area (threat ID, severity)
.agent/
  ARCHITECTURE.md       draft, with [OBSERVED] / [DELIBERATE] tags
  CONTEXT.md            draft, with [DEMONSTRATED] / [CANDIDATE] tags
docs/history/index.html updated by build-history.mjs
```

The user's next move after this skill completes is a **review pass**:
read each spec, decide what's true vs accidental, convert tags, and
promote statuses where appropriate. That's not your job.
