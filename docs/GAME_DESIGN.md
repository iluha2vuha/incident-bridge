# Game Design

## Scenario

Title: The Friday Pay Run

Summary: It is Friday near the payroll deadline. An employee receives an urgent message asking them to confirm payroll and bank information. At the same time, IT Helpdesk sees suspicious account activity. The incident develops into a likely account compromise and possible internal phishing.

Modes:

- Quick mode: rounds 1, 3, and 5.
- Standard mode: rounds 1, 2, 3, 4, and 5.

Roles:

- HR: protect employee information, keep payroll moving, support employee trust, verify sensitive requests, escalate appropriately.
- IT Helpdesk: verify identity, secure accounts, preserve evidence, contain compromise, investigate wider impact, avoid unnecessary disruption.

Metrics:

- Incident Control.
- Evidence Quality.
- Business Continuity.
- Employee Trust.

Metric values are illustrative training signals, not real risk calculations.

Reusable flags:

- `evidence_preserved`
- `incident_escalated`
- `employee_contacted_securely`
- `sessions_revoked`
- `broad_warning_sent`
- `coordinated_response`
- `payroll_paused_for_verification`
- `mailbox_rule_captured`
- `targeted_warning_sent`
- `employee_supported`
- `recovery_documented`

## Department Voting

Participants vote individually. Votes are grouped by role. The majority choice becomes that department's action. If a role ties, the facilitator pauses for discussion and selects the department action. Base effects from HR and IT Helpdesk actions are combined, then cross-role interaction rules are applied.

## Round 1 - The Suspicious Payroll Request

Purpose: connect a payroll concern with a technical warning before either role has the full picture.

Shared update: An employee reports an urgent message asking them to confirm payroll information before today's pay run.

HR-only information: The sender display name looks like a senior HR employee. The message requests personal and bank information. The employee is worried their salary may be delayed.

IT Helpdesk-only information: A password reset was requested for the employee earlier this morning from an unfamiliar browser. No incident has been formally reported. The account remains active.

### HR Choices

| ID | Choice | Effects | Flags |
|---|---|---|---|
| `hr-r1-reply-for-context` | Ask the employee to reply asking what details are needed, while HR checks payroll records. | Control -8, Evidence -4, Continuity +6, Trust -6 | none |
| `hr-r1-secure-contact-escalate` | Contact the employee through a trusted channel, preserve the message, and escalate the concern. | Control +10, Evidence +12, Continuity -3, Trust +8 | adds `employee_contacted_securely`, `evidence_preserved`, `incident_escalated` |
| `hr-r1-watch-for-pattern` | Hold the request until another report confirms whether this is isolated. | Control -3, Evidence +2, Continuity +3, Trust -2 | none |
| `hr-r1-broad-warning` | Send a quick all-staff warning that payroll messages may be suspicious. | Control +4, Evidence +1, Continuity -5, Trust +1 | adds `broad_warning_sent` |

### IT Helpdesk Choices

| ID | Choice | Effects | Flags |
|---|---|---|---|
| `it-r1-reset-now` | Reset the password immediately and ask the employee to sign in again. | Control +5, Evidence -5, Continuity -4, Trust -3 | none |
| `it-r1-verify-and-review` | Verify the employee through an approved channel and review recent account activity. | Control +9, Evidence +10, Continuity -2, Trust +5 | adds `evidence_preserved`, `employee_contacted_securely` |
| `it-r1-wait-confirmation` | Wait for HR or the employee to confirm compromise before intervening. | Control -6, Evidence +1, Continuity +5, Trust -2 | none |
| `it-r1-service-ticket-only` | Log it as a routine password-reset ticket and continue normal queue handling. | Control -4, Evidence +3, Continuity +4, Trust -1 | none |

### Cross-Role Rules

- `r1-secure-shared-picture`: if HR chooses `hr-r1-secure-contact-escalate` and IT chooses `it-r1-verify-and-review`, add Control +8, Evidence +6, Trust +4, and `coordinated_response`. Public result: HR and Helpdesk connect the payroll message and reset request early.
- `r1-warning-without-containment`: if HR chooses `hr-r1-broad-warning` and IT chooses `it-r1-wait-confirmation`, add Control -3, Continuity -4, Trust -3. Public result: the warning raises attention, but the account remains active while people ask what to do.
- `r1-speed-with-low-context`: if HR chooses `hr-r1-reply-for-context` and IT chooses `it-r1-reset-now`, add Evidence -4, Trust -3. Public result: both teams act quickly, but the investigation starts with avoidable gaps.

