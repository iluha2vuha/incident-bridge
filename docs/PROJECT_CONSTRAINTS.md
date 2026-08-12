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
- Whether personal devices may be used in a demonstration.
- Whether a public HTTPS demo is permitted.
- Whether a local private network, spare phone hotspot, or travel router is permitted.
- Whether anonymous result export is useful in version 1.
- Whether a projector-specific view is needed for the first demo.
- Final session expiration duration.
- Final room capacity hard limit.

## Networking Notes

Primary likely path: public HTTPS single-instance demo, if permitted. This avoids dependence on company Wi-Fi and allows phones to use mobile data.

Fallback path: local private network from the facilitator laptop. This must be tested with near-target participant count before any live presentation.

The primary development path must not depend on company Wi-Fi.

## Source Prompt Conflicts

No substantive conflict was found between the project setup prompt and the master blueprint. Where the blueprint suggested a future full repository structure with `frontend/` and `backend/`, this foundation task deliberately stops before creating application implementation code.
