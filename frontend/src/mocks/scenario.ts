import type { ReviewNavGroup, ScenarioArtifacts } from '../domain/model'
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
    body:
      "Hi Jordan, we are finalising this cycle's run and your record needs a quick confirmation of bank and ID details before 11am today. Reply with the attached form completed so payroll is not delayed.",
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

export const metricDeltas = buildMetricDeltas(
  fridayPayRunScenarioDraft,
  mockDepartmentChoiceIds,
)

export const mockDepartmentDecisions = buildDepartmentDecisionLabels(
  scenario,
  mockDepartmentChoiceIds,
)

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
      ['/facilitator/result', 'Reveal'],
    ],
  },
]
