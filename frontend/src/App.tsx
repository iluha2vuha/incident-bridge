import { type ReactNode } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import type {
  Choice,
  ChoiceStep,
  ConnectionState,
  EmailArtifactContent,
  FacilitatorLobbyVariant,
  FacilitatorSnapshot,
  MetricDelta,
  ParticipantRecord,
  ParticipantSnapshot,
  RoleArtifact,
  RoleId,
  TicketArtifactContent,
  VoteVariant,
} from './domain/model'
import { reviewNavGroups, roles } from './mocks/scenario'
import { mockSession } from './mocks/session'
import { usePrototypeState } from './prototype/usePrototypeState'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <PrototypeApp />
    </BrowserRouter>
  )
}

function PrototypeApp() {
  const state = usePrototypeState()

  return (
    <div className="app">
      <TopBar />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/review" replace />} />
          <Route path="/review" element={<ReviewIndex {...state} />} />
          <Route path="/participant/join" element={<ParticipantShell><JoinScreen /></ParticipantShell>} />
          <Route path="/participant/role" element={<ParticipantShell><RoleSelection role={state.role} setRole={state.setRole} /></ParticipantShell>} />
          <Route path="/participant/lobby" element={<ParticipantShell><ParticipantLobby snapshot={state.participantSnapshot} /></ParticipantShell>} />
          <Route path="/participant/briefing" element={<ParticipantShell><RoleBriefing snapshot={state.participantSnapshot} /></ParticipantShell>} />
          <Route path="/participant/round" element={<ParticipantShell><RoundWorkspace {...state} mode="decision" /></ParticipantShell>} />
          <Route path="/participant/waiting" element={<ParticipantShell><RoundWorkspace {...state} mode="waiting" /></ParticipantShell>} />
          <Route path="/participant/result" element={<ParticipantShell><ParticipantResult snapshot={state.participantSnapshot} /></ParticipantShell>} />
          <Route path="/participant/disconnected" element={<ParticipantShell><ConnectionExample state="disconnected" selectedChoice={state.selectedChoice} /></ParticipantShell>} />
          <Route path="/participant/reconnecting" element={<ParticipantShell><ConnectionExample state="reconnecting" selectedChoice={state.selectedChoice} /></ParticipantShell>} />
          <Route path="/facilitator/create" element={<FacilitatorShell><CreateSession snapshot={state.facilitatorSnapshot} /></FacilitatorShell>} />
          <Route path="/facilitator/lobby" element={<FacilitatorShell><FacilitatorLobby snapshot={state.facilitatorSnapshot} variant={state.lobbyVariant} setVariant={state.setLobbyVariant} /></FacilitatorShell>} />
          <Route path="/facilitator/round" element={<FacilitatorShell><LiveRoundControl snapshot={state.facilitatorSnapshot} variant={state.voteVariant} setVariant={state.setVoteVariant} /></FacilitatorShell>} />
          <Route path="/facilitator/lock" element={<FacilitatorShell><LockRoundConfirmation /></FacilitatorShell>} />
          <Route path="/facilitator/result" element={<FacilitatorShell><FacilitatorResult snapshot={state.facilitatorSnapshot} /></FacilitatorShell>} />
        </Routes>
      </main>
    </div>
  )
}

function TopBar() {
  const location = useLocation()
  const isReview = location.pathname === '/review' || location.pathname === '/'
  const isParticipant = location.pathname.startsWith('/participant')
  const isFacilitator = location.pathname.startsWith('/facilitator')

  return (
    <header className={`topbar ${isParticipant ? 'participantOnly' : ''}`}>
      {isReview ? (
        <Link className="brand" to="/review" aria-label="Incident Bridge review index">
          Incident Bridge
        </Link>
      ) : (
        <span className="brand">Incident Bridge</span>
      )}
      {isParticipant ? <span className="prototypeLabel">Participant view</span> : null}
      {isFacilitator ? <span className="prototypeLabel">Facilitator view</span> : null}
      {isReview ? <span className="prototypeLabel">Prototype, fake data only</span> : null}
      {isReview ? (
        <nav aria-label="Primary prototype routes">
          <Link aria-current={location.pathname === '/review' ? 'page' : undefined} to="/review">
            Review index
          </Link>
          <Link to="/participant/join">Participant</Link>
          <Link to="/facilitator/create">Facilitator</Link>
        </nav>
      ) : null}
    </header>
  )
}