Public consequence text: The report is now being treated as suspicious. The quality of the next step depends on whether HR and Helpdesk combine the employee's concern with the account activity.

Private facilitator explanation: Strong outcomes preserve the message, verify the employee through trusted channels, and escalate without claiming a fictional policy is official. If participants ask what trusted or approved channels mean, keep the answer generic: use a separate known route rather than replying to the suspicious request. Weaker outcomes are plausible because they protect payroll speed or queue discipline, but they delay the shared picture.

Learning objective: Recognise connected warning signs.

Learning point: A business request and a technical event can be parts of one incident.

Debrief questions:

- What would each role have missed without the other role's information?
- What makes an urgent payroll request risky even when it looks routine?

## Round 2 - Repeated Authentication Prompts

Purpose: decide how to contain a suspected compromise while supporting the employee and preserving useful records.

Shared update: The employee says they received several authentication prompts during the morning.

HR-only information: The employee approved one prompt because they thought it related to payroll. They are embarrassed and worried they caused trouble. Payroll preparation is still in progress.

IT Helpdesk-only information: Several failed sign-ins were followed by one successful sign-in from a new device or location. Active sessions are still present.

### HR Choices

| ID | Choice | Effects | Flags |
|---|---|---|---|
| `hr-r2-support-and-hold-changes` | Reassure the employee, pause sensitive payroll changes for this case, and share a timeline with IT. | Control +7, Evidence +8, Continuity -4, Trust +9 | adds `employee_supported`, `payroll_paused_for_verification`, `evidence_preserved` |
| `hr-r2-finish-payroll-first` | Prioritise completing payroll, then revisit the security concern after the deadline. | Control -8, Evidence -2, Continuity +8, Trust -5 | none |
| `hr-r2-manager-only` | Ask the employee's manager to confirm whether the request is legitimate before HR acts. | Control +1, Evidence +1, Continuity +2, Trust +1 | none |
| `hr-r2-broad-reminder` | Send a general reminder not to approve unexpected prompts, without naming the employee. | Control +3, Evidence 0, Continuity -2, Trust +2 | adds `broad_warning_sent` |

### IT Helpdesk Choices

| ID | Choice | Effects | Flags |
|---|---|---|---|
| `it-r2-revoke-and-capture` | Revoke active sessions, capture sign-in details, and begin account recovery. | Control +12, Evidence +10, Continuity -5, Trust +3 | adds `sessions_revoked`, `evidence_preserved` |
| `it-r2-monitor-before-disrupting` | Monitor the account briefly to avoid disrupting payroll unless suspicious activity continues. | Control -4, Evidence +4, Continuity +6, Trust -1 | none |
| `it-r2-reset-without-session-review` | Reset the password but leave session and sign-in review for later. | Control +3, Evidence -3, Continuity -2, Trust 0 | none |
| `it-r2-disable-account` | Disable the account until the incident-response path confirms it is safe. | Control +10, Evidence +5, Continuity -8, Trust -2 | adds `sessions_revoked` |

### Cross-Role Rules

- `r2-supported-containment`: if HR chooses `hr-r2-support-and-hold-changes` and IT chooses `it-r2-revoke-and-capture`, add Control +8, Evidence +6, Trust +5, and `coordinated_response`.
- `r2-containment-business-friction`: if HR chooses `hr-r2-finish-payroll-first` and IT chooses `it-r2-disable-account`, add Continuity -6, Trust -4. Public result: Helpdesk contains the account, but HR is caught by surprise during payroll work.
- `r2-soft-response`: if HR chooses `hr-r2-manager-only` and IT chooses `it-r2-monitor-before-disrupting`, add Control -5, Continuity +3. Public result: the teams avoid disruption, but uncertainty remains high.

Public consequence text: The authentication prompts make compromise more likely. Account access, employee support, and payroll handling now need to be coordinated.

Private facilitator explanation: This round should not punish every disruptive action. Sometimes containment costs continuity. Clarify that pausing sensitive payroll changes for this case is narrower than stopping the whole pay run. The discussion is about sequencing and communication, not finding a magic answer.

Learning objective: Verify identity before sensitive action; preserve evidence.

Learning point: Prompt fatigue and urgent business context can combine to create risk.

Debrief questions:

- How can HR support the employee without implying blame?
- When is account disruption justified despite business impact?

## Round 3 - Suspicious Mailbox Activity

