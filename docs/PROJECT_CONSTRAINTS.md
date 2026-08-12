# Project Constraints

## Confirmed

- Incident Bridge is a concept demonstration and possible portfolio project.
- The master blueprint is the priority source when overlapping instructions conflict.
- Content must be fictional and generic.
- Do not use company names, logos, policies, incidents, systems, credentials, employee data, screenshots, or network information.
- Version 1 should not include accounts, chat, leaderboards, runtime AI, scenario editors, role editors, complex databases, Redis, Kubernetes, microservices, or native apps.
- The facilitator controls progression; no forced automatic advancement in version 1.
- Participants vote individually; department majority determines the department action.
- The facilitator resolves department ties.
- Shared organisational metrics are Incident Control, Evidence Quality, Business Continuity, and Employee Trust.
- Public repository publication is not approved yet.
- No deployment should happen during foundation setup.
- Personal-device demonstration is permitted.
- Version 1 should support 2 to 9 participants.
- The first version does not need a projector-specific view.
- The first version does not need anonymous result export.
- The facilitator may shut down the session manually; automatic expiration can stay simple.

## Assumed

- Initial development happens locally.
- The project can be kept as a private local Git repository.
- The first implementation stack will be React + TypeScript + Vite and FastAPI + Pydantic + native WebSockets.
- Active sessions can be in memory for version 1.
- Scenario content will eventually become validated JSON, but a human-readable draft is better for paper testing now.
- Quick mode should use rounds 1, 3, and 5 from the standard scenario.

## Needs Decision

- Whether work created during the internship may be published on a personal GitHub profile.
- Whether the company owns any part of the project or code.
- Whether the company name or internship can be mentioned publicly.
- Whether public HTTPS or local-device demo is easier for the first real rehearsal.
- Whether a local private network, spare phone hotspot, or travel router is useful after the easiest first demo path is chosen.
- Exact simple cleanup behaviour after the facilitator ends a session.

## Networking Notes

First-demo path: choose whichever is easiest to rehearse safely, public HTTPS or local-device/network demo. Do not make the choice permanent yet.

Local-device/network path: a local private network from the facilitator laptop may be useful, but it must be tested with near-target participant count before any live presentation.

The primary development path must not depend on company Wi-Fi.

## Source Prompt Conflicts

No substantive conflict was found between the project setup prompt and the master blueprint. Where the blueprint suggested a future full repository structure with `frontend/` and `backend/`, this foundation task deliberately stops before creating application implementation code.
