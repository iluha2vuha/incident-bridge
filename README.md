# Incident Bridge

Incident Bridge is a concept demonstration for a facilitator-led, multiplayer cybersecurity tabletop exercise. Participants use their phones to join a temporary room, choose a department role, receive role-specific information, vote on decisions during a fictional incident, and review the organisational consequences with a facilitator.

Current status: project foundation and paper prototype. This repository does not yet contain the React/FastAPI application.

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
docs/       Source-of-truth product, game, protocol, architecture, threat, and constraint docs
design/     UX flow, wireframe, and design direction docs
scenarios/  Human-readable draft scenario source
AGENTS.md   Rules for future AI coding agents
TASKS.md    Ordered backlog and scope boundaries
```

## Roadmap

The next approved development work should validate the scenario format and prepare the paper prototype before building application code. See `TASKS.md` for the ordered backlog.

## Limitations

- This is not production-ready.
- No live multiplayer implementation exists yet.
- Public release, company affiliation, and ownership must be clarified before publication.
- Deployment and local networking decisions are deliberately unresolved; the first demo should use whichever route is easiest to rehearse safely.
