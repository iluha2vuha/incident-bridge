# Design Specification

Status: initial low-fidelity direction. This is not a polished visual system.

## Design Character

Incident Bridge should feel like a professional operational incident-room interface: serious, clear under time pressure, modern, accessible, and polished enough for a portfolio.

Avoid:

- Matrix green.
- Hooded hacker imagery.
- Skulls.
- Excessive neon.
- Dense SOC dashboards.
- Tiny typography.
- Generic admin templates.
- Essential hover interactions.

## Visual Direction

- Use a deep neutral base for participant incident screens.
- Use clearer, lighter facilitator control surfaces where helpful.
- Use amber for active incident states.
- Use cool blue for IT Helpdesk.
- Use warm coral or violet for HR.
- Reserve green for confirmed positive outcomes.
- Reserve red for genuine warnings.
- Use monospace only for room codes, timestamps, and technical indicators.
- Use readable sans-serif type for scenario content.
- Never distinguish roles by colour alone; always include explicit labels and icons.

## Participant Design Target

- 360 to 430 CSS pixels wide.
- One-handed use.
- Large touch targets.
- One primary action per screen.
- Minimal horizontal layout.
- No hover dependency.
- Visible but calm connection/session status.
- Main incident update understandable in about 15 to 25 seconds.

## Facilitator Design Target

- 1280 to 1440 pixels wide.
- Prominent room code and QR area.
- Clear HR and IT Helpdesk counts.
- Participant connection status.
- Round controls.
- Vote completion indicators.
- Tie resolution.
- Clear reveal suitable for the facilitator laptop.
- Designed for someone speaking while operating it.

## Participant Journey

### QR / Join URL

Sees: room code, join URL, fictional-content notice, and session status.

Understands: this is temporary and no account is required.

Primary action: enter room code or follow QR link.

Could go wrong: invalid room, closed room, room full, weak connection.

Feedback: clear error and retry option.

Private information: none.

Next: nickname entry.

### Nickname

Sees: nickname field and short privacy note.

Understands: nickname is temporary and visible to facilitator/lobby.

Primary action: enter nickname and join.

Could go wrong: nickname too long, unsupported characters, room reaches capacity.

Feedback: inline validation.

Private information: none.

Next: role selection.

### Role Selection

Sees: HR and IT Helpdesk role cards with short descriptions.

Understands: role affects private information and choices.

Primary action: select role.

Could go wrong: participant changes mind, room starts while choosing.

Feedback: selected role confirmation and lock state.

Private information: role briefing not shown yet.

Next: lobby.

### Lobby

Sees: room name/code, selected role, participant count, waiting status.

Understands: facilitator will start when ready.

Primary action: wait or change role before start.

Could go wrong: disconnected, facilitator closes room, role imbalance.

Feedback: connection status, session status.

Private information: selected role only.

Next: role briefing.

### Role Briefing

Sees: concise role objectives and what their department cares about.

Understands: their role has different information from others.

Primary action: continue when facilitator opens the round.

Could go wrong: participant assumes briefing is secret forever; clarify role-specific content is for discussion.

Feedback: waiting for facilitator.

Private information: role context.

Next: round decision.

### Round Decision

Sees: round progress, shared incident update, role badge, private role information, four action choices, submit button, status.

Understands: they vote once; discussion is encouraged before submitting if facilitator allows.

Primary action: select an action and submit.

Could go wrong: no choice selected, duplicate submit, round locks before vote, disconnect.

Feedback: disabled submit until selected, submitting state, accepted state, locked state.

Private information: role-only briefing and role choices.

Next: waiting.

### Vote Submitted / Waiting

Sees: vote accepted, chosen action summary, waiting for facilitator.

Understands: their vote is recorded and cannot be changed unless a later design explicitly supports it.

Primary action: wait.

Could go wrong: connection drops.

Feedback: reconnecting state keeps vote status visible.

Private information: their selected action.

Next: consequence reveal.

### Consequence Reveal

Sees: department decisions, public consequence, metric movement, learning point.

Understands: results are organisational, not individual scores.

Primary action: discuss, then continue when facilitator advances.

Could go wrong: participant looks for individual ranking.

Feedback: clear "organisation outcome" framing.

Private information: none beyond role labels.

Next: next round or final debrief.

### Disconnected / Reconnecting

Sees: offline or reconnecting state with last known screen.

Understands: refresh should restore the same participant when possible.

Primary action: wait or retry.

Could go wrong: token expired, room closed.

Feedback: safe error message.

Private information: preserve selected role and submitted vote status.

Next: restored current session state or ended state.

### Final Debrief

Sees: final metrics, timeline, learning points, and discussion questions.

