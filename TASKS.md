# Incident Bridge Backlog

## Phase 0 - Foundation

- [x] Initialise Git repository.
- [x] Create source-of-truth documentation.
- [x] Draft complete Friday Pay Run scenario.
- [x] Document paper prototype, user journeys, wireframes, constraints, and threat model.
- [ ] Review foundation documents with the project owner.

## Phase 1 - Scenario Validation

- [x] Convert approved scenario structure into a strict JSON draft.
- [x] Define Pydantic and TypeScript scenario shapes.
- [x] Add validation rules for roles, metrics, choices, flags, quick-mode rounds, and interaction rules.
- [x] Add tests for invalid and valid scenario content.

## Phase 2 - Paper Prototype

Status: deferred/user-owned; not complete.

Note: `docs/SCENARIO_DRY_REVIEW.md` records an agent-assisted pre-test review, but this does not complete Phase 2. These tasks require a real manual run with participants.

Codex note: do not remind the project owner to run Phase 2 unless they explicitly ask about paper testing, rehearsal, or Phase 2.

- [ ] Run the scenario manually with at least 3 people.
- [ ] Record confusing instructions, timing, obvious choices, and role imbalance.
- [ ] Update `docs/GAME_DESIGN.md` and `scenarios/friday_pay_run.yaml`.

## Phase 3 - UX / Design Prototype

- [ ] Produce fake-data participant and facilitator screens.
- [ ] Test on a real phone width.
- [ ] Update `design/DESIGN_SPEC.md` with approved tokens, components, and state references.

## Phase 4 - Repository Technical Setup

- [x] Add React + TypeScript + Vite frontend skeleton.
- [x] Add FastAPI + Pydantic backend skeleton.
- [x] Add test, lint, and formatting commands.
- [x] Add scenario validation command.
- [x] Add minimal CI only after local commands exist.

## Phase 5 - Static Interface

- [x] Build fake-data participant flow.
- [x] Build fake-data facilitator flow.
- [x] Verify mobile and desktop layouts.

## Phase 6 - Room Creation / Joining

- [x] Create sessions with public room codes and private facilitator tokens.
- [x] Join with temporary nickname and private participant token.
- [x] Handle invalid, full, closed, and expired rooms.
- [x] Show live lobby updates.

## Phase 7 - Role Selection

- [x] Implement HR and IT Helpdesk role cards.
- [x] Show role counts and imbalance warnings.
- [x] Lock role selection after start.

## Phase 8 - First Live Round

- [x] Open round 1.
- [x] Send role-filtered content.
- [x] Submit one accepted vote per participant.
- [x] Lock voting, aggregate by role, and reveal a result.

## Phase 9 - Generic Game Engine

- [ ] Extract state machine, vote aggregation, metric effects, flags, and interaction rules.
- [ ] Add tests for majority, ties, duplicate votes, invalid transitions, and metric bounds.

## Phase 10 - Full Scenario

- [ ] Add all five standard rounds through validated content.
- [ ] Add quick mode as selected round IDs from the same scenario.

## Phase 11 - Debrief

- [ ] Show final metrics.
- [ ] Show decision timeline.
- [ ] Show discussion questions and learning points.

## Phase 12 - Reconnection / Error Handling

- [ ] Restore participant state after refresh.
- [ ] Restore facilitator state after refresh.
- [ ] Handle closed sessions, late joins, missed votes, ties, and disconnects.

## Phase 13 - Deployment

- [ ] Document the easiest first demo route after rehearsal.
- [ ] Document the secondary demo route only if useful.
- [ ] Add QR-code generation.
- [ ] Rehearse with real devices.

## Phase 14 - Polish / Testing

- [ ] Run 2, 6, and 9 participant rehearsals.
- [ ] Prepare portfolio-safe README, screenshots, and architecture diagram.

## Later / Not Version 1

- Accounts or SSO.
- In-app chat or voice.
- Individual rankings or leaderboards.
- Runtime AI.
- Scenario editor or role editor.
- PostgreSQL, Redis, Kubernetes, or multi-instance scaling.
- Native mobile apps.
- Long-term analytics.
- Real company procedures or internal incidents.
