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

export type RoleArtifact =
  | { kind: 'email'; content: EmailArtifactContent }
  | { kind: 'ticket'; content: TicketArtifactContent }

export type ScenarioContent = {
  id: string
  title: string
  modeLabel: string
  round: RoundContent
  roles: Record<RoleId, RoleContent>
  artifacts: ScenarioArtifacts
  facilitatorNote: string
  finalDebrief: string[]
}

export type ParticipantRecord = {
  name: string
  role: RoleContent['label']
  status: ConnectionState
}

export type ParticipantSnapshot = {
  roomCode: string
  participantName: string
  maxParticipants: number
  connection: ConnectionState
  role: RoleContent
  lobby: LobbySnapshot
  round: RoundContent
  artifact: RoleArtifact
  departmentDecisions: Record<RoleId, string>
  metricDeltas: MetricDelta[]
  debrief: DebriefSnapshot
}

export type FacilitatorSnapshot = {
  roomCode: string
  joinUrl: string
  maxParticipants: number
  participants: ParticipantRecord[]
  lobby: LobbySnapshot
  vote: VoteSnapshot
  round: RoundContent
  departmentDecisions: Record<RoleId, string>
  metricDeltas: MetricDelta[]
  privateRoundNote: string
  scenarioTitle: string
  debrief: DebriefSnapshot
  tie: TieResolutionSnapshot
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

export type FinalMetric = {
  label: string
  value: number
  trend: 'strong' | 'steady' | 'strained'
}

export type TimelineItem = {
  round: number
  title: string
  hrDecision: string
  itDecision: string
  outcome: string
}

export type DebriefSnapshot = {
  metrics: FinalMetric[]
  timeline: TimelineItem[]
  learningPoints: string[]
  discussionQuestions: string[]
}

export type TieChoice = {
  id: string
  label: string
  votes: number
}

export type TieResolutionSnapshot = {
  role: RoleId
  choices: TieChoice[]
}

export type LiveParticipant = {
  id: string
  nickname: string
  role_id: string | null
  status: ConnectionState
}

export type LiveRole = {
  id: string
  name: string
  briefing: string
}

export type LiveSessionPhase =
  | 'lobby'
  | 'briefing'
  | 'round_open'
  | 'round_locked'
  | 'consequence_revealed'
  | 'closed'

export type LiveLobbySnapshot = {
  session_id: string
  room_code: string
  phase: LiveSessionPhase
  scenario_id: string
  mode: 'quick' | 'standard'
  max_participants: number
  participant_count: number
  roles: LiveRole[]
  role_counts: Record<string, number>
  participants: LiveParticipant[]
  warning: string
}

export type LiveSessionState = {
  actor: 'facilitator' | 'participant'
  sessionId: string
  roomCode: string
  facilitatorToken?: string
  participantId?: string
  participantToken?: string
  participantName?: string
  joinUrl?: string
  lobby: LiveLobbySnapshot
}

export type LiveRoundChoice = {
  id: string
  label: string
}

export type LiveRoundRole = {
  id: string
  name: string
  briefing: string
  private_information: string
  choices: LiveRoundChoice[]
}

export type LiveVoteProgress = {
  role_id: string
  role_name: string
  submitted: number
  expected: number
}

export type LiveRoundDecision = {
  role_id: string
  role_name: string
  choice_id: string
  choice_label: string
}

export type LiveMetricDelta = {
  id: string
  name: string
  delta: number
  value: number
}

export type LiveRoundResult = {
  public_consequence: string
  interaction_summaries: string[]
  decisions: LiveRoundDecision[]
  metric_deltas: LiveMetricDelta[]
  learning_point: string
}

export type LiveRoundSnapshot = {
  session_id: string
  phase: LiveSessionPhase
  round_id: string
  round_number: number
  total_rounds: number
  title: string
  shared_update: string
  role: LiveRoundRole | null
  vote_submitted: boolean
  vote_progress: LiveVoteProgress[]
  facilitator_note: string | null
  result: LiveRoundResult | null
}

export type ReviewNavGroup = {
  title: string
  links: [href: string, label: string][]
}