Understands: the goal is organisational learning.

Primary action: participate in debrief.

Could go wrong: session ended early.

Feedback: completed state.

Private information: none.

Next: session ends.

## Facilitator Journey

### Create Session

Sees: mode selector, scenario selector, create button.

Says/does: explains the exercise is fictional and temporary.

Primary control: create room.

Secondary information: quick versus standard timing.

Problems: session creation fails.

Reconnect behaviour: no active session yet.

### Lobby

Sees: room code, QR placeholder, join URL, participant list, HR/IT counts.

Says/does: asks participants to join and choose roles.

Primary control: start game.

Secondary information: connected count, role imbalance, capacity.

Problems: empty role, room full, participant disconnected.

Reconnect behaviour: facilitator token restores lobby.

### Start And Briefing

Sees: role counts and briefing state.

Says/does: confirms people may speak to each other and should share role-relevant observations.

Primary control: open round.

Secondary information: selected mode and round list.

Problems: one role empty; show warning but allow facilitator override.

### Round Control

Sees: current round, shared summary, vote completion by department, missing vote count, timer guide.

Says/does: reads or frames the round, gives discussion time, then locks voting.

Primary controls: open round, lock round.

Secondary information: participant connection state and round notes.

Problems: late votes, participant disconnected.

Reconnect behaviour: restore current round state.

### Tie Resolution

Sees: tied department, tied choices, vote counts, facilitator notes.

Says/does: asks the role to briefly discuss, then selects final department action.

Primary control: resolve tie.

Secondary information: selected choice effects are not necessarily shown to participants.

Problems: facilitator resolves wrong department; require confirmation later.

### Consequence Reveal

Sees: department decisions, public consequence, metric changes, learning point, discussion questions.

Says/does: reveals the result and leads a short discussion.

Primary control: next round or final debrief.

Secondary information: private facilitator explanation.

Problems: group spends too long discussing; facilitator can advance.

### Final Debrief

Sees: final metrics, timeline, strongest coordination moments, risk-increasing choices, discussion questions.

Says/does: connects lessons to generic reporting, verification, and incident-response procedures.

Primary control: end session.

Secondary information: decision timeline and learning points.

Problems: participant asks for official policy; facilitator redirects to approved organisational procedures.

## Low-Fidelity Wireframes

### Participant - Join

```text
+--------------------------------+
| Incident Bridge                |
| Room code                      |
| [ AB7K2P              ]        |
| [ Join room ]                  |
| Fictional training exercise    |
| Status: connected              |
+--------------------------------+
```

Hierarchy: product name, room input, primary CTA, privacy/status note.

### Participant - Role Selection

```text
+--------------------------------+
| Choose your role               |
| [ HR ]                         |
| Employee info, payroll, trust  |
| [ IT Helpdesk ]                |
| Account security, containment  |
| Status: room open              |
+--------------------------------+
```

Hierarchy: role choice first, short descriptions second.

### Participant - Lobby

```text
+--------------------------------+
| Room AB7K2P                    |
| You are: HR                    |
| Participants: 6                |
| HR: 3  IT: 3                   |
| Waiting for facilitator        |
| [ Change role ]                |
+--------------------------------+
```

Hierarchy: confirmation, counts, waiting status.

### Participant - Role Briefing

```text
+--------------------------------+
| HR briefing                    |
| Protect employee information   |
| Keep payroll trusted           |
| Verify sensitive requests      |
| Waiting for Round 1            |
+--------------------------------+
```

Hierarchy: role label, objectives, waiting state.

### Participant - Round Decision

```text
+--------------------------------+
| Round 1 of 5                   |
| Suspicious payroll request     |
| Shared update                  |
| ...                            |
| HR-only information            |
| ...                            |
| Choose one action              |
| ( ) Action A                   |
| ( ) Action B                   |
| ( ) Action C                   |
| ( ) Action D                   |
| [ Submit decision ]            |
| Status: voting open            |
+--------------------------------+
```

Hierarchy: progress, shared facts, private facts, choices, submit.

### Participant - Vote Submitted

```text
+--------------------------------+
| Decision submitted             |
| Your choice: Action B          |
| Waiting for others             |
| HR votes: 2/3                  |
| IT votes: 3/3                  |
+--------------------------------+
```

Hierarchy: accepted status, choice recap, waiting progress.

### Participant - Consequence Reveal

```text
+--------------------------------+
| Round result                   |
| HR chose: Targeted check       |
| IT chose: Capture and remove   |
| Consequence text               |
| Incident Control +13           |
| Evidence Quality +17           |
| Learning point                 |
+--------------------------------+
```

