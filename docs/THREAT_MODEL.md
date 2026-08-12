# Threat Model

This early threat model is intentionally practical. It records risks and version 1 mitigations without over-engineering the concept demonstration.

## Assets

- Facilitator control of a live session.
- Role-private scenario information.
- Temporary participant tokens.
- Temporary facilitator token.
- Vote integrity.
- Session event timeline.
- Availability during a live exercise.

## Assumptions

- Scenario content is fictional.
- Participants are usually in the same physical room.
- Version 1 stores active sessions in memory.
- Room codes are public join secrets, not facilitator credentials.
- Public deployment, if approved, is a single instance.

## Risks And Mitigations

| Risk | Failure scenario | Version 1 mitigation |
|---|---|---|
| Guessed room codes | A stranger joins and disrupts a room | Short-lived rooms, non-sequential room codes, capacity limits, no public room directory, facilitator kick/end controls later |
| Participant impersonates facilitator | Participant opens or locks rounds | Separate high-entropy facilitator token and permission checks on every facilitator event |
| Participant votes twice | One participant changes department result | Store one accepted vote per participant per round and reject duplicates |
| Stale client modifies earlier round | Refreshed tab submits an old action | Validate phase, round ID, participant token, and vote status server-side |
| Cross-session event leak | One room receives another room's updates | Scope WebSocket connections and broadcasts by session ID |
| HR receives IT-private info | Role asymmetry and privacy fail | Generate server-side role-filtered snapshots and test leakage cases |
| IT receives HR-private info | Same as above | Same as above |
| Nickname injection / XSS | Nickname renders script in lobby | Validate length and characters; render text safely; never allow arbitrary HTML |
| Malformed WebSocket events | Unexpected payload crashes server | Parse and validate every event with Pydantic schemas |
| Token leakage in logs | Secrets exposed in terminal or hosting logs | Never log facilitator or participant tokens; redact auth fields |
| Excessive room creation | Public demo memory exhaustion | Rate limits, active-room caps, session expiration |
| Reconnect duplication | Refresh creates multiple participants | Use private reconnection tokens and participant IDs |
| Facilitator disconnection | Room cannot continue | Facilitator reconnect token and authoritative server state |
| Server restart | In-memory sessions vanish | Document as version 1 limitation; consider persistence only later |
| Public demo abuse | Unwanted sessions consume resources | Private repository until approved, capacity limits, expiration, no room directory |

## Security Requirements For Later Implementation

- Use `secrets` or equivalent cryptographically secure randomness for tokens.
- Keep room code and facilitator token separate.
- Authenticate at connection time and re-check authorisation for sensitive events.
- Enforce maximum participants per room.
- Enforce maximum WebSocket message size.
- Reject malformed event types.
- Encode all participant-provided text on render.
- Do not use `eval` or executable scenario content.
- Do not collect real names, emails, employee IDs, company data, or internal procedures.

## Open Threat Questions

- What rate limits are enough for a public portfolio demo?
- Should public demo sessions require a lightweight facilitator passphrase?
- What is the acceptable session expiration time?
- Should anonymous result export be local-only or downloadable from the facilitator view?
- What behaviour is best if the facilitator token is lost during a live room?
