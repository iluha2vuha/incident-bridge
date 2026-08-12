export type RoleId = 'hr' | 'it-helpdesk'

export type ConnectionState = 'connected' | 'disconnected' | 'reconnecting'

export type ChoiceStep = 'choice' | 'confirm' | 'submitted' | 'waiting'

export type FacilitatorLobbyVariant = 'ready' | 'emptyRole' | 'imbalance'

export type VoteVariant = 'open' | 'arriving' | 'complete' | 'missing'

export type Choice = {
  id: string
  label: string
}

export type RoleContent = {
  role: RoleId
  label: string
  shortLabel: string
  briefing: string
  privateInfo: string
  choices: Choice[]
}

export type RoundContent = {
  number: number
  total: number
  title: string
  shared: string
  consequence: string
  learning: string
}

export type EmailArtifactContent = {
  senderInitials: string
  senderName: string
  recipientLine: string
  externalSenderNotice: string
  subject: string
  body: string
}

export type TicketField = {
  label: string
  value: string
}

export type TicketArtifactContent = {
  id: string
  status: string
  title: string
  fields: TicketField[]
  description: string
}

export type ScenarioArtifacts = {
  hrEmail: EmailArtifactContent
  itTicket: TicketArtifactContent
}

export type ScenarioContent = {
  id: string
  title: string
  modeLabel: string
  round: RoundContent
  roles: Record<RoleId, RoleContent>
  artifacts: ScenarioArtifacts
}

export type ParticipantRecord = {
  name: string
  role: RoleContent['label']
  status: ConnectionState
}

export type RoleCounts = {
  total: number
  hr: number
  it: number
}

export type LobbySnapshot = RoleCounts & {
  warning: string
}

export type VoteSnapshot = {
  hr: string
  it: string
  warning: string
}

export type MetricDelta = {
  label: string
  value: string
}

export type ReviewNavGroup = {
  title: string
  links: [href: string, label: string][]
}