function ReviewIndex({
  role,
  setRole,
  setChoiceStep,
  setConnection,
  lobbyVariant,
  setLobbyVariant,
  voteVariant,
  setVoteVariant,
}: {
  role: RoleId
  setRole: (role: RoleId) => void
  setChoiceStep: (step: ChoiceStep) => void
  setConnection: (state: ConnectionState) => void
  lobbyVariant: FacilitatorLobbyVariant
  setLobbyVariant: (variant: FacilitatorLobbyVariant) => void
  voteVariant: VoteVariant
  setVoteVariant: (variant: VoteVariant) => void
}) {
  const navigate = useNavigate()

  return (
    <section className="reviewLayout">
      <div className="reviewIntro">
        <p className="eyebrow">Development-only state index</p>
        <h1>One round, two truths</h1>
        <p>
          Review the fake-data participant and facilitator experience without a
          backend. The role switch below is review tooling only and is never
          presented as a post-lock participant control.
        </p>
      </div>

      <div className="reviewGrid">
        {reviewNavGroups.map((group) => (
          <section className="panel" key={group.title} aria-labelledby={`${group.title}-nav`}>
            <h2 id={`${group.title}-nav`}>{group.title}</h2>
            <div className="linkGrid">
              {group.links.map(([href, label]) => (
                <Link className="indexLink" key={href} to={href}>
                  {label}
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section className="panel controlsPanel" aria-labelledby="state-controls">
          <h2 id="state-controls">Fake Review Controls</h2>
          <fieldset>
            <legend>Role variant</legend>
            <SegmentedControl
              value={role}
              options={[
                ['hr', 'HR'],
                ['it-helpdesk', 'IT Helpdesk'],
              ]}
              onChange={(value) => setRole(value as RoleId)}
            />
          </fieldset>
          <fieldset>
            <legend>Participant round state</legend>
            <div className="buttonRow">
              {(['choice', 'confirm', 'submitted', 'waiting'] as ChoiceStep[]).map(
                (step) => (
                  <button
                    key={step}
                    type="button"
                    className="secondaryButton"
                    onClick={() => {
                      setChoiceStep(step)
                      navigate(step === 'waiting' ? '/participant/waiting' : '/participant/round')
                    }}
                  >
                    {step}
                  </button>
                ),
              )}
            </div>
          </fieldset>
          <fieldset>
            <legend>Connection examples</legend>
            <div className="buttonRow">
              <button type="button" className="secondaryButton" onClick={() => setConnection('connected')}>
                Connected
              </button>
              <button
                type="button"
                className="secondaryButton"
                onClick={() => {
                  setConnection('disconnected')
                  navigate('/participant/disconnected')
                }}
              >
                Disconnected
              </button>
              <button
                type="button"
                className="secondaryButton"
                onClick={() => {
                  setConnection('reconnecting')
                  navigate('/participant/reconnecting')
                }}
              >
                Reconnecting
              </button>
            </div>
          </fieldset>
          <fieldset>
            <legend>Facilitator lobby</legend>
            <SegmentedControl
              value={lobbyVariant}
              options={[
                ['ready', 'Ready'],
                ['emptyRole', 'Empty role'],
                ['imbalance', 'Imbalance'],
              ]}
              onChange={(value) => {
                setLobbyVariant(value as FacilitatorLobbyVariant)
                navigate('/facilitator/lobby')
              }}
            />
          </fieldset>
          <fieldset>
            <legend>Vote completion</legend>
            <SegmentedControl
              value={voteVariant}
              options={[
                ['open', 'Open'],
                ['arriving', 'Arriving'],
                ['complete', 'Complete'],
                ['missing', 'Missing'],
              ]}
              onChange={(value) => {
                setVoteVariant(value as VoteVariant)
                navigate('/facilitator/round')
              }}
            />
          </fieldset>
        </section>
      </div>
    </section>
  )
}

function SegmentedControl({
  value,
  options,
  onChange,
}: {
  value: string
  options: [string, string][]
  onChange: (value: string) => void
}) {
  return (
    <div className="segmented" role="group">
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function ParticipantShell({ children }: { children: ReactNode }) {
  return (
    <section className="participantStage" aria-label="Participant prototype">
      <div className="phoneFrame">{children}</div>
    </section>
  )
}

function FacilitatorShell({ children }: { children: ReactNode }) {
  return (
    <section className="facilitatorStage" aria-label="Facilitator prototype">
      <div className="desktopFrame">{children}</div>
    </section>
  )
}

function JoinScreen() {
  return (
    <section className="screenStack">
      <StatusLine state="connected" />
      <div>
        <p className="eyebrow">Fictional training exercise</p>
        <h1>Incident Bridge</h1>
        <p className="muted">A short incident-response exercise. No account needed.</p>
      </div>
      <label className="fieldLabel" htmlFor="room-code">Room code</label>
      <input id="room-code" value={mockSession.roomCode} readOnly className="codeInput" />
      <label className="fieldLabel" htmlFor="nickname">Temporary nickname</label>
      <input id="nickname" value={mockSession.participantName} readOnly />
      <Link className="primaryButton" to="/participant/role">
        Join room
      </Link>
      <p className="smallNote">
        Your nickname is temporary and visible only during this review session.
      </p>
    </section>
  )
}

function RoleSelection({
  role,
  setRole,
}: {
  role: RoleId
  setRole: (role: RoleId) => void
}) {
  return (
    <section className="screenStack">
      <h1>Choose your role</h1>
      <RoleCard role="hr" selected={role === 'hr'} onSelect={setRole} />
      <RoleCard role="it-helpdesk" selected={role === 'it-helpdesk'} onSelect={setRole} />
      <Link className="primaryButton" to="/participant/lobby">
        Continue
      </Link>
      <p className="smallNote">
        Role selection affects private information and choices. It locks once the
        facilitator starts.
      </p>
    </section>
  )
}

function RoleCard({
  role,
  selected,
  onSelect,
}: {
  role: RoleId
  selected: boolean
  onSelect: (role: RoleId) => void
}) {
  const content = roles[role]

  return (
    <button
      type="button"
      className={`roleCard ${content.role} ${selected ? 'selected' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(role)}
    >
      <span className="roleTitle">{content.label}</span>
      <span>{content.briefing}</span>
    </button>
  )
}

function ParticipantLobby({ snapshot }: { snapshot: ParticipantSnapshot }) {
  return (
    <section className="screenStack">
      <StatusLine state={snapshot.connection} />
      <div>
        <p className="eyebrow">Room</p>
        <h1 className="roomCode">{snapshot.roomCode}</h1>
        <p className="muted">{snapshot.participantName}, you are {snapshot.role.label}</p>
      </div>
      <CountGrid snapshot={snapshot} />
      <Notice tone="neutral">Waiting for the facilitator to start the exercise.</Notice>
      <Link className="secondaryLink" to="/participant/role">
        Change role before start
      </Link>
    </section>
  )
}

function RoleBriefing({ snapshot }: { snapshot: ParticipantSnapshot }) {
  return (
    <section className="screenStack">
      <RoleBadge role={snapshot.role.role} privacy="Role briefing" />
      <h1>{snapshot.role.label} briefing</h1>
      <div className={`privatePanel ${snapshot.role.role}`}>
        <p>{snapshot.role.briefing}</p>
      </div>
      <p className="muted">
        You will receive information the other role does not see. Share relevant
        observations before voting.
      </p>
      <Notice tone="neutral">Waiting for the facilitator to open Round 1.</Notice>
    </section>
  )
}

function RoundWorkspace({
  role,
  selectedChoiceId,
  setSelectedChoiceId,
  selectedChoice,
  choiceStep,
  setChoiceStep,
  mode,
  participantSnapshot,
}: {
  role: RoleId
  selectedChoiceId: string
  setSelectedChoiceId: (id: string) => void
  selectedChoice?: Choice
  choiceStep: ChoiceStep
  setChoiceStep: (step: ChoiceStep) => void
  mode: 'decision' | 'waiting'
  participantSnapshot: ParticipantSnapshot
}) {
  const content = participantSnapshot.role
  const step = mode === 'waiting' ? 'waiting' : choiceStep

  return (
    <section className="roundScreen">
      <div className="roundHeader">
        <span className="mono">Round {participantSnapshot.round.number} of {participantSnapshot.round.total}</span>
        <StatusLine state="connected" compact />
      </div>
      <RoleBadge role={role} privacy={`Private to ${content.label}`} />
      <IncidentPanel title="Shared incident update">{participantSnapshot.round.shared}</IncidentPanel>
      <div className={`privatePanel ${role}`}>
        <p className="panelLabel">Private to {content.label}</p>
        <p>{content.privateInfo}</p>
      </div>
      <RoleArtifactView artifact={participantSnapshot.artifact} />
      <ChoiceState
        role={role}
        choices={content.choices}
        selectedChoiceId={selectedChoiceId}
        selectedChoice={selectedChoice}
        setSelectedChoiceId={setSelectedChoiceId}
        step={step}
        setChoiceStep={setChoiceStep}
      />
    </section>
  )
}

function ChoiceState({
  role,
  choices,
  selectedChoiceId,
  selectedChoice,
  setSelectedChoiceId,
  step,
  setChoiceStep,
}: {
  role: RoleId
  choices: Choice[]
  selectedChoiceId: string
  selectedChoice?: Choice
  setSelectedChoiceId: (id: string) => void
  step: ChoiceStep
  setChoiceStep: (step: ChoiceStep) => void
}) {
  if (step === 'confirm') {
    return (
      <div className="confirmationPanel" role="region" aria-labelledby="confirm-title">
        <h2 id="confirm-title">Confirm your decision</h2>
        <p>{selectedChoice?.label ?? 'No action selected yet.'}</p>
        <p className="smallNote">This cannot be changed once submitted.</p>
        <div className="buttonRow twoColumn">
          <button type="button" className="secondaryButton" onClick={() => setChoiceStep('choice')}>
            Back
          </button>
          <button type="button" className="primaryButton" onClick={() => setChoiceStep('submitted')}>
            Confirm
          </button>
        </div>
      </div>
    )
  }

  if (step === 'submitted') {
    return (
      <Notice tone="success" live>
        Vote accepted. Your decision is recorded and cannot be changed.
      </Notice>
    )
  }

  if (step === 'waiting') {
    return (
      <div className="waitingPanel" aria-live="polite">
        <h2>Waiting for others</h2>
        <VoteMiniGrid />
        <p className="muted">Your choice: {selectedChoice?.label ?? choices[1].label}</p>
      </div>
    )
  }

  return (
    <form className="choicePanel">
      <fieldset>
        <legend>Choose one action</legend>
        {choices.map((choice) => (
          <label className={`choiceCard ${role}`} key={choice.id}>
            <input
              type="radio"
              name="decision"
              checked={selectedChoiceId === choice.id}
              onChange={() => setSelectedChoiceId(choice.id)}
            />
            <span>{choice.label}</span>
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        className="primaryButton"
        disabled={!selectedChoiceId}
        onClick={() => setChoiceStep('confirm')}
      >
        Submit decision
      </button>
    </form>
  )
}

function ParticipantResult({ snapshot }: { snapshot: ParticipantSnapshot }) {
  return (
    <section className="screenStack">
      <p className="eyebrow">Round 1 result</p>
      <h1>Consequence reveal</h1>
      <div className="decisionGrid">
        <DecisionSummary role="hr" text={snapshot.departmentDecisions.hr} />
        <DecisionSummary role="it-helpdesk" text={snapshot.departmentDecisions['it-helpdesk']} />
      </div>
      <IncidentPanel title="Public consequence">{snapshot.round.consequence}</IncidentPanel>
      <MetricGrid metrics={snapshot.metricDeltas} />
      <p className="learningPoint">Learning point: {snapshot.round.learning}</p>
      <Notice tone="neutral">Waiting for the facilitator to continue, {snapshot.role.shortLabel}.</Notice>
    </section>
  )
}

function ConnectionExample({
  state,
  selectedChoice,
}: {
  state: Exclude<ConnectionState, 'connected'>
  selectedChoice?: Choice
}) {
  return (
    <section className="screenStack">
      <StatusLine state={state} />
      <h1>{state === 'disconnected' ? 'Disconnected' : 'Reconnecting'}</h1>
      <p className="muted">
        Keeping your place in the exercise. Last known state:{' '}
        {selectedChoice ? 'decision selected' : 'waiting for Round 1'}.
      </p>
      <button type="button" className="secondaryButton">
        Retry now
      </button>
    </section>
  )
}

function CreateSession({ snapshot }: { snapshot: FacilitatorSnapshot }) {
  return (
    <section className="facilitatorStack">
      <div>
        <p className="eyebrow">Facilitator</p>
        <h1>Create session</h1>
        <p className="muted">Fictional training content only. No real room is created in this static slice.</p>
      </div>
      <div className="setupGrid">
        <section className="panel">
          <h2>Mode</h2>
          <SegmentedControl
            value="standard"
            options={[
              ['standard', 'Standard, 5 rounds'],
              ['quick', 'Quick, 1 3 5'],
            ]}
            onChange={() => undefined}
          />
        </section>
        <section className="panel">
          <h2>Scenario</h2>
          <p>{snapshot.scenarioTitle}</p>
        </section>
      </div>
      <Link className="primaryButton desktopAction" to="/facilitator/lobby">
        Create temporary session
      </Link>
    </section>
  )
}

function FacilitatorLobby({
  snapshot,
  variant,
  setVariant,
}: {
  snapshot: FacilitatorSnapshot
  variant: FacilitatorLobbyVariant
  setVariant: (variant: FacilitatorLobbyVariant) => void
}) {
  return (
    <section className="facilitatorStack">
      <div className="facilitatorLobby">
        <section className="roomPanel" aria-labelledby="room-code">
          <p className="eyebrow">Room code</p>
          <h1 id="room-code" className="roomCode">{snapshot.roomCode}</h1>
          <div className="qrPlaceholder" aria-label="QR code placeholder" />
          <p className="muted">{snapshot.joinUrl}</p>
        </section>
        <section className="participantsPanel">
          <div className="variantRow">
            <SegmentedControl
              value={variant}
              options={[
                ['ready', 'Ready'],
                ['emptyRole', 'Empty role'],
                ['imbalance', 'Imbalance'],
              ]}
              onChange={(value) => setVariant(value as FacilitatorLobbyVariant)}
            />
          </div>
          <RoleCountCards snapshot={snapshot} />
          {snapshot.lobby.warning ? <Notice tone="warning" live>{snapshot.lobby.warning}</Notice> : null}
          <ParticipantList participants={snapshot.participants} />
          <div className="buttonRow">
            <button type="button" className="secondaryButton">End session</button>
            <Link className="primaryButton" to="/facilitator/round">Start exercise</Link>
          </div>
        </section>
      </div>
    </section>
  )
}

function LiveRoundControl({
  snapshot,
  variant,
  setVariant,
}: {
  snapshot: FacilitatorSnapshot
  variant: VoteVariant
  setVariant: (variant: VoteVariant) => void
}) {
  return (
    <section className="facilitatorStack">
      <div className="roundControlHeader">
        <div>
          <p className="eyebrow">Voting open</p>
          <h1>Round {snapshot.round.number} of {snapshot.round.total}: {snapshot.round.title}</h1>
          <p className="muted">{snapshot.round.shared}</p>
        </div>
        <Link className="primaryButton desktopAction" to="/facilitator/lock">Lock voting</Link>
      </div>
      <SegmentedControl
        value={variant}
        options={[
          ['open', 'Open'],
          ['arriving', 'Votes arriving'],
          ['complete', 'Complete'],
          ['missing', 'Missing'],
        ]}
        onChange={(value) => setVariant(value as VoteVariant)}
      />
      <div className="controlGrid">
        <section className="panel">
          <h2>Vote completion</h2>
          <div className="voteCards">
            <VoteCard role="hr" value={snapshot.vote.hr} />
            <VoteCard role="it-helpdesk" value={snapshot.vote.it} />
          </div>
          {snapshot.vote.warning ? <Notice tone="warning" live>{snapshot.vote.warning}</Notice> : null}
          <div className="eventTimeline">
            <p>09:41 - Round opened</p>
            <p>09:42 - HR vote received</p>
            <p>09:43 - IT Helpdesk vote received</p>
          </div>
        </section>
        <section className="panel">
          <h2>Private facilitator note</h2>
          <p>{snapshot.privateRoundNote}</p>
        </section>
      </div>
    </section>
  )
}

function LockRoundConfirmation() {
  return (
    <section className="facilitatorStack confirmDesktop">
      <h1>Lock voting for this round?</h1>
      <p className="muted">HR: 2/3 votes. IT Helpdesk: 1/3 votes.</p>
      <Notice tone="warning">Late votes will be rejected after locking.</Notice>
      <div className="buttonRow twoColumn">
        <Link className="secondaryButton" to="/facilitator/round">Cancel</Link>
        <Link className="primaryButton" to="/facilitator/result">Confirm lock</Link>
      </div>
    </section>
  )
}

function FacilitatorResult({ snapshot }: { snapshot: FacilitatorSnapshot }) {
  return (
    <section className="facilitatorStack">
      <div className="roundControlHeader">
        <div>
          <p className="eyebrow">Ready to reveal</p>
          <h1>Round consequence</h1>
        </div>
        <button type="button" className="primaryButton desktopAction">Reveal to participants</button>
      </div>
      <div className="controlGrid">
        <section className="panel">
          <h2>Department decisions</h2>
          <DecisionSummary role="hr" text={snapshot.departmentDecisions.hr} />
          <DecisionSummary role="it-helpdesk" text={snapshot.departmentDecisions['it-helpdesk']} />
        </section>
        <section className="panel">
          <h2>Public consequence</h2>
          <p>{snapshot.round.consequence}</p>
          <MetricGrid metrics={snapshot.metricDeltas} />
          <p className="learningPoint">Learning point: {snapshot.round.learning}</p>
        </section>
      </div>
    </section>
  )
}

function RoleArtifactView({ artifact }: { artifact: RoleArtifact }) {
  if (artifact.kind === 'email') {
    return <EmailArtifact email={artifact.content} />
  }

  return <TicketArtifact ticket={artifact.content} />
}

function EmailArtifact({ email }: { email: EmailArtifactContent }) {
  return (
    <article className="artifact emailArtifact" aria-labelledby="email-subject">
      <p className="artifactLabel">Simulated training artifact - email</p>
      <div className="emailToolbar">
        <span>Inbox</span>
        <span aria-hidden="true">Reply / Forward / More</span>
      </div>
      <div className="emailSender">
        <div className="avatar" aria-hidden="true">{email.senderInitials}</div>
        <div>
          <strong>{email.senderName}</strong>
          <p>{email.recipientLine}</p>
        </div>
      </div>
      <Notice tone="incident">{email.externalSenderNotice}</Notice>
      <h2 id="email-subject">{email.subject}</h2>
      <p>{email.body}</p>
    </article>
  )
}

function TicketArtifact({ ticket }: { ticket: TicketArtifactContent }) {
  return (
    <article className="artifact ticketArtifact" aria-labelledby="ticket-title">
      <p className="artifactLabel">Simulated training artifact - BridgeDesk ticket</p>
      <div className="ticketHeader">
        <span className="mono">{ticket.id}</span>
        <span className="statusPill">{ticket.status}</span>
      </div>
      <h2 id="ticket-title">{ticket.title}</h2>
      <dl>
        {ticket.fields.map((field) => (
          <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>
        ))}
      </dl>
      <p>{ticket.description}</p>
    </article>
  )
}

function IncidentPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="incidentPanel">
      <p className="panelLabel">{title}</p>
      <p>{children}</p>
    </section>
  )
}

function Notice({
  tone,
  children,
  live = false,
}: {
  tone: 'neutral' | 'warning' | 'success' | 'incident'
  children: ReactNode
  live?: boolean
}) {
  return (
    <div className={`notice ${tone}`} aria-live={live ? 'polite' : undefined}>
      {children}
    </div>
  )
}

function StatusLine({
  state,
  compact = false,
}: {
  state: ConnectionState
  compact?: boolean
}) {
  return (
    <p className={`statusLine ${state} ${compact ? 'compact' : ''}`} aria-live="polite">
      <span aria-hidden="true" />
      {state}
    </p>
  )
}

function RoleBadge({ role, privacy }: { role: RoleId; privacy: string }) {
  const content = roles[role]

  return (
    <span className={`roleBadge ${role}`}>
      {content.label} - {privacy}
    </span>
  )
}

function CountGrid({ snapshot }: { snapshot: ParticipantSnapshot }) {
  return (
    <div className="countGrid" aria-label="Participant counts">
      <div><strong>{snapshot.lobby.total}/{snapshot.maxParticipants}</strong><span>participants</span></div>
      <div className="hr"><strong>{snapshot.lobby.hr}</strong><span>HR</span></div>
      <div className="it-helpdesk"><strong>{snapshot.lobby.it}</strong><span>IT Helpdesk</span></div>
    </div>
  )
}

function RoleCountCards({ snapshot }: { snapshot: FacilitatorSnapshot }) {
  return (
    <div className="roleCountCards" aria-label="Role counts">
      <div><strong>{snapshot.lobby.total}/{snapshot.maxParticipants}</strong><span>Participants</span></div>
      <div className="hr"><strong>{snapshot.lobby.hr}</strong><span>HR</span></div>
      <div className="it-helpdesk"><strong>{snapshot.lobby.it}</strong><span>IT Helpdesk</span></div>
    </div>
  )
}

function ParticipantList({ participants }: { participants: ParticipantRecord[] }) {
  return (
    <ul className="participantList" aria-label="Connected participants">
      {participants.map((participant) => (
        <li key={participant.name}>
          <span>{participant.name}</span>
          <span>{participant.role}</span>
          <span>{participant.status}</span>
        </li>
      ))}
    </ul>
  )
}

function VoteMiniGrid() {
  return (
    <div className="voteMiniGrid">
      <div><strong>2/3</strong><span>HR votes</span></div>
      <div><strong>1/3</strong><span>IT votes</span></div>
    </div>
  )
}

function VoteCard({ role, value }: { role: RoleId; value: string }) {
  return (
    <div className={`voteCard ${role}`}>
      <span>{roles[role].label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function DecisionSummary({ role, text }: { role: RoleId; text: string }) {
  return (
    <div className={`decisionSummary ${role}`}>
      <strong>{roles[role].label} chose</strong>
      <p>{text}</p>
    </div>
  )
}

function MetricGrid({ metrics }: { metrics: MetricDelta[] }) {
  return (
    <div className="metricGrid" aria-label="Metric deltas">
      {metrics.map((metric) => (
        <div key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </div>
      ))}
    </div>
  )
}

export default App