Purpose: balance evidence preservation and rapid cleanup when persistence is discovered.

Shared update: A new mailbox forwarding rule has been discovered on the employee's account.

HR-only information: Payroll must be completed shortly. Disabling access may interrupt an important workflow. Other HR staff are asking whether normal payroll work should continue.

IT Helpdesk-only information: The forwarding rule sends messages outside the organisation. Recent mailbox activity suggests unauthorised access. The exposure scope is not known yet.

### HR Choices

| ID | Choice | Effects | Flags |
|---|---|---|---|
| `hr-r3-targeted-payroll-check` | Pause only sensitive changes tied to this employee and tell HR staff to verify unusual payroll requests. | Control +6, Evidence +5, Continuity -3, Trust +5 | adds `payroll_paused_for_verification`, `targeted_warning_sent` |
| `hr-r3-continue-normal` | Continue payroll normally until IT confirms actual data exposure. | Control -6, Evidence -2, Continuity +8, Trust -4 | none |
| `hr-r3-stop-all-payroll` | Stop all payroll processing until the mailbox issue is fully understood. | Control +7, Evidence +3, Continuity -10, Trust -3 | none |
| `hr-r3-broad-payroll-alert` | Warn all employees that payroll-related messages may be suspicious. | Control +5, Evidence +1, Continuity -5, Trust +1 | adds `broad_warning_sent` |

### IT Helpdesk Choices

| ID | Choice | Effects | Flags |
|---|---|---|---|
| `it-r3-capture-remove-rule` | Capture details of the rule, remove it, and review mailbox access. | Control +11, Evidence +11, Continuity -3, Trust +3 | adds `mailbox_rule_captured`, `evidence_preserved` |
| `it-r3-delete-rule-fast` | Delete the rule immediately and focus on restoring normal access. | Control +7, Evidence -7, Continuity +1, Trust +1 | none |
| `it-r3-keep-rule-monitor` | Leave the rule briefly while monitoring to learn more about the activity. | Control -7, Evidence +5, Continuity +2, Trust -4 | none |
| `it-r3-disable-mailbox` | Disable mailbox access while preserving logs and investigating. | Control +10, Evidence +8, Continuity -8, Trust -2 | adds `sessions_revoked`, `evidence_preserved` |

### Cross-Role Rules

- `r3-targeted-and-captured`: if HR chooses `hr-r3-targeted-payroll-check` and IT chooses `it-r3-capture-remove-rule`, add Control +7, Evidence +6, Continuity +2, Trust +4, and `coordinated_response`.
- `r3-all-stop-and-disable`: if HR chooses `hr-r3-stop-all-payroll` and IT chooses `it-r3-disable-mailbox`, add Control +5, Continuity -8, Trust -5. Public result: containment is strong, but the organisation feels the operational impact immediately.
- `r3-fast-cleanup-low-evidence`: if IT chooses `it-r3-delete-rule-fast` and `evidence_preserved` is not present, add Evidence -5. Public result: the visible problem is removed, but investigation detail is weaker.

Public consequence text: The mailbox rule confirms that the incident is no longer just suspicious. The response now affects payroll continuity and the investigation trail.

Private facilitator explanation: The strongest path usually captures evidence before removal and keeps HR action targeted. Broad or total pauses can be justified but have trust and continuity costs. If IT considers leaving the rule briefly while monitoring, frame it as a risky trade-off, not as a recommended investigative default.

Learning objective: Balance containment, evidence, continuity, and trust.

Learning point: Cleanup is not the same as containment if useful evidence disappears.

Debrief questions:

- What should be preserved before removing suspicious mailbox artefacts?
- How targeted can HR's pause be without leaving payroll exposed?

## Round 4 - Wider Organisational Impact

Purpose: coordinate technical scope and employee communication as the incident spreads.

Shared update: Another employee reports receiving a similar message from the affected account.

HR-only information: Employees are asking whether payroll information has been exposed. A rushed all-staff message may create panic, but silence may damage trust.

IT Helpdesk-only information: The compromised account may have sent messages to several internal recipients. The full recipient list is still being investigated. Additional accounts may be at risk.

### HR Choices

