# Context — Python + FastAPI + LangGraph/Pydantic-AI + frontend snippet

> Paste these entries into `.agent/CONTEXT.md` under "Domain vocabulary"
> and "Invariants". Adapt names to your actual domain.

## Vocabulary (LLM-app concerns)

- **Agent**: a configured LLM caller with a defined system prompt,
  tool set, and output schema. Lives under `backend/app/agents/`.
- **Graph**: a LangGraph state machine. Has typed `State`, an explicit
  entry node, and at least one terminal node. One graph per use case.
- **Node**: a single step in a graph. Pure function from `State` to
  `Partial[State]`. Side effects only via injected services.
- **Tool**: a function callable by an agent. Pydantic-validated input
  and output. Lives under `backend/app/tools/`.
- **Run**: one execution of a graph from entry to terminal. Has a
  `run_id` and a persisted trace.
- **Session**: a user-facing conversation that may comprise multiple
  runs. Stored in `backend/app/sessions/`.

## Vocabulary (web concerns)

- **Resource**: a REST entity exposed by FastAPI. One router per
  resource under `backend/app/api/`.
- **Service**: business logic. Composed by routers; calls repositories
  and tools. Lives under `backend/app/services/`.
- **Repository**: the only place that talks to the database. Returns
  domain objects, never raw rows.
- **View model**: a frontend-shaped DTO returned by the API. Always
  distinct from the domain object; defined in Pydantic.

## Invariants

- All times stored and transmitted in UTC. Frontend formats locally.
- All IDs are UUIDv7 unless explicitly documented otherwise.
- All inputs and outputs at API boundaries pass through Pydantic models.
  No untyped dicts cross a service or router boundary.
- All LLM calls happen inside an agent or tool — never directly from a
  router or service.
- All tool calls go through Pydantic-validated input/output schemas;
  no string-only contracts with the model.
- The frontend never embeds API URLs as string literals outside one
  central client module.
