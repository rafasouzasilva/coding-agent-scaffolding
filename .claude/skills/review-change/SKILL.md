---
name: review-change
trigger: user is doing a code review — phrases like "review this PR", "review the changes on this branch", "let's review", "check this before merge", or running before they post review comments on a PR. Also useful for self-review of uncommitted changes before opening a PR.
---

# Skill: review-change

Help a reviewer walk a change end-to-end: verify it matches its stated
intent, check spec alignment, surface drift, prompt for cross-cutting
concerns, and produce structured review comments the reviewer can post.

## Who this skill is for

**The reviewer.** Not the author. The reviewer has fresh eyes and a
specific job: catch what the author missed, decide what blocks merge,
coach productively, and approve work that's ready. This skill makes
that job faster and more thorough — not by doing the review for the
reviewer, but by structuring it.

The reviewer may not be the same person who wrote the change. Don't
assume they know what the author intended; help them ask.

## When to use

- Reviewing a PR or branch before approval (the primary case)
- Pre-reviewing your own uncommitted work before opening a PR
- Auditing a recently merged change that wasn't reviewed at the time

If the user says "review this change" or similar, you're in the right
skill. If they say "implement this", "fix this bug", or "write a spec",
you're in the wrong skill — redirect.

## Core stance

Five things only good reviews do consistently:

1. **Verify intent vs. effect.** The diff claims to do X; does it
   actually do X? Did it accidentally do Y too?
2. **Check spec alignment** when a spec is claimed. Every behavioral
   requirement should have visible evidence in the diff or its tests.
3. **Surface drift.** Changes that touch specs, or that should have
   *been* specs, need acknowledgment — register entry, spec update,
   or follow-up.
4. **Catch cross-cutting concerns** — new APIs, deps, schema changes,
   breaking changes, security or performance-sensitive paths. The
   things diffs hide because they're not in one place.
5. **Produce useful artifacts** — review comments the author acts on,
   register entries or specs the project commits.

You guide the reviewer through these five. The reviewer makes the
calls. You don't pretend to do code review; you make the reviewer
faster at it.

## Drift safety-net

`AGENTS.md` mandates agents proactively prompt for drift register
entries during direct-to-code work. That mandate doesn't always fire:
the author may have coded without an agent, the agent may have missed
a trigger, the user may have declined the prompt and forgotten to
come back to it. **Code review is the last cheap place to catch
missed drift acknowledgment.**

Treat this as a non-negotiable part of review, not a footnote. If the
change is direct-to-code and the register has no matching entry,
that's a finding — not a blocker on its own, but a register entry
(or a spec update, or a follow-up spec) must come out of the review.
A PR that merges without acknowledging drift quietly accumulates the
exact silent rot the system exists to prevent.

## Steps

### 0. Identify what's being reviewed

Detect the scope from the working directory:

- **PR / branch review** (most common): there's a target branch
  (usually `main`) and a current branch with diverging commits.
  Run `git log <target>..HEAD --oneline` to list commits being
  reviewed. Run `git diff <target>...HEAD --stat` for the file
  summary.
- **Uncommitted changes**: working tree has uncommitted modifications.
  Run `git status --short` and `git diff --stat` for the file summary.
- **Specific commit range**: user gave you `<sha>..<sha>` or a PR
  number. Use that.

If unclear, ask the user: "What range should I review? Current branch
vs `main`, uncommitted changes, or something else?"

Tell the user, in one line, what you'll be reviewing: "Reviewing 7
commits on `feature/welcome-screen` vs `main`: 23 files changed,
+412/-87."

### 1. Verify intent vs. effect

Ask the user (or read from the PR description if available) what the
change is supposed to do. Pull out the **claim**:

- "Implements spec NNNN-x"
- "Hotfix for issue #123"
- "Refactor of module X with no behavior change"
- "Adds feature Y" (no spec claimed — direct-to-code)

Then look at the actual diff and identify:

- **In-scope changes**: files and changes consistent with the claim
- **Possibly out-of-scope changes**: things the claim doesn't explain

