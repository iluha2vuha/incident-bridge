# Project Instructions

## Project Purpose

Incident Bridge is a small browser-based, facilitator-led cybersecurity tabletop exercise for 3 to 15 participants. Prefer simple implementations appropriate for a single-instance concept demonstration.

The first scenario supports HR and IT Helpdesk. The engine must remain data-driven enough that future roles can be added through content changes rather than rewritten multiplayer logic.

## Source Of Truth

Read the relevant sections before significant work:

- `docs/PRODUCT_SPEC.md`
- `docs/GAME_DESIGN.md`
- `docs/PROTOCOL.md`
- `docs/THREAT_MODEL.md`
- `docs/ARCHITECTURE.md`
- `design/DESIGN_SPEC.md`
- `TASKS.md`

If a request conflicts with the Incident Bridge master blueprint or these source files, follow the master blueprint unless the user explicitly approves a documented change.

## Architecture Rules

- Future frontend: React, TypeScript, Vite.
- Future backend: FastAPI, Pydantic, native WebSockets.
- Version 1 active sessions stay in memory.
- Scenario content is stored in validated files.
- The server is authoritative for state, permissions, votes, metrics, and role-private visibility.
- Clients receive only role-appropriate snapshots.
- Clients send intentions, not outcomes.

## Engineering Rules

- Keep tasks narrowly scoped.
- Follow existing patterns before creating abstractions.
- Do not perform unrelated refactors.
- Do not add dependencies without explaining why existing tools are insufficient.
- Do not add a database unless explicitly approved.
- Do not add user accounts, chat, leaderboards, runtime AI, or a scenario editor in version 1.
- Validate every external input.
- Never trust client-supplied phase, role, score, or authorisation state.
- Add or update tests when behaviour changes.
- Report commands run and exact test results.

## Privacy Rules

- Use fictional data only.
- Do not add company names, logos, policies, systems, incidents, credentials, network details, or employee information.
- Do not persist personal information by default.
- Do not log facilitator tokens or participant tokens.

## Approval Gates

Stop and report before:

- Adding or replacing a major dependency.
- Adding authentication or permanent user accounts.
- Adding a database, Redis, or shared state service.
- Changing the scenario format substantially.
- Changing public API or WebSocket contracts.
- Publishing, deploying, or modifying external services.
- Collecting personal data.
- Performing a broad repository reorganisation.

## Definition Of Done

A task is complete only when acceptance criteria are met, relevant tests pass, manual verification is reported where useful, unrelated changes are absent, and known limitations are stated.
