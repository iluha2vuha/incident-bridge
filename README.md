# Incident Bridge

Incident Bridge is a concept demonstration for a facilitator-led, multiplayer cybersecurity tabletop exercise. Participants use their phones to join a temporary room, choose a department role, receive role-specific information, vote on decisions during a fictional incident, and review the organisational consequences with a facilitator.

Current status: technical skeleton. The repository contains validated scenario content, a React/TypeScript/Vite prototype frontend, and a small FastAPI backend skeleton. Live multiplayer gameplay is not implemented yet.

## Why It Exists

Traditional awareness presentations can explain good practice, but they rarely let people practise judgement under uncertainty. Incident Bridge is designed to create discussion around verification, escalation, evidence preservation, containment, business continuity, and employee trust.

## Initial Experience

- 2 to 9 participants use phones in version 1.
- One facilitator uses a laptop and may project the room view.
- Initial roles are HR and IT Helpdesk.
- The first scenario is "The Friday Pay Run", a fictional payroll-phishing and account-compromise exercise.
- Quick mode uses 3 rounds.
- Standard mode uses 5 rounds.
- The facilitator controls all progression.

## Architecture Direction

The later application is intended to use:

- React, TypeScript, Vite, React Router, and organised CSS or CSS Modules.
- FastAPI, Pydantic, native FastAPI WebSockets, and Pytest.
- Validated scenario files.
- In-memory active sessions for version 1.
- One authoritative server that controls state, votes, permissions, private role visibility, metrics, and consequences.

No database, user accounts, chat, runtime AI, complex admin system, or multi-service infrastructure is planned for version 1.

## Privacy Principles

- Use fictional, generic content only.
- Collect only temporary nicknames, temporary tokens, role, votes, connection status, and live session history.
- Do not collect emails, accounts, real names, employee IDs, company identifiers, real incidents, internal procedures, credentials, or network details.
- Do not score individuals or keep long-term personal performance history.

## Project Structure

```text
backend/    FastAPI/Pydantic backend skeleton, scenario models, and Python tests
docs/       Source-of-truth product, game, protocol, architecture, threat, and constraint docs
design/     UX flow, wireframe, and design direction docs
frontend/   React/TypeScript/Vite prototype frontend and frontend tests
scenarios/  Human-readable draft scenario source
scripts/    Small repo-level utility commands
AGENTS.md   Rules for future AI coding agents
TASKS.md    Ordered backlog and scope boundaries
```

## Local Development

Install dependencies:

```sh
make install-backend
make install-frontend
```

Run local servers:

```sh
make backend-dev
make frontend-dev
```

Run validation, tests, linting, and formatting:

```sh
make validate-scenario
make test
make lint
make format
```

## Scenario Validation

Run the default Friday Pay Run scenario validation with:

```sh
python3 scripts/validate_scenario.py
```

## Roadmap

See `TASKS.md` for the ordered backlog. The next application phase is the static fake-data interface before live room creation, joining, role selection, and voting.

## Limitations

- This is not production-ready.
- No live multiplayer implementation exists yet.
- The FastAPI backend is a technical skeleton only.
- Public release, company affiliation, and ownership must be clarified before publication.
- Deployment and local networking decisions are deliberately unresolved; the first demo should use whichever route is easiest to rehearse safely.
