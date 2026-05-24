# Onboarding an existing project

This guide walks you through bringing a project that already has code
(but no `.agent/` structure) into this template.

## What you'll end up with

After the process below:

- A `SURVEY.md` describing the codebase's shape and candidate areas
- One spec folder per documented area, with `status: discovered`
- A `FINDINGS.md` per spec listing suspected bugs, dead code, and
  ambiguities the agent couldn't resolve
- Draft `ARCHITECTURE.md` and `CONTEXT.md` derived from observed code
- An updated history view that reflects everything

Then you do a **review pass**: convert descriptive language to
prescriptive, resolve `[INFERRED]` tags by deciding what's required
vs accidental, promote specs from `discovered` → `proposed` or
`accepted`, and fix or schedule the items in `FINDINGS.md`.

## Step 1: Drop the template in, don't overwrite anything

```bash
# In the root of the existing project:
cd /path/to/your-existing-project

# Copy template files in, but skip src/ (you already have code)
cp -r /path/to/agent-project-template/.agent .
cp -r /path/to/agent-project-template/.agent-tools .
cp /path/to/agent-project-template/AGENTS.md .

# Delete the example spec — it doesn't apply to your project
rm -rf .agent/specs/0001-example-feature

# Activate adapters for the agents you'll use (see .agent/agents/README.md)
```

At this point the structure is in place but `CONTEXT.md`,
`ARCHITECTURE.md`, and `HARNESS.md` are still empty placeholders. **Do
not fill them in yet.** The reverse-engineer skill writes them in
Phase 3, informed by what it learned in Phases 1 and 2.

## Step 2: Run Phase 1 (Survey)

Open your agent in the project and use a prompt like this:

> Use the `reverse-engineer` skill at `.agent/skills/reverse-engineer/`.
> Run **Phase 1 only**: read the codebase, produce `.agent/discovery/SURVEY.md`,
> and stop. Do not write any specs yet. Be honest about coverage gaps.

The agent reads the skill, walks the codebase, and produces the survey.
Read it carefully. Look for:

- Areas the agent identified that you don't recognize as coherent
- Areas you know exist that the agent missed
- Coverage gaps (the section at the bottom — trust this)

Edit the survey if needed. Reorder areas by priority — the most
load-bearing or worst-documented areas first.

## Step 3: Run Phase 2 (one area at a time)

For each area you want documented, prompt the agent:

> Use the `reverse-engineer` skill, **Phase 2**, for area A3 from
> `.agent/discovery/SURVEY.md`. Produce one spec at `status: discovered`
> plus a `FINDINGS.md`. Stop after this one area and report back.

Critical: **one area per prompt**. Resist the temptation to say "do
all of them". You want to review each area's output before the agent
takes the next, because patterns from one area inform what to look for
in the next.

For each area's output, do a **fast first-pass review**:

1. Read the spec. Does it describe what you remember the area doing?
2. Read `FINDINGS.md`. Anything urgent — security, data integrity?
3. Look at the `[INFERRED]` density. If more than a quarter of
   behaviors are inferred, the area lacks test coverage — note that
   as a follow-up task.
4. If something is clearly wrong, tell the agent and have it redo
   that section before moving on.

Don't try to convert `discovered` to `proposed` yet. That's the deep
review pass, after everything's documented.

## Step 4: Run Phase 3 (Backfill architecture and context)

After all the areas you care about are documented, prompt:

> Use the `reverse-engineer` skill, **Phase 3**. Draft `ARCHITECTURE.md`
> and `CONTEXT.md` from the specs and findings. Run `build-history.mjs`.
> Produce `.agent/discovery/COMPLETE.md` summarizing what was done.

Now `ARCHITECTURE.md` is a draft full of `[OBSERVED]` tags and
`CONTEXT.md` has `[DEMONSTRATED]` vs `[CANDIDATE]` tags. Both are
useful but neither is authoritative until you review them.

## Step 5: The review pass (this is your work, not the agent's)

This is where reverse-engineering pays off — or fails.

**Goal:** convert every `discovered` spec to a real status, and decide
what in `ARCHITECTURE.md` and `CONTEXT.md` you're committing to.

Per spec:

1. Read it as if you were writing it from scratch. Every observation:
   is this intended behavior or accident?
2. Convert descriptive to prescriptive. "Returns 422 when X" becomes
   "shall return 422 when X" — **only if you've decided that's the
   contract**.
3. Resolve `[INFERRED]` tags. Either: (a) it's correct and you accept
   it; (b) it's wrong and you fix the spec; (c) it needs a test, so
   you add it to the spec's `harness.md` as an executable check to be
   written.
4. Walk through `FINDINGS.md`. For each: ignore, fix now (separate
   change with its own spec), or open a ticket.
5. Promote status. If you're confident the code matches the now-edited
   spec, `implemented`. If the spec describes what should be but the
   code doesn't match yet, `accepted` (with the diff as the next work
   item). If you're not sure: leave as `proposed` and add open questions.

Per architecture entry:

- For each `[OBSERVED]` boundary: keep as `[DELIBERATE]`, remove (it's
  not actually a rule), or add it as a refactor target with a spec
- For each `[CANDIDATE]` invariant: verify (then `[DEMONSTRATED]`),
  remove, or schedule fixing the code so it becomes true

## What to expect

On a small project (~5-15k LOC): Phase 1 in 10 minutes, Phase 2 takes
maybe 20-40 minutes total across all areas, Phase 3 in 15 minutes. The
review pass is the longest part — budget hours, not minutes.

On a larger project (~50k+ LOC): Phase 1 still fast. Phase 2 you'll
likely scope to the top 10–15 most important areas first, document
others lazily as you touch them. Don't try to reverse-engineer
everything in one go; you'll produce noise.

## Anti-patterns to avoid

**Asking for everything at once.** "Document the whole codebase" gets
you a 5,000-line dump nobody reads. Use the phase structure.

**Trusting `[INFERRED]` tags by default.** Inferred behaviors are
guesses by the agent based on names and adjacent code. Some are
right; many aren't. Treat them as questions, not statements.

**Skipping the review pass.** A repo full of `discovered` specs is
not the same as a documented project. It's a documented-shaped object.
The review pass is what makes it real.

**Letting the agent fix bugs found during reverse-engineering.** The
agent's job is to *find* them and put them in `FINDINGS.md`. Fixing
them is separate work with its own spec, harness run, and history
entry. Otherwise you can't tell the difference between "this is how
it always worked" and "the agent silently changed this while
documenting it".

**Architecture written first.** If you fill in `ARCHITECTURE.md`
before reverse-engineering, the agent will produce specs that match
your hopes rather than the actual code. Always do Phase 3 last.
