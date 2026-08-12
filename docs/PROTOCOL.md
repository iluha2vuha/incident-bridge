# Protocol

This is the intended protocol. Phase 6 implements the room creation, joining, close, and live lobby update subset.

## Authority

The server is authoritative. Clients never decide the active round, voting state, permissions, facilitator identity, scores, private role visibility, or consequence outcomes.

## Conceptual State Machine

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

## Client To Server Events

`session:join`

- Sent by participant.
- Includes room code and temporary nickname.
- Returns participant ID and private participant token if accepted.
- Phase 6 HTTP endpoint: `POST /api/sessions/join`.

`session:reconnect`

- Sent by participant or facilitator after refresh or disconnect.
- Includes session ID and private token.
- Returns a fresh snapshot for that actor.

`role:select`

- Sent by participant.
- Includes role ID.
- Valid only before the game starts.

`decision:submit`

- Sent by participant.
- Includes round ID and choice ID.
- Valid only during `ROUND_OPEN`.
- Only one accepted vote per participant per round.

## Facilitator To Server Events

`session:create`

- Sent by facilitator.
- Includes scenario ID and mode.
- Returns session ID, public room code, private facilitator token, join URL, and lobby snapshot.
- Phase 6 HTTP endpoint: `POST /api/sessions`.

`game:start`

- Locks lobby and moves to briefing or first round setup.

`round:open`

- Opens the current round and sends role-filtered snapshots.

`round:lock`

- Stops vote acceptance and calculates department status.

`decision:resolve_tie`

- Records facilitator resolution for a department tie.

`round:reveal`

- Applies effects, interaction rules, flags, and sends public result.

`game:end`

- Closes the session and rejects further actions.
- Phase 6 lobby close endpoint: `POST /api/sessions/{session_id}/close`.

## Server To Client Events

`session:snapshot`

- Fresh actor-specific state after join, reconnect, or phase change.

`lobby:updated`

- Participant count, role counts, and connection status.
- Phase 6 WebSocket endpoint: `GET /ws/sessions/{session_id}/lobby` with either `facilitator_token` or `participant_token` as a query parameter.

`role:confirmed`

- Confirms a participant role selection.

`round:opened`

- Contains shared briefing, role-private briefing, choices for that role, and round progress.

`vote:accepted`

- Confirms one participant vote was accepted.

`round:locked`

- Indicates voting is closed and late votes are rejected.

`round:result`

- Public consequence, department decisions, metric changes, flags summary, and facilitator notes where permitted.

`game:completed`

- Final metrics, timeline, learning points, and debrief questions.

`application:error`

- Controlled error code and safe human-readable message.

## Role Filtering

Participant snapshots include:

- Shared information.
- Information for the participant's selected role.
- Choices for the participant's selected role.
- Public status and public results.

Participant snapshots must not include:

- Private information for other roles.
- Individual votes from other participants unless explicitly anonymised.
- Facilitator token or facilitator-only notes.

## Vote Aggregation

1. Count accepted votes by role and choice.
2. If one choice has the highest count for a role, it becomes that department decision.
3. If choices tie, the facilitator resolves the department decision.
4. Apply base effects for final department decisions.
5. Apply matching cross-role interaction rules.
6. Apply flag changes.
7. Clamp metric values to configured bounds.
8. Store the result in the timeline.

## Error Cases

Expected controlled errors include:

- Invalid room code.
- Closed or expired room.
- Room at capacity.
- Invalid nickname.
- Invalid role.
- Invalid choice.
- Duplicate vote.
- Vote after lock.
- Stale round ID.
- Permission denied.
- Malformed event.
- Reconnect token not recognised.