You're not enforcing scope — sometimes legitimate cleanup happens
alongside a feature. You're surfacing it for the reviewer to call.

Output for this step:

```
## Step 1 — Intent vs. effect

Claim: <one-line summary of what the change says it does>

Consistent with claim:
- <file or change area> — <why it fits>

Possibly out of scope:
- <file or change area> — <why it doesn't obviously fit>
  Suggested action: ask the author, or accept as cleanup, or request
  it be split out

Outside the diff, but relevant: <e.g. "no test files changed despite
behavior changes" or "no migration despite schema field rename">
```

### 2. Check spec alignment (only if a spec is claimed)

If the change claims to implement a spec (look for spec ID in PR
description, commit messages, or branch name; ask the user if unclear),
read the spec's three files:

- `.agent/specs/NNNN-x/SPEC.md` — behavioral requirements
- `.agent/specs/NNNN-x/harness.md` — acceptance criteria
- `.agent/specs/NNNN-x/impact.md` — `touches_architecture`,
  dependencies

For each numbered behavioral requirement in `SPEC.md`:

- Find evidence in the diff that it's met. Cite the file/line.
- Find a test that asserts it (in the diff if new, in existing tests
  if extending coverage). Cite.
- If neither is visible: `[GAP]` — flag it.

For each acceptance criterion in `harness.md`:

- Same check.

For each `touches_architecture` module:

- Confirm the diff actually touches it (otherwise the impact is
  wrong).
- Confirm the diff doesn't touch *other* modules not in the list
  (otherwise the impact is incomplete).

Output for this step:

```
## Step 2 — Spec alignment (NNNN-x)

Behavioral requirements:
- BR-1: ✓ met — <file:line>, test <test path>
- BR-2: ✓ met — <file:line>
- BR-3: ⚠ [GAP] — no visible evidence; ask author
- BR-4: ✗ contradicted — diff shows X but spec requires Y

Acceptance criteria:
- ✓ <criterion> — <evidence>
- ⚠ [GAP] <criterion> — no test found

Impact accuracy:
- touches_architecture: [api, web]
  - Diff touches api/ ✓
  - Diff touches web/ ✓
  - Diff also touches db/ — not in touches_architecture (update impact.md)
```

Use ✓ / ⚠ / ✗ deliberately. Don't paper over gaps.

### 3. Drift check

