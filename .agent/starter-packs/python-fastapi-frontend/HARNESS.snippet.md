# Harness — Python + FastAPI + LangGraph/Pydantic-AI + frontend snippet

> Paste into `.agent/HARNESS.md` under the matching sections. Adapt
> commands to your package manager. The `$ ` prefix is significant —
> `.agent-tools/check-harness.mjs` picks those lines up.

## Executable checks (gates)

Backend:

```
$ ruff check backend
$ ruff format --check backend
$ mypy backend/app
$ pytest backend -x --maxfail=1
```

Frontend (uncomment whichever applies):

```
$ pnpm --filter web lint
$ pnpm --filter web test --run
$ pnpm --filter web typecheck
$ pnpm --filter web build
```

Cross-cutting:

```
$ node .agent-tools/validate-specs.mjs
```

## Declarative rules (audits)

Python:

- [ ] No untyped function signatures in `backend/app/` (mypy strict mode
      catches most of this — flag anything it can't)
- [ ] No direct database access outside `backend/app/repositories/`
- [ ] No `os.environ` access outside `backend/app/config/`
- [ ] All API request and response models are explicit Pydantic classes
- [ ] All LLM calls go through an agent in `backend/app/agents/`
- [ ] All tools have Pydantic input and output models
- [ ] No `print()` in committed code (use the configured logger)

Frontend:

- [ ] Components do not call `fetch`/`HttpClient` directly
- [ ] No API URLs as string literals outside `api-client/`
- [ ] No `any` in new code without a justifying comment
- [ ] Forms use schemas generated from the backend's OpenAPI; not
      hand-typed duplicates

Agent/LLM specific:

- [ ] Every graph has a typed `State` and explicit terminal node(s)
- [ ] Graph nodes are pure functions of state plus injected services
- [ ] Agent outputs use `result_type` (or equivalent); no free-text parsing
- [ ] LLM-using code paths have either a recorded fixture or a mock —
      they must be runnable in CI without an API key

## Notes for monorepo scoping

When a spec touches only one area (backend OR frontend), the irrelevant
executable checks still run by default. For a fast inner loop you can
filter:

```
$ ruff check backend                # backend-only spec
$ pnpm --filter web lint            # frontend-only spec
```

…and run the full battery only at the end. The harness is not less
honest for being scoped, as long as you run everything before marking
the spec `implemented`.