Hierarchy: department choices, consequence, metrics, learning point.

### Participant - Reconnecting

```text
+--------------------------------+
| Reconnecting                   |
| Keeping your session place     |
| Last known state: vote accepted|
| [ Retry now ]                  |
+--------------------------------+
```

Hierarchy: status and reassurance.

### Participant - Final Debrief

```text
+--------------------------------+
| Final debrief                  |
| Incident Control: 72           |
| Evidence Quality: 81           |
| Timeline                       |
| 1. Payroll request             |
| 2. Mailbox rule                |
| Discussion question            |
+--------------------------------+
```

Hierarchy: final outcome, timeline, discussion.

### Facilitator - Create Session

```text
+--------------------------------------------------------------+
| Incident Bridge                                              |
| Mode: [ Quick ] [ Standard ]     Scenario: Friday Pay Run    |
| [ Create temporary session ]                                |
+--------------------------------------------------------------+
```

Hierarchy: setup controls only.

### Facilitator - Lobby / Participants Joining

```text
+--------------------------------------------------------------+
| Room AB7K2P                       QR PLACEHOLDER             |
| Join: incident-bridge.local/join/AB7K2P                      |
| Participants 6/9    HR 3   IT 3                              |
| Connected list                                               |
| Warning area                                                 |
| [ Start exercise ] [ End session ]                           |
+--------------------------------------------------------------+
```

Hierarchy: room code and QR first, role counts second, control last.

### Facilitator - Empty Role Warning

```text
+--------------------------------------------------------------+
| Room AB7K2P                                                  |
| Participants 4/9    HR 4   IT 0                              |
| Warning: IT Helpdesk has no participants                     |
| [ Start anyway ] [ Wait ]                                    |
+--------------------------------------------------------------+
```

Hierarchy: warning must be visible before start.

### Facilitator - Round Control / Votes Arriving

```text
+--------------------------------------------------------------+
| Round 3 of 5: Suspicious mailbox activity                    |
| Phase: voting open                 Timer guide: 01:12        |
| HR votes: 2/3      IT votes: 1/3                              |
| Missing: Morgan, Sam                                         |
| Facilitator notes                                            |
| [ Lock voting ]                                              |
+--------------------------------------------------------------+
```

Hierarchy: round, phase, vote progress, control.

### Facilitator - Round Locked

```text
+--------------------------------------------------------------+
| Voting locked                                                |
| HR majority: Targeted payroll check                          |
| IT majority: Capture and remove rule                         |
| [ Reveal consequence ]                                       |
+--------------------------------------------------------------+
```

Hierarchy: locked status, department actions, reveal.

### Facilitator - Department Tie

```text
+--------------------------------------------------------------+
| Tie requires resolution                                      |
| HR tied choices                                              |
| 2 votes: Targeted payroll check                              |
| 2 votes: Broad payroll alert                                 |
| [ Select final HR action ]                                   |
| [ Confirm resolution ]                                       |
+--------------------------------------------------------------+
```

Hierarchy: tie, vote counts, final facilitator action.

### Facilitator - Consequence Reveal

```text
+--------------------------------------------------------------+
| Round consequence                                            |
| Public result text                                           |
| Metrics: Control +18 Evidence +11 Continuity -5 Trust +7     |
| Learning point                                               |
| Discussion questions                                         |
| [ Next round ]                                               |
+--------------------------------------------------------------+
```

Hierarchy: reveal content and discussion support.

### Facilitator - Final Debrief

```text
+--------------------------------------------------------------+
| Final debrief                                                |
| Metrics summary                                              |
| Decision timeline                                            |
| Coordination moments                                         |
| Discussion questions                                         |
| [ End session ]                                              |
+--------------------------------------------------------------+
```

Hierarchy: final outcome and discussion.

## Component Inventory For Later

- RoomCodeDisplay.
- QRPanel.
- RoleCard.
- RoleBadge.
- ConnectionStatus.
- SessionStatus.
- MetricSummary.
- MetricDelta.
- IncidentBriefing.
- PrivateRolePanel.
- ActionChoice.
- SubmitDecisionButton.
- VoteProgress.
- FacilitatorControlBar.
- TieResolutionPanel.
- ConsequencePanel.
- DecisionTimeline.
- DebriefQuestions.
- ErrorNotice.
- ReconnectingBanner.

## Accessibility Notes

- All choices must be semantic buttons or radio controls.
- Touch targets should be at least 44 CSS pixels high.
- Status changes should be announced with accessible live regions where appropriate.
- Colour cannot be the only role or severity signal.
- Text must remain readable at mobile widths.
- Error states need clear recovery actions.
