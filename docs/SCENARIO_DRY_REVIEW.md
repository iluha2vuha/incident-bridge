# Friday Pay Run Agent-Assisted Dry Review

Status: agent-assisted pre-test review only.

This review does not complete Phase 2. `TASKS.md` still requires a manual paper prototype run with at least three people before the paper-prototype phase can be marked complete. This dry review can help identify likely content and facilitation risks before that human test.

## Review Method

The scenario was reviewed against:

- `docs/PRODUCT_SPEC.md`
- `docs/GAME_DESIGN.md`
- `docs/PROJECT_CONSTRAINTS.md`
- `scenarios/friday_pay_run.json`

The review used four simulated perspectives:

- HR participant.
- IT Helpdesk participant.
- Facilitator/timekeeper.
- Content and validation reviewer.

## HR Participant Perspective

HR has meaningful information in every round. The role owns payroll continuity, employee anxiety, communication pressure, trust, and sensitive-change handling rather than merely reacting to IT.

Likely confusing wording:

- "Trusted channel" and "approved channels" are intentionally generic, but participants may ask what counts.
- "Escalate appropriately" may invite participants to invent real company procedures unless the facilitator keeps the discussion generic.

Choice quality risks:

- Secure-contact, support, and factual-communication choices often look strongest.
- Continuity penalties help, but a real test is needed to see whether HR choices feel like judgement calls or obvious quiz answers.

Role imbalance risks:

- HR may feel less like the incident owner if the facilitator frames the incident as mainly technical.
- The facilitator should emphasize employee trust, payroll continuity, sensitive-change handling, and communication timing as real incident outcomes.

## IT Helpdesk Participant Perspective

IT Helpdesk has concrete technical signals: password reset activity, active sessions, mailbox forwarding, possible unauthorised access, and account recovery work.

Likely confusing wording:

- "Capture details", "preserve logs", "review mailbox access", and "temporary controls" may be too technical for some participants.
- The facilitator may need to explain that these are generic actions, not instructions tied to a real tool or policy.

Choice quality risks:

- "Capture then remove" and "complete recovery records" are visibly strong options.
- Faster or less complete choices are plausible, but human testing is needed to confirm they create discussion instead of feeling simply wrong.

Role imbalance risks:

- IT may dominate because the compromise evidence becomes increasingly technical.
- HR should be prompted first in some discussions so payroll and trust trade-offs stay visible.

## Facilitator And Timing Perspective

Quick mode correctly uses rounds 1, 3, and 5. Standard mode correctly uses all five rounds.

Timing risks:

- Standard mode has four choices per role per round plus discussion and debrief, so it may exceed the target 15 to 20 minutes without tight facilitation.
- Rounds 3 and 4 are likely to be discussion-heavy because they combine payroll disruption, warning decisions, containment, uncertainty, and employee trust.
- Quick mode is the safer first demo path if time is constrained.

Facilitation risks:

- Participants may try to solve the scenario by importing real policies or tools.
- The facilitator should remind the group that the scenario is fictional and generic, and that local policy mapping belongs in the final debrief.

## Content And Validation Perspective

The strict JSON draft contains the expected scenario structure:

- Roles.
- Metrics.
- Flags.
- Quick and standard modes.
- Rounds.
- Role-private information.
- Choices.
- Effects.
- Interaction rules.
- Learning points.
- Debrief questions.

The content stays within the project constraints:

- Fictional and generic data.
- No real company names, logos, policies, credentials, systems, or incidents.
- No accounts, database, runtime AI, or scenario editor.

Main content risk:

- Several coordinated choices are visibly optimal, especially when both roles choose preservation, escalation, support, and documentation.
- Human testing is still needed to see whether the exercise creates discussion under time pressure.

## Limitations

This dry review cannot validate:

- Real participant comprehension.
- Phone reading burden.
- Group dynamics.
- Actual timing.
- Whether HR and IT Helpdesk feel equally empowered.
- Whether choices feel plausible under live facilitation.

Do not use this document as evidence that the Phase 2 paper prototype was completed.

## Follow-Up When Time Allows

- Run quick mode with at least three people.
- Record confusing wording, timing, obvious choices, and role imbalance.
- Update `docs/GAME_DESIGN.md` and scenario content only after observing real participants.
