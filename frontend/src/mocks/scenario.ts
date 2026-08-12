import type {
  MetricDelta,
  ReviewNavGroup,
  RoleContent,
  RoleId,
  ScenarioContent,
} from '../domain/model'

export const roles: Record<RoleId, RoleContent> = {
  hr: {
    role: 'hr',
    label: 'HR',
    shortLabel: 'HR',
    briefing:
      'Protect employee information, keep payroll moving, support employee trust, verify sensitive requests, and escalate appropriately.',
    privateInfo:
      'The sender display name looks like a senior HR employee. The message requests personal and bank information. The employee is worried their salary may be delayed.',
    choices: [
      {
        id: 'hr-r1-reply-for-context',
        label:
          'Ask the employee to reply asking what details are needed, while HR checks payroll records.',
      },
      {
        id: 'hr-r1-secure-contact-escalate',
        label:
          'Contact the employee through a trusted channel, preserve the message, and escalate the concern.',
      },
      {
        id: 'hr-r1-watch-for-pattern',
        label:
          'Hold the request until another report confirms whether this is isolated.',
      },
      {
        id: 'hr-r1-broad-warning',
        label:
          'Send a quick all-staff warning that payroll messages may be suspicious.',
      },
    ],
  },
  'it-helpdesk': {
    role: 'it-helpdesk',
    label: 'IT Helpdesk',
    shortLabel: 'IT',
    briefing:
      'Verify identity, secure accounts, preserve evidence, contain compromise, investigate wider impact, and avoid unnecessary disruption.',
    privateInfo:
      'A password reset was requested for the employee earlier this morning from an unfamiliar browser. No incident has been formally reported. The account remains active.',
    choices: [
      {
        id: 'it-r1-reset-now',
        label: 'Reset the password immediately and ask the employee to sign in again.',
      },
      {
        id: 'it-r1-verify-and-review',
        label:
          'Verify the employee through an approved channel and review recent account activity.',
      },
      {
        id: 'it-r1-wait-confirmation',
        label:
          'Wait for HR or the employee to confirm compromise before intervening.',
      },
      {
        id: 'it-r1-service-ticket-only',
        label:
          'Log it as a routine password-reset ticket and continue normal queue handling.',
      },
    ],
  },
}

export const scenario: ScenarioContent = {
  id: 'friday-pay-run',
  title: 'The Friday Pay Run',
  modeLabel: 'Standard, 5 rounds',
  round: {
    number: 1,
    total: 5,
    title: 'The Suspicious Payroll Request',
    shared:
      "An employee reports an urgent message asking them to confirm payroll information before today's pay run.",
    consequence:
      "The report is now being treated as suspicious. The quality of the next step depends on whether HR and Helpdesk combine the employee's concern with the account activity.",
    learning: 'A business request and a technical event can be parts of one incident.',
  },
  roles,
  artifacts: {
    hrEmail: {
      senderInitials: 'MC',
      senderName: 'Maya Chen - People Operations',
      recipientLine: 'To: Jordan Patel. Today, 09:07',
      externalSenderNotice:
        'This message was sent from an address outside the organisation.',
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
  },
}

export const metricDeltas: MetricDelta[] = [
  { label: 'Incident Control', value: '+8' },
  { label: 'Evidence Quality', value: '+6' },
  { label: 'Business Continuity', value: '-3' },
  { label: 'Employee Trust', value: '+4' },
]

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
