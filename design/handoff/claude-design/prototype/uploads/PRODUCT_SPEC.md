# Product Specification

## Purpose

Incident Bridge is a facilitator-led multiplayer cybersecurity tabletop exercise used after a cybersecurity-awareness presentation. It lets participants practise decision-making during a fictional incident where no single department has the complete picture.

The goal is a complete, reliable, visually polished concept demonstration, not maximum feature count.

## Problem

Awareness training can explain rules, but real incidents require judgement under pressure. Participants may need to verify identity, preserve evidence, escalate, communicate, and protect business continuity while information is incomplete.

## Users

- 2 to 9 participants using their own phones in version 1.
- One facilitator using a laptop, ideally a MacBook.

## Initial Roles

- HR: employee information, payroll continuity, employee trust, identity verification, escalation, and communication.
- IT Helpdesk: identity verification, account security, evidence preservation, containment, investigation, and avoiding unnecessary disruption.

Future roles may include Finance, Communications, Legal, Management, or SOC. Version 1 should avoid unnecessarily hard-coding HR and IT Helpdesk into the engine.

## Core Participant Experience

1. Scan a QR code or open a join URL.
2. Enter a temporary nickname.
3. Join the room.
4. Select HR or IT Helpdesk.
5. Wait in the lobby.
6. Read a short role briefing.
7. Read shared incident information.
8. Read role-private information.
9. Choose and submit one action.
10. Wait while others vote.
11. See department decisions and shared consequence.
12. Continue to the next round.
13. Review the final organisational outcome.

## Core Facilitator Experience

1. Open the facilitator dashboard.
2. Select quick or standard mode.
3. Select The Friday Pay Run scenario.
4. Create a temporary session.
5. Display the QR code and room code.
6. Watch participants join and select roles.
7. See role counts and warnings for empty or imbalanced roles.
8. Start the exercise.
9. Open, lock, reveal, and advance each round.
10. Resolve department ties when needed.
11. Lead discussion from the final debrief and decision timeline.
12. End the session and clear temporary data.

## First Scenario

The first scenario is "The Friday Pay Run". It begins with an urgent payroll-information request and develops into evidence of an employee account compromise and possible internal phishing.

Quick mode uses rounds 1, 3, and 5 from the same story. Standard mode uses all five rounds.

## MVP Features

- Facilitator room creation.
- Public room code and join URL.
- Temporary nicknames.
- Role selection.
- Live lobby.
- Facilitator-controlled progression.
- Role-private information.
- Individual voting.
- Department-level majority decisions.
- Facilitator tie resolution.
- Shared organisational metrics.
- Consequence reveal.
- Final debrief and decision timeline.
- Basic reconnection.
- Mobile participant UI.
- Desktop facilitator UI.
- Generic fictional content.

## Explicit Non-Goals For Version 1

- Accounts, passwords, SSO, or profiles.
- Email collection.
- In-app chat or voice communication.
- Individual rankings or leaderboards.
- Public matchmaking.
- Runtime AI.
- Scenario editor or role editor.
- Multiple simultaneous facilitators.
- Native mobile apps.
- PostgreSQL, Redis, Kubernetes, microservices, or complex admin systems.
- Long-term analytics.
- Real company policies, incidents, systems, logos, or employee data.

## Privacy Principles

Collect only what the live session needs:

- Temporary nickname.
- Participant ID.
- Temporary participant token.
- Selected role.
- Votes.
- Connection status.
- Temporary session event timeline.

Do not score individuals. Do not keep permanent personal performance history.

## Success Criteria

- Participants can join without technical help beyond displayed instructions.
- The facilitator can run the session while speaking to the room.
- The app supports 2 to 9 participants in version 1.
- HR and IT Helpdesk receive only their own private information.
- Votes are not lost under expected use.
- Duplicate votes are rejected.
- Refreshing does not create duplicate participants.
- Quick mode fits about 8 to 12 minutes.
- Standard mode fits about 15 to 20 minutes.
- The scenario creates discussion rather than a trivial quiz.
- The final debrief connects decisions to generic good practice.
- The project remains suitable for a generic portfolio version if permission is granted.

## Future Possibilities

- QR-code joining.
- Projector view.
- Demo bots.
- Anonymous result export.
- A second small scenario.
- Additional roles through scenario content.
- Public HTTPS demo or local-device demo, choosing whichever is easier to rehearse first.