Whether or not a spec was claimed, the change may have drifted from
other specs in the codebase. Run with conservative mode (the default,
matching the project's posture from `AGENTS.md`):

```
node .agent-tools/check-drift.mjs --mode=conservative --since=<branch-base-date>
```

Use `--mode=aggressive` only if the reviewer explicitly asks — for example,
on a large refactor PR where conservative noise would overwhelm the
substantive findings.

If the tool reports yellow or red findings *for specs that aren't
the one being implemented*, those are drift findings for this PR.

Then categorize each finding with the reviewer:

- **Register entry needed**: the change touched a module covered by
  another spec, but the change is genuinely orthogonal to that spec's
  behavior. Draft a `not-applicable` register entry.
- **Existing spec needs update**: the change extends or modifies an
  existing spec's behavior. Note which spec, what needs to change.
- **Follow-up spec needed**: the change introduces new behavior that
  should have its own spec. Note for a follow-up.

For direct-to-code changes (no spec claimed at all), the drift check
is even more important — the entire change is potential drift.

Output:

```
## Step 3 — Drift

Drift check ran: <conservative | aggressive> mode

Findings for other specs:
- [NNNN-x] <message>
  Suggested action: register entry (not-applicable) — drafted below

Direct-to-code surface (no spec claimed):
- New endpoints: <list>
- New modules: <list>
- Behavior changes outside any current spec: <list>
  Suggested action: <register entry | follow-up spec | inline with this PR>
```

If the reviewer wants to triage the drift findings interactively, the
`reconcile-drift` skill handles that. Don't do triage inside this
skill — keep concerns separated.

### 4. Cross-cutting concerns

Prompt the reviewer on things that hide in diffs. For each, present
what you found from inspecting the diff and ask the reviewer to
confirm or note:

- **New public API surface**: HTTP routes, exported functions, CLI
  flags, message schemas. List them. Reviewer confirms each is
  intentional and documented.
- **New dependencies**: changes to `package.json`, `pyproject.toml`,
  `go.mod`, etc. List them. Reviewer confirms they're justified.
  If multiple are added, ask whether an ADR is warranted.
- **Schema or migration changes**: database migrations, breaking
  changes to persisted formats. List them. Reviewer confirms
  backward compatibility or migration path.
- **Breaking changes**: anything that changes the contract for
  existing callers. List them. Reviewer confirms intentional and
  noted in changelog / release notes.
- **Performance-sensitive paths**: hot loops, request handlers,
  database queries, anything in `O(n²)` distance. If touched,
  flag for benchmark consideration.
- **Documentation diagrams**: did this diff change any structural
  shape visualized in an inline mermaid block in `ARCHITECTURE.md`,
  `CONTEXT.md`, or an implementing `SPEC.md`? (Personas added or
  removed, module boundaries changed, trust crossings added, MAS
  topology shifted, OAuth/auth flow steps changed.) If yes and the
  diagram update isn't in the diff, that's a finding — either
  request the diagram update before merge, or accept with a
  follow-up note. A diagram that no longer matches the code is
  worse than no diagram. See `ARCHITECTURE.md` → "Documentation
  diagrams" for the project convention.

Output:

```
## Step 4 — Cross-cutting

New public APIs:
- POST /api/welcome/dismiss — <file:line>

New deps:
- <none>

Schema changes:
- New column `users.dismissed_suggestions` — migration <file>
  ⚠ Rollback path: confirm reversible

Breaking changes:
- <none detected>

Performance-sensitive paths touched: <yes/no, files>

Documentation diagrams affected:
- <none> | <list of doc:diagram pairs that need updating, or ✓ updated in this diff>
```

### 4b. Security review

A separate, structured pass against the project's threat model
(`.agent/CONTEXT.md` → "Threat model") and security baseline
(ADR-0002 / OWASP ASVS L2). Not a "if you happen to notice"
afterthought — every review walks this checklist for any diff that
touches application code.

Apply each item to the diff. Output `✓ ok`, `⚠ concern`, `✗ blocking`,
or `n/a` with one-sentence evidence.

#### Web-tier walk (OWASP Top 10 mapping)

For each, ask: does this diff change anything on this axis? If yes,
is the new state still correct per the threat model?

| Axis | What to look for in the diff |
|---|---|
| **T-AUTH** (Authn) | Login/signup/logout/MFA changes; password handling; rate-limit additions or removals; user-enumeration risk (same response for missing-user vs wrong-password?) |
| **T-SESSION** | Cookie attribute changes; session creation/revocation; TTL or sliding-expiration changes; new bearer-token paths |
| **T-IDOR** (Authz / tenancy) | New repository methods — do they take `user_id`? New routes — do they use `get_current_user`? Joins across user-owned tables — tenant-filtered? |
| **T-INJECTION** | Raw SQL added (look for `text(...)` or string-built queries); shell calls (`subprocess` with shell=True); log injection (user input passed unescaped to log) |
| **T-XSS** (Output) | Frontend rendering of user-controlled content; `dangerouslySetInnerHTML` / `[innerHTML]`; LLM output piped to render without escape |
| **T-CSRF** | New state-changing routes (must be POST/PUT/PATCH/DELETE); cross-origin frontend changes (do we need a CSRF token now?) |
| **T-CRYPTO** | Any new use of `random`, `md5`, `sha1`, `pickle`, `eval`, `exec`; new crypto primitives — only stdlib + argon2-cffi accepted |
| **T-CONFIG** | New env vars (validated in Settings?); security headers middleware still applied; CORS allowlist changes; body-size limits |
| **T-DEPS** | `pyproject.toml` deps changed? `pip-audit` clean? New top-level dep — ADR written? |
| **T-LOG** | New `log.*` calls — do they emit PII, secrets, raw email, tokens, session ids? Redaction processors still in place? Security-relevant events still logged (auth fail, authz deny)? |
| **T-SSRF** | New outbound HTTP calls — allowlisted target? Following redirects to private IPs? |

#### LLM-tier walk (OWASP Top 10 for LLM Apps)

Skip if the diff doesn't touch `app/agents/`, `app/graphs/`,
`app/tools/`, or prompt-construction code.

| Axis | What to look for |
|---|---|
| **T-LLM01** (Prompt injection) | User-controlled content concatenated into a prompt? Must be inside the delimited wrapper helper. Any system prompt change that weakens the "treat wrapped content as data" instruction? |
| **T-LLM02** (Output handling) | LLM output rendered? Passed back to another LLM? Used as a function argument that triggers side effects? Must be sanitized/escaped at the boundary |
| **T-LLM06** (Sensitive info disclosure) | Logs/traces persisting full prompts? Citations exposing raw email content? Structural privacy boundary intact (Synthesizer not importing `repositories/` or email tools)? |
| **T-LLM07** (Tool design) | New tool: Pydantic input + output? Takes `user_id`? Minimum scope (one capability per tool)? |
| **T-LLM08** (Excessive agency) | New side-effecting action: does it require per-action user confirmation? Could the agent batch-execute without re-confirmation? |

#### Security-gate evidence

Confirm the security gates ran clean for this change (or are accounted
for if not). Don't accept "I'll run it later":

- `bandit -r backend/app` — any new findings?
- `pip-audit` — any new vulnerable deps?
- `gitleaks detect` — any flagged secrets in the diff?
- Negative tests present for any new authn/authz/validation BR?

Output format:

```
## Step 4b — Security

Web-tier walk:
- T-AUTH:    ✓ ok — new endpoint /me uses get_current_user; rate-limit covers it
- T-IDOR:    ✓ ok — UserRepository.get_by_id requires UUID; no listing methods
- T-LOG:     ⚠ concern — new log.info in app/api/auth.py emits email address;
             ASVS L2 allows lowercased email for security-event logs, but flag
             for explicit review
- T-DEPS:    ✓ ok — no dep changes

LLM-tier walk: n/a — no agent/graph/tool code touched

Security gates:
- bandit:    ✓ 0 findings
- pip-audit: ✓ 0 vulns
- gitleaks:  ✓ 0 leaks
- Negative tests for new auth BR: ✓ test_login_unknown_email_returns_same_401

Net: ✓ approve from a security angle | ⚠ one item to acknowledge
```

Spend the time this deserves — security findings are the most
expensive class to catch late.

### 5. Coaching opportunities

When a change is direct-to-code that *would have* benefited from the
spec flow, the review is a teaching moment. Draft constructive
feedback for the reviewer to consider:

- What spec flow would have caught this earlier
- Concrete next-time steps (use `ideate` for the product question, or
  `grill-spec` for the implementation plan)
- *Not* a scolding — the change can still merge if it's good

Reviewer chooses whether to include the coaching note in their review
comments. The point isn't to make every PR a lesson; it's to surface
the opportunity so the reviewer can decide.

Output:

```
## Step 5 — Coaching (optional)

This change is direct-to-code for a feature that adds new user-visible
behavior (welcome screen redirect). For changes of this shape, the
`ideate` + `grill-spec` flow would have:
- Surfaced the activation-rate hypothesis up front
- Given the team a spec to review before implementation
- Made the dismiss-state persistence decision visible to product

Suggested comment (paste/adapt as you like):

> Nice work shipping this. For next time, this is the kind of change
> that benefits from a quick spec — even 30 minutes of `grill-spec`
> would have caught the dismiss-state-persistence question before
> implementation. Worth using the flow for the next feature like this.
```

### 6. Produce review artifacts

Pull everything together. Two artifacts:

**Review summary** (for the reviewer's own use, not posted):

```
# Review summary: <PR title or branch>

Verdict: <approve | request changes | comment>

Strengths:
- <what's well done>

Must address before merge:
- <blocking item> — <reason>

Should address (non-blocking):
- <item>

Drift actions:
- Register entries to add: <list, drafted below>
- Specs to update: <list>
- Follow-up specs to file: <list>
```

**Review comments** (for the author, ready to post):

Structure these as line comments (when they apply to specific code)
and overall comments (for global feedback). Use direct, constructive
language. No filler.

```
### Overall comment

<2-3 sentences: what's good, what needs work, what blocks merge>

### Line comments

`src/api/welcome.py:42`
The dismiss endpoint isn't idempotent — concurrent calls would race.
BR-4 in spec 0001 requires per-user-per-suggestion persistence; a
unique constraint or upsert would fix this.

`tests/api/test_welcome.py`
No test for the legacy-user fallback case (BR-8). The spec calls it
out explicitly — please add a test before merge.

### Drift entries (drafted for REGISTER.md)

```yaml
- date: 2026-05-18
  ref: PR#147
  kind: feature
  area: user-prefs
  one_line: "Extended user prefs to track per-suggestion dismissal state"
  spec_status: needed
  follow_up_spec: TBD (will be filed as 0008)
```

### Suggested follow-up

File a spec for the suggestion-dismissal subsystem. The current
implementation works but the spec flow would clarify the dismissal
lifecycle (which is asked about in line comments above).
```

## Anti-patterns to avoid

- **Re-running tests as review.** Tests are the dev's job to run. The
  review is about *whether the change is right* — tests passing is a
  precondition, not the goal of review.
- **Approving without spec alignment.** If a spec was claimed and the
  diff has `[GAP]` findings, don't soften them — ask the author to
  address before approving.
- **Drift triage in this skill.** Surface drift findings; categorize
  them; let `reconcile-drift` do the actual triage when the user
  wants. Don't do everyone's job at once.
- **"LGTM" reviews.** If your output is "all five steps clear,
  approve", the review didn't happen. Either you actually found
  nothing — say so with confidence and specifics ("BRs 1-8 all met,
  cross-cutting clean, no drift") — or you skimmed. Skimming is
  worse than no review.
- **Coaching that scolds.** The coaching step is "here's a better way
  next time", not "you should have". The author should walk away
  wanting to use the flow, not feeling punished for not.
- **Treating the spec as the law.** Specs are decisions the team made
  at a point in time. If a change deviates from a spec and the
  deviation is right, the spec needs updating — that's not a review
  failure, that's the system working. Flag the spec-update need;
  don't treat the spec as untouchable.

## When the change shouldn't have been made

Sometimes you review a change and conclude: this shouldn't be in this
PR at all. Maybe it's two unrelated features merged together, maybe
it's a refactor smuggled inside a hotfix, maybe it's mostly fine but
includes one ill-considered piece.

Say so directly. Suggest the right shape (split into two PRs, revert
the refactor, etc.). The skill's job is to help the reviewer make
that call clearly — not to find a way to approve everything.

## Speed expectations

- Steps 0–1 should take ~30 seconds for a small PR, a few minutes for
  a large one
- Step 2 (spec alignment) is the slowest — budget time proportional to
  the spec's complexity
- Steps 3–4 are mostly mechanical; the skill does the heavy lifting
- Step 5 takes seconds — most PRs won't need it
- Step 6 is the synthesis; should be ~5 minutes of the reviewer's
  attention

A good review on a small-medium PR using this skill: 15–30 minutes.
A thorough review on a large PR: an hour or more, which is appropriate
for a change that took days to write.

## Reviewer's call always wins

The skill is a structured prompt set, not a verdict. If the reviewer
disagrees with a finding ("that's not actually a gap, it's covered
by an existing integration test I know about"), the reviewer's call
stands. Update the artifact and move on.
