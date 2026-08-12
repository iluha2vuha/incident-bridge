# Architecture

This document describes the intended future application. It is not implemented yet.

## Principles

- Keep version 1 small and understandable.
- Use one authoritative server.
- Store active sessions in memory.
- Store scenario definitions as validated content files.
- Filter role-private information on the server.
- Avoid databases, distributed systems, runtime AI, and unnecessary frameworks in version 1.

## Intended Stack

Frontend:

- React.
- TypeScript.
- Vite.
- React Router.
- Native browser WebSocket API.
- React Context and reducer where useful.
- Organised CSS or CSS Modules.
- Vitest and React Testing Library.

Backend:

- Python.
- FastAPI.
- Pydantic.
- Native FastAPI WebSockets.
- `secrets` for temporary tokens.
- `asyncio.Lock` per active session.
- In-memory session manager.
- Pytest.
- Ruff or similar lightweight formatting/linting.

## High-Level Shape

```text
Participant phones ---- HTTP + WebSocket ---- FastAPI application
Facilitator laptop ---- HTTP + WebSocket ---- Session manager
                                            Game state machine
                                            Scenario loader
                                            WebSocket manager
                                            Security validation
                                            React static build
```

## Server Authority

The client must never independently decide:

- Active round.
- Voting state.
- Whether a vote is valid.
- Scores or metric effects.
- Facilitator identity.
- Private role visibility.
- Scenario flags.

Clients send intentions. The server validates, applies one state transition, updates session history, and broadcasts role-filtered snapshots.

## Core State Machine

```text
CREATED
-> LOBBY
-> ROLE_SELECTION
-> BRIEFING
-> ROUND_OPEN
-> ROUND_LOCKED
-> CONSEQUENCE_REVEALED
-> NEXT_ROUND or DEBRIEF
-> CLOSED
```

## Session Data

Version 1 active session data:

- Session ID.
- Public room code.
- Private facilitator token.
- Scenario ID and mode.
- Participants.
- Current phase.
- Current round index.
- Metric values.
- Scenario flags.
- Accepted votes.
- Department decisions.
- Event timeline.
- Expiration timestamp.
- Per-session lock.

## Scenario Content

The engine controls how games work. Scenario files control what a game says.

Core content types:

- Roles.
- Metrics.
- Rounds.
- Role-specific briefings.
- Choices.
- Effects.
- Flags.
- Interaction rules.
- Public result text.
- Facilitator notes.
- Debrief questions.

Scenario files must contain data only. They must not contain executable code or HTML.

## Deployment Direction

Preferred future path:

1. Localhost development.
2. Static fake-data prototype.
3. Public single-instance HTTPS demo if permitted.
4. Local-network fallback test.
5. Full multi-device rehearsal.

Version 1 should run as a single backend instance because in-memory sessions do not support horizontal scaling.

## Known Version 1 Limitations

- Server restart loses active sessions.
- No long-term analytics.
- No multi-instance WebSocket coordination.
- No database-backed recovery.
- No scenario editor.
