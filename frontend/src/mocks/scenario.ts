import type {
  DebriefSnapshot,
  ReviewNavGroup,
  ScenarioArtifacts,
  TieResolutionSnapshot,
} from '../domain/model'
import {
  buildDepartmentDecisionLabels,
  buildMetricDeltas,
  buildMockScenarioContent,
  fridayPayRunScenarioDraft,
} from './scenarioAdapter'

const artifacts: ScenarioArtifacts = {
  hrEmail: {
    senderInitials: 'MC',
    senderName: 'Maya Chen - People Operations',
    recipientLine: 'To: Jordan Patel. Today, 09:07',
    externalSenderNotice: 'This message was sent from an address outside the organisation.',
    subject: "Action required before today's pay run",
    body: "Hi Jordan, we are finalising this cycle's run and your record needs a quick confirmation of bank and ID details before 11am today. Reply with the attached form completed so payroll is not delayed.",
  },
  itTicket: {
    id: 'INC-10427',
    status: 'New',
    title: 'Password reset requested from unrecognised browser',
    fields: [
      { label: 'Priority', value: 'Medium' },
      { label: 'Category', value: 'Account and authentication' },
      { label: 'Reporter', value: 'Jordan Patel' },
      { label: 'Created', value: '08:54' },
    ],
    description:
      'A password reset was requested this morning from a browser not previously seen on this account. No incident has been formally reported. The account remains active.',
  },
}

export const scenario = buildMockScenarioContent(fridayPayRunScenarioDraft, artifacts)

export const roles = scenario.roles

export const mockDepartmentChoiceIds = {
  hr: 'hr-r1-secure-contact-escalate',
  'it-helpdesk': 'it-r1-verify-and-review',
} as const

export const metricDeltas = buildMetricDeltas(fridayPayRunScenarioDraft, mockDepartmentChoiceIds)

export const mockDepartmentDecisions = buildDepartmentDecisionLabels(
  scenario,
  mockDepartmentChoiceIds,
)

export const mockDebrief: DebriefSnapshot = {
  metrics: [
    { label: 'Incident Control', value: 78, trend: 'strong' },
    { label: 'Evidence Quality', value: 82, trend: 'strong' },
    { label: 'Business Continuity', value: 58, trend: 'strained' },
    { label: 'Employee Trust', value: 74, trend: 'steady' },
  ],
  timeline: fridayPayRunScenarioDraft.rounds.map((round, index) => ({
    round: index + 1,
    title: round.title,
    hrDecision:
      index === 0
        ? mockDepartmentDecisions.hr
        : 'Coordinated HR action using verified facts and targeted communication.',
    itDecision:
      index === 0
        ? mockDepartmentDecisions['it-helpdesk']
        : 'Preserved technical evidence while containing account and mailbox risk.',
    outcome: round.learning_point,
  })),
  learningPoints: fridayPayRunScenarioDraft.rounds.map((round) => round.learning_point),
  discussionQuestions: scenario.finalDebrief,
}

export const mockTieResolution: TieResolutionSnapshot = {
  role: 'hr',
  choices: [
    {
      id: 'hr-r1-secure-contact-escalate',
      label: mockDepartmentDecisions.hr,
      votes: 2,
    },
    {
      id: 'hr-r1-broad-warning',
      label:
        scenario.roles.hr.choices.find((choice) => choice.id === 'hr-r1-broad-warning')?.label ??
        'Send a quick all-staff warning that payroll messages may be suspicious.',
      votes: 2,
    },
  ],
}

export const reviewNavGroups: ReviewNavGroup[] = [
  {
    title: 'Participant',
    links: [
      ['/participant/join', 'Join'],
      ['/participant/role', 'Role'],
      ['/participant/lobby', 'Lobby'],
      ['/participant/briefing', 'Briefing'],
      ['/participant/round', 'Round'],
      ['/participant/waiting', 'Waiting'],
      ['/participant/result', 'Result'],
      ['/participant/debrief', 'Debrief'],
      ['/participant/disconnected', 'Disconnected'],
      ['/participant/reconnecting', 'Reconnecting'],
    ],
  },
  {
    title: 'Facilitator',
    links: [
      ['/facilitator/create', 'Create'],
      ['/facilitator/lobby', 'Lobby'],
      ['/facilitator/round', 'Round control'],
      ['/facilitator/lock', 'Lock'],
      ['/facilitator/tie', 'Tie'],
      ['/facilitator/result', 'Reveal'],
      ['/facilitator/debrief', 'Debrief'],
    ],
  },
]