| ID | Choice | Effects | Flags |
|---|---|---|---|
| `hr-r4-targeted-comms` | Prepare a targeted employee message with verified facts and escalation instructions. | Control +5, Evidence +3, Continuity -2, Trust +8 | adds `targeted_warning_sent` |
| `hr-r4-all-staff-warning` | Send an immediate all-staff warning that payroll messages may be fraudulent. | Control +7, Evidence +1, Continuity -6, Trust +2 | adds `broad_warning_sent` |
| `hr-r4-wait-for-full-scope` | Wait for IT to confirm the full recipient list before communicating. | Control -5, Evidence +2, Continuity +4, Trust -5 | none |
| `hr-r4-answer-individually` | Respond only to employees who ask questions, keeping public messaging limited. | Control -3, Evidence +1, Continuity +2, Trust -2 | none |

### IT Helpdesk Choices

| ID | Choice | Effects | Flags |
|---|---|---|---|
| `it-r4-scope-and-escalate` | Escalate through the incident process, identify recipients, and prioritise risky follow-up activity. | Control +11, Evidence +9, Continuity -3, Trust +4 | adds `incident_escalated`, `evidence_preserved` |
| `it-r4-block-similar-messages` | Add temporary controls to reduce similar messages while investigation continues. | Control +8, Evidence +2, Continuity -4, Trust +2 | none |
| `it-r4-wait-complete-logs` | Delay action until logs are complete enough to avoid false positives. | Control -7, Evidence +4, Continuity +4, Trust -4 | none |
| `it-r4-bulk-reset-at-risk` | Reset credentials for all potentially affected recipients immediately. | Control +9, Evidence +3, Continuity -9, Trust -3 | adds `sessions_revoked` |

### Cross-Role Rules

- `r4-verified-targeted-response`: if HR chooses `hr-r4-targeted-comms` and IT chooses `it-r4-scope-and-escalate`, add Control +8, Evidence +4, Trust +7, and `coordinated_response`.
- `r4-broad-with-blocks`: if HR chooses `hr-r4-all-staff-warning` and IT chooses `it-r4-block-similar-messages`, add Control +5, Continuity -3, Trust +1. Public result: people are warned and technical controls reduce spread, though noise increases.
- `r4-silence-and-wait`: if HR chooses `hr-r4-wait-for-full-scope` and IT chooses `it-r4-wait-complete-logs`, add Control -8, Trust -6. Public result: the teams avoid false alarms, but the incident has more time to spread.

Public consequence text: The incident is now visible beyond one employee. Communication and technical scoping need to move together.

Private facilitator explanation: There is no perfect communication timing. The exercise should surface what facts are needed, what can be said safely, and why silence can itself create harm. Ask what trade-off the group is accepting rather than asking for the right answer.

Learning objective: Coordinate business and technical responses.

Learning point: Communication should be timely, factual, and linked to the response process.

Debrief questions:

- What facts are needed before sending a wider warning?
- How can technical scoping and employee communication support each other?

## Round 5 - Recovery And Communication

Purpose: finish recovery while preserving accountability, learning, continuity, and employee trust.

Shared update: The immediate threat is being contained. The organisation now needs to recover, communicate, and learn from the incident.

HR-only information: The affected employee needs support. Payroll checks still need confirmation. Wording that blames one person could reduce future reporting.

IT Helpdesk-only information: Unauthorised sessions need confirmation, mailbox rules need final review, and technical actions should be documented.

### HR Choices

| ID | Choice | Effects | Flags |
|---|---|---|---|
| `hr-r5-support-confirm-communicate` | Support the employee, confirm sensitive payroll actions, and prepare a factual update through approved channels. | Control +5, Evidence +3, Continuity -1, Trust +10 | adds `employee_supported`, `targeted_warning_sent` |
| `hr-r5-quiet-closeout` | Keep communication minimal to avoid extending anxiety once the account is contained. | Control -2, Evidence +1, Continuity +5, Trust -5 | none |
| `hr-r5-speed-payroll-catchup` | Focus on catching up payroll work and leave incident follow-up to IT. | Control -4, Evidence -2, Continuity +8, Trust -4 | none |
| `hr-r5-formal-lessons` | Schedule a lessons-learned discussion with HR and IT, but delay employee messaging. | Control +3, Evidence +4, Continuity -2, Trust -2 | adds `recovery_documented` |

### IT Helpdesk Choices

