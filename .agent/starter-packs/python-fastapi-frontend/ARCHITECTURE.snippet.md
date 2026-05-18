# Architecture — Python + FastAPI + LangGraph/Pydantic-AI + frontend snippet

> Paste into `.agent/ARCHITECTURE.md`. Trim and adapt — keep what's true,
> delete what isn't.

## Stack

- Python 3.12+ (or pinned via `.python-version`)
- FastAPI for HTTP; uvicorn for serving
- LangGraph and/or Pydantic-AI for agent orchestration
- Pydantic v2 for all data shapes at boundaries
- PostgreSQL (asyncpg via SQLAlchemy 2.x or direct) for persistence
- pytest + httpx for backend tests
- ruff for lint and format; mypy (or pyright) for typecheck
- Frontend: Angular 17+ **OR** React 18+ (pick one; don't mix)
- pnpm or npm for frontend; matching version-locked
- Vitest (React) or Jest+Karma (Angular) for frontend tests

## Repository layout

```
backend/
  app/
    api/            FastAPI routers (one file per resource)
    agents/         Agent definitions (system prompt + tools + output schema)
    graphs/         LangGraph state machines (one folder per use case)
    tools/          Pydantic-validated callable tools
    services/       Business logic; orchestrates repositories and agents
    repositories/   Database access (the only layer that does)
    models/         Pydantic models (domain) and ORM models (persistence)
    config/         Settings via pydantic-settings; no os.environ in app code
  tests/
  pyproject.toml
web/
  src/
    app/ (Angular) or pages/+components/ (React)
    api-client/     One central typed client; never embed URLs elsewhere
    state/          State management (NgRx / Redux Toolkit / Zustand — one choice)
  package.json
```

## Module boundaries

- `api/` may import `services/`. Routers are thin: parse, delegate, return.
- `services/` may import `agents/`, `graphs/`, `tools/`, `repositories/`, `models/`.
- `agents/` and `graphs/` may import `tools/` and `models/`. Never `services/`
  (would create cycles).
- `repositories/` may only import `models/` and the DB driver.
- `models/` imports nothing from the rest of the app.
- Frontend `state/` and `api-client/` are the only modules that know the
  shape of API responses. Components consume view-model interfaces.

## Patterns

### FastAPI

- One `APIRouter` per file in `api/`, registered in `api/__init__.py`.
- Dependencies (DB session, current user, settings) come via `Depends`.
  Never import the DB session directly.
- Request and response models are explicit Pydantic classes — no
  `response_model=dict`.

### LangGraph

- Each graph has a typed `TypedDict` (or Pydantic model) for `State`.
- Nodes are pure async functions: `async def node(state) -> dict`. They
  return the partial state delta, not the full state.
- Side effects go through services injected via the graph's config or
  context, never imported at module top level inside the node.
- Persist the trace (node order, durations, errors) to `runs/` so
  debugging is possible after the fact.

### Pydantic-AI (or any agent framework)

- One agent definition per use case under `agents/`. The agent is a
  configured object, not a function. Functions live in `services/` and
  call the agent.
- Tools are functions decorated/registered with the agent, defined in
  `tools/`. Each tool has Pydantic input and output models.
- Agent outputs use `result_type` (or equivalent) — never parse free text.

### Errors

- Use a small set of tagged exception classes in `app/errors.py`
  (e.g. `NotFound`, `Conflict`, `ValidationFailed`, `AgentFailure`).
- FastAPI exception handlers translate them to HTTP responses in one place.
- Never raise plain `Exception` across a module boundary.

### Frontend

- Components are dumb where possible; data fetching and mutation belong
  to a hook (React) or a service (Angular).
- All API I/O goes through `api-client/`; no `fetch`/`HttpClient` calls
  scattered through components.
- Forms validate via the same schemas the backend exposes (generate
  TypeScript types from Pydantic via openapi-typescript or similar).

## What NOT to do

- Don't add new top-level dependencies without an ADR.
- Don't put business logic in route handlers or in React/Angular components.
- Don't use `Any` / `unknown` at module boundaries. Inside a function is fine.
- Don't call the LLM from a router. The agent indirection exists for testability.
- Don't share Pydantic models between domain and persistence — they have
  different lifecycles. Map at the repository.
- Don't use `print`. Use the configured logger.

## Spec metadata for agent features

When a spec describes an agent or graph, its `SPEC.md` should additionally
include:

- The graph's `State` schema (or a reference to it)
- The agent's tool set and output schema
- Required-evidence behavior: what observable trace must be present in
  `runs/` after a successful execution

This is what makes agent specs verifiable. Without it, the spec is just
"the LLM does something useful" — untestable.
