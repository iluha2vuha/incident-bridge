# Rehearsal Plan

This plan covers the real-device checks needed before a facilitated Incident Bridge demo. Use
fictional nicknames and the local Friday Pay Run scenario only.

## Setup

- Start the backend and frontend using the chosen route in `docs/DEMO_ROUTE.md`.
- Prefer a temporary HTTPS tunnel for the first rehearsal.
- Confirm the facilitator can create a quick-mode and standard-mode room.
- Confirm the lobby QR code opens the participant join page on a phone.
- Keep browser dev tools available on the facilitator laptop.

## Two-Participant Rehearsal

- Join with two phones.
- Select one HR role and one IT Helpdesk role.
- Start quick mode.
- Submit votes from both participants in every round.
- Refresh one participant during an open round and confirm reconnect restores the same room, role,
  round, and vote state.
- Complete the debrief and confirm final metrics, timeline, learning points, and discussion
  questions are visible.

## Six-Participant Rehearsal

- Join with six phones or browser profiles.
- Split roles unevenly, then confirm the lobby imbalance warning is clear.
- Rebalance to a 3 and 3 split before starting.
- Run standard mode through all five rounds.
- Confirm duplicate votes are rejected or replaced according to the current UI behaviour.
- Confirm role-filtered private context differs between HR and IT Helpdesk.
- Refresh the facilitator view and confirm the session restores.

## Nine-Participant Rehearsal

- Join with nine participants.
- Confirm the room rejects a tenth participant.
- Run at least quick mode from start to debrief.
- Check that lobby, vote status, round results, and debrief remain readable with all participants.
- Have one participant miss a vote and confirm the facilitator can still lock, reveal, and advance.
- Close the session and confirm late joins are rejected.

## Recording Results

Record the rehearsal date, route used, participant count, device/browser mix, pass/fail result, and
any confusing instructions or layout issues. Do not record real company names, email addresses,
employee identifiers, credentials, or internal incident details.
