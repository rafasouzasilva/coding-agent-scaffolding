# Unified Agent-Guided Development Framework

This framework provides a unified methodology for integrating AI agents directly into the software development lifecycle. Whether you are bootstrapping a new dynamic multi-agent system from scratch or bringing a legacy codebase under modern spec-driven control, this architecture ensures code quality, rigorous documentation, and accelerated development.

The core philosophy revolves around **Spec-Driven Development** and **Archaeology vs. Transcription**. The agent is an active participant that reads, proposes, and validates, while the human developer retains ultimate architectural authority.

## The Core Architecture: `.agent/`

Regardless of whether a project is new or existing, the source of truth lives in the `.agent/` directory.

- **`CONTEXT.md`**: Contains domain vocabulary and system invariants (e.g., specific terminologies for multi-agent dynamic orchestration, stateful short-term memory management).
- **`ARCHITECTURE.md`**: Defines module boundaries, tech stack conventions, and architectural patterns (e.g., Medallion architectures, event-driven integrations).
- **`HARNESS.md`**: Executable checks and judgment-based audits tailored to the stack.
- **`specs/`**: Contains the individual feature specifications. Each spec goes through a rigorous lifecycle (`discovered` -> `proposed` -> `accepted` -> `implemented`).
- **`discovery/`**: The staging area for reverse-engineering outputs, such as surveys and complete summaries.

---

## Workflow 1: Greenfield (Starter Pack)

For new projects, the framework acts as a **paste-in starter**. It is designed to scaffold modern applications quickly, using a spec-first approach.

### 1. Scaffolding the Core
Drop in the starter files to populate `CONTEXT.md`, `ARCHITECTURE.md`, and `HARNESS.md`. Trim and adapt these files aggressively. A concise, accurate harness is better than a long, aspirational one.

### 2. Tech Stack Customization
The starter pack is stack-agnostic but comes with pre-configured snippets for common modern stacks:
- **Backend/AI:** Python with FastAPI, LangGraph, or Pydantic-AI. Easily adaptable for complex topologies like multi-agent dynamic routing or stateful memory management using Valkey.
- **Frontend:** Angular or React.
- **Local Dev Environments:** Pre-tailored to work seamlessly with Linux, Podman, and local datastores like Postgres or DuckDB.

### 3. Agent-Guided Iteration
Write a spec, define the harness tests, and let the agent generate the implementation. The agent ensures the code adheres to the boundaries defined in `ARCHITECTURE.md` and the vocabulary in `CONTEXT.md`.

---

## Workflow 2: Brownfield (Reverse Engineering)

Bringing an existing project into the framework requires the `reverse-engineer` skill. This process treats the agent as an archaeologist: observing what the code *does*, not dictating what it *should* do.

### Phase 1: Survey
The agent scans the entire repository to produce `.agent/discovery/SURVEY.md`. 
- Identifies the stack, config files, and top-level directories.
- Fragments the codebase into candidate **areas** (e.g., "Agent memory extraction pipeline", "HR multi-agent communication layer").
- Honestly reports **coverage gaps**—files it couldn't parse or skimmed.

### Phase 2: Area-by-Area Discovery
For each approved area, the agent reverse-engineers the logic into an isolated `.agent/specs/NNNN-<area>/` folder.
- **`SPEC.md`**: A purely *descriptive* document outlining observed behaviors, inputs, outputs, and side effects. Untested behaviors are explicitly tagged with `[INFERRED]`.
- **`FINDINGS.md`**: A critical log of suspected bugs, dead code, data integrity risks, and test contradictions.
- **`status: discovered`**: All generated specs start here. They are observations, not contracts.

*Note: This phase must be executed one area at a time to prevent noise and ensure accuracy.*

### Phase 3: Backfill Architecture & Context
Once specs are generated, the agent drafts the global documentation.
- Extrapolates observed imports into `ARCHITECTURE.md`, tagging boundaries as `[OBSERVED]`.
- Extracts domain vocabulary and repeating invariants into `CONTEXT.md`, tagging them as `[DEMONSTRATED]` or `[CANDIDATE]`.

### Phase 4: The Review Pass (Human-in-the-Loop)
This is where the reverse-engineering solidifies into living documentation. The human developer:
1. Converts descriptive language ("returns 404") into prescriptive contracts ("shall return 404").
2. Resolves `[INFERRED]` tags by accepting them, fixing the spec, or scheduling a test implementation.
3. Promotes `[OBSERVED]` architectural boundaries to `[DELIBERATE]` decisions, or flags them for refactoring.
4. Elevates spec statuses from `discovered` to `implemented` (if accurate) or `accepted` (if the code needs updates to match the spec).