| ID | Choice | Effects | Flags |
|---|---|---|---|
| `it-r5-complete-recovery-records` | Confirm session revocation, remove persistence, restore secure access, and document actions. | Control +10, Evidence +8, Continuity +2, Trust +4 | adds `sessions_revoked`, `recovery_documented`, `evidence_preserved` |
| `it-r5-restore-fast` | Restore access quickly after password reset and handle documentation later. | Control +3, Evidence -4, Continuity +8, Trust +1 | none |
| `it-r5-extra-lockdown` | Keep access restricted until every related account is reviewed. | Control +8, Evidence +5, Continuity -8, Trust -3 | adds `sessions_revoked` |
| `it-r5-technical-only-close` | Close the ticket once technical indicators are removed. | Control +1, Evidence -2, Continuity +5, Trust -3 | none |

### Cross-Role Rules

- `r5-supported-documented-recovery`: if HR chooses `hr-r5-support-confirm-communicate` and IT chooses `it-r5-complete-recovery-records`, add Control +7, Evidence +5, Continuity +3, Trust +8, and `coordinated_response`.
- `r5-fast-but-thin`: if HR chooses `hr-r5-speed-payroll-catchup` and IT chooses `it-r5-restore-fast`, add Continuity +4, Evidence -6, Trust -4. Public result: normal work resumes quickly, but the debrief has gaps.
- `r5-overcontainment`: if HR chooses `hr-r5-formal-lessons` and IT chooses `it-r5-extra-lockdown`, add Control +3, Continuity -6, Trust -2. Public result: recovery is careful, but some disruption continues longer than expected.

Public consequence text: The incident is ending, but the final impression depends on how recovery, documentation, and employee communication are handled.

Private facilitator explanation: Recovery is a people process as well as a technical process. Strong endings combine secure access restoration, clear records, payroll confidence, and non-blaming communication. Preparing a careful update may slow catch-up work slightly, which is the intended trade-off.

Learning objective: Balance containment, continuity, evidence, and trust.

Learning point: A good incident response ends with recovery, documentation, and learning, not just removal of the visible threat.

Debrief questions:

- What should be documented before calling the incident closed?
- How can communication encourage future reporting instead of blame?

## Final Debrief

Discuss:

- Which role had information the other role needed?
- Which choices improved one metric while harming another?
- Where did the group prioritise speed over certainty?
- Where did the group protect evidence before cleanup?
- How would participants map the lessons to their organisation's approved reporting, verification, and incident-response procedures?

The facilitator should avoid naming any fictional workflow as official policy.

## Paper Prototype Walkthrough

Materials:

- One facilitator script.
- One shared update card per round.
- One HR private card per round.
- One IT Helpdesk private card per round.
- Choice cards or a simple numbered vote sheet.
- A visible metrics sheet.
- A decision timeline sheet.

Three-person test:

1. Facilitator shows the scenario title, roles, metrics, and fictional-content notice.
2. Person A receives HR role briefing.
3. Person B receives IT Helpdesk role briefing.
4. Facilitator reads the shared update for round 1.
5. Facilitator privately gives HR and IT their role cards.
6. Participants may talk for 1 to 2 minutes.
7. Each participant votes for one role action.
8. With one participant per role, each vote becomes that department action.
9. Facilitator applies base effects and any interaction rule.
10. Facilitator reveals public consequence and asks one debrief question.
11. Facilitator records the actions, metric changes, and flags.
12. Repeat for the selected quick or standard mode.

Six-person test:

- Split roughly 3 HR and 3 IT Helpdesk.
- Participants vote individually.
- The majority in each role becomes the department decision.
- If a role vote is tied, pause for discussion and have the facilitator choose the final action.

Fifteen-person test:

- Uneven role splits are allowed.
- Use visible vote counts by department, not individual scoring.
- Keep reading short and discussion timed.
- Facilitator should watch for one role dominating the conversation.

## Scenario Quality Review

Review checks performed:

- Avoided joke or cartoonishly negligent answers.
- Gave every round meaningful HR and IT Helpdesk information.
- Kept each choice plausible with a trade-off.
- Avoided claiming any fictional procedure is official policy.
- Used concise participant-facing updates.
- Prevented either role from consistently having the full picture.
- Kept branching limited to base effects, flags, and interaction rules.

Problems identified and addressed:

- Early drafts risked making "escalate and preserve" the only obvious good answer, so stronger actions now carry continuity or timing costs.
- IT could have dominated because compromise evidence is technical, so HR now owns payroll trust, employee support, communication timing, and sensitive-change decisions.
- Broad warnings could feel simply bad, so they now improve control in some cases while creating continuity and trust costs.
- Total lockdown choices could seem universally best, so they carry visible business continuity and trust effects.
- Recovery could have become an afterthought, so round 5 includes employee support, documentation, access restoration, and payroll confidence.
