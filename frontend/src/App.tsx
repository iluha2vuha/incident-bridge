import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
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
  FinalMetric,
  LiveDebriefSnapshot,
  LiveLobbySnapshot,
  LiveMetricDelta,
  LiveRoundSnapshot,
  LiveSessionState,
  LiveVoteProgress,
  MetricDelta,
  ParticipantRecord,
  ParticipantSnapshot,
  RoleArtifact,
  RoleId,
  TieResolutionSnapshot,
  TimelineItem,
  TicketArtifactContent,
  VoteVariant,
} from './domain/model'
import {
  advanceLiveRound,
  closeLiveSession,
  createLiveSession,
  getLiveDebrief,
  getLiveRound,
  joinLiveSession,
  lockLiveRound,
  lobbyWebSocketUrl,
  openLiveRound,
  revealLiveRound,
  reconnectLiveSession,
  selectParticipantRole,
  startLiveSession,
  submitLiveVote,
} from './live/sessionApi'
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
  const liveSession = state.liveSession
  const liveActor = liveSession?.actor
  const liveFacilitatorToken = liveSession?.facilitatorToken
  const liveParticipantToken = liveSession?.participantToken
  const liveSessionId = liveSession?.sessionId
  const updateLiveLobby = state.updateLiveLobby
  const setLiveSession = state.setLiveSession
  const hasVerifiedLiveSession = useRef(false)

  useEffect(() => {
    if (!liveSession || hasVerifiedLiveSession.current) {
      return
    }

    hasVerifiedLiveSession.current = true
    reconnectLiveSession(liveSession)
      .then(setLiveSession)
      .catch(() => setLiveSession(null))
  }, [liveSession, setLiveSession])

  useEffect(() => {
    if (!liveSessionId || !liveActor) {
      return
    }

    const websocket = new WebSocket(
      lobbyWebSocketUrl(liveSessionId, liveActor, liveFacilitatorToken, liveParticipantToken),
    )

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data as string) as {
        type: string
        lobby?: LiveLobbySnapshot
      }

      if (message.type === 'lobby:updated' && message.lobby) {
        updateLiveLobby(message.lobby)
      }
    }

    return () => websocket.close()
  }, [liveActor, liveFacilitatorToken, liveParticipantToken, liveSessionId, updateLiveLobby])

  return (
    <div className="app">
      <TopBar />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/review" replace />} />
          <Route path="/review" element={<ReviewIndex {...state} />} />
          <Route
            path="/participant/join"
            element={
              <ParticipantShell>
                <JoinScreen setLiveSession={state.setLiveSession} />
              </ParticipantShell>
            }
          />
          <Route
            path="/participant/role"
            element={
              <ParticipantShell>
                <RoleSelection
                  role={state.role}
                  setRole={state.setRole}
                  liveSession={state.liveSession}
                  setLiveSession={state.setLiveSession}
                />
              </ParticipantShell>
            }
          />
          <Route
            path="/participant/lobby"
            element={
              <ParticipantShell>
                <ParticipantLobby
                  snapshot={state.participantSnapshot}
                  liveSession={state.liveSession}
                />
              </ParticipantShell>
            }
          />
          <Route
            path="/participant/briefing"
            element={
              <ParticipantShell>
                <RoleBriefing snapshot={state.participantSnapshot} liveSession={state.liveSession} />
              </ParticipantShell>
            }
          />
          <Route
            path="/participant/round"
            element={
              <ParticipantShell>
                <RoundWorkspace
                  {...state}
                  mode="decision"
                  liveSession={state.liveSession}
                  liveRound={state.liveRound}
                  setLiveRound={state.setLiveRound}
                />
              </ParticipantShell>
            }
          />
          <Route
            path="/participant/waiting"
            element={
              <ParticipantShell>
                <RoundWorkspace
                  {...state}
                  mode="waiting"
                  liveSession={state.liveSession}
                  liveRound={state.liveRound}
                  setLiveRound={state.setLiveRound}
                />
              </ParticipantShell>
            }
          />
          <Route
            path="/participant/result"
            element={
              <ParticipantShell>
                <ParticipantResult
                  snapshot={state.participantSnapshot}
                  liveSession={state.liveSession}
                  liveRound={state.liveRound}
                  setLiveRound={state.setLiveRound}
                />
              </ParticipantShell>
            }
          />
          <Route
            path="/participant/debrief"
            element={
              <ParticipantShell>
                <ParticipantDebrief
                  snapshot={state.participantSnapshot}
                  liveSession={state.liveSession}
                  liveDebrief={state.liveDebrief}
                  setLiveDebrief={state.setLiveDebrief}
                />
              </ParticipantShell>
            }
          />
          <Route
            path="/participant/disconnected"
            element={
              <ParticipantShell>
                <ConnectionExample state="disconnected" selectedChoice={state.selectedChoice} />
              </ParticipantShell>
            }
          />
          <Route
            path="/participant/reconnecting"
            element={
              <ParticipantShell>
                <ConnectionExample state="reconnecting" selectedChoice={state.selectedChoice} />
              </ParticipantShell>
            }
          />
          <Route
            path="/facilitator/create"
            element={
              <FacilitatorShell>
                <CreateSession
                  snapshot={state.facilitatorSnapshot}
                  setLiveSession={state.setLiveSession}
                />
              </FacilitatorShell>
            }
          />
          <Route
            path="/facilitator/lobby"
            element={
              <FacilitatorShell>
                <FacilitatorLobby
                  snapshot={state.facilitatorSnapshot}
                  variant={state.lobbyVariant}
                  setVariant={state.setLobbyVariant}
                  liveSession={state.liveSession}
                  setLiveSession={state.setLiveSession}
                />
              </FacilitatorShell>
            }
          />
          <Route
            path="/facilitator/round"
            element={
              <FacilitatorShell>
                <LiveRoundControl
                  snapshot={state.facilitatorSnapshot}
                  variant={state.voteVariant}
                  setVariant={state.setVoteVariant}
                  liveSession={state.liveSession}
                  liveRound={state.liveRound}
                  setLiveRound={state.setLiveRound}
                />
              </FacilitatorShell>
            }
          />
          <Route
            path="/facilitator/lock"
            element={
              <FacilitatorShell>
                <LockRoundConfirmation snapshot={state.facilitatorSnapshot} />
              </FacilitatorShell>
            }
          />
          <Route
            path="/facilitator/tie"
            element={
              <FacilitatorShell>
                <TieResolution snapshot={state.facilitatorSnapshot} />
              </FacilitatorShell>
            }
          />
          <Route
            path="/facilitator/result"
            element={
              <FacilitatorShell>
                <FacilitatorResult snapshot={state.facilitatorSnapshot} />
              </FacilitatorShell>
            }
          />
          <Route
            path="/facilitator/debrief"
            element={
              <FacilitatorShell>
                <FacilitatorDebrief
                  snapshot={state.facilitatorSnapshot}
                  liveSession={state.liveSession}
                  liveDebrief={state.liveDebrief}
                  setLiveDebrief={state.setLiveDebrief}
                />
              </FacilitatorShell>
            }
          />
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
          Review the fake-data participant and facilitator experience without a backend. The role
          switch below is review tooling only and is never presented as a post-lock participant
          control.
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
              {(['choice', 'confirm', 'submitted', 'waiting'] as ChoiceStep[]).map((step) => (
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
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Connection examples</legend>
            <div className="buttonRow">
              <button
                type="button"
                className="secondaryButton"
                onClick={() => setConnection('connected')}
              >
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
        <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}>
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

function JoinScreen({
  setLiveSession,
}: {
  setLiveSession: (session: LiveSessionState | null) => void
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const queryRoomCode = new URLSearchParams(location.search).get('room') ?? mockSession.roomCode
  const [roomCode, setRoomCode] = useState(queryRoomCode)
  const [nickname, setNickname] = useState(mockSession.participantName)
  const [error, setError] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsJoining(true)

    try {
      const session = await joinLiveSession(roomCode, nickname)
      setLiveSession(session)
      navigate('/participant/role')
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Could not join room.')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <form className="screenStack" onSubmit={handleSubmit}>
      <StatusLine state="connected" />
      <div>
        <p className="eyebrow">Fictional training exercise</p>
        <h1>Incident Bridge</h1>
        <p className="muted">A short incident-response exercise. No account needed.</p>
      </div>
      <label className="fieldLabel" htmlFor="room-code">
        Room code
      </label>
      <input
        id="room-code"
        value={roomCode}
        className="codeInput"
        onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
        maxLength={6}
      />
      <label className="fieldLabel" htmlFor="nickname">
        Temporary nickname
      </label>
      <input
        id="nickname"
        value={nickname}
        maxLength={24}
        onChange={(event) => setNickname(event.target.value)}
      />
      {error ? (
        <Notice tone="warning" live>
          {error}
        </Notice>
      ) : null}
      <button type="submit" className="primaryButton" disabled={isJoining}>
        {isJoining ? 'Joining...' : 'Join room'}
      </button>
      <p className="smallNote">
        Your nickname is temporary and visible only during this review session.
      </p>
    </form>
  )
}

function RoleSelection({
  role,
  setRole,
  liveSession,
  setLiveSession,
}: {
  role: RoleId
  setRole: (role: RoleId) => void
  liveSession: LiveSessionState | null
  setLiveSession: (session: LiveSessionState | null) => void
}) {
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const liveParticipant = liveSession?.lobby.participants.find(
    (participant) => participant.id === liveSession.participantId,
  )
  const selectedRoleId = liveSession?.actor === 'participant' ? liveParticipant?.role_id : role
  const roleOptions =
    liveSession?.lobby.roles ??
    Object.values(roles).map((roleContent) => ({
      id: roleContent.role,
      name: roleContent.label,
      briefing: roleContent.briefing,
    }))
  const isLocked = liveSession?.lobby.phase !== undefined && liveSession.lobby.phase !== 'lobby'

  async function handleSelect(roleId: string) {
    setError('')

    if (isRoleId(roleId)) {
      setRole(roleId)
    }

    if (liveSession?.actor !== 'participant') {
      return
    }

    setIsSaving(true)

    try {
      const lobby = await selectParticipantRole(liveSession, roleId)
      setLiveSession({ ...liveSession, lobby })
    } catch (selectError) {
      setError(selectError instanceof Error ? selectError.message : 'Could not select role.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="screenStack">
      <h1>Choose your role</h1>
      {roleOptions.map((roleOption) => (
        <RoleCard
          key={roleOption.id}
          roleId={roleOption.id}
          label={roleOption.name}
          briefing={roleOption.briefing}
          selected={selectedRoleId === roleOption.id}
          disabled={isLocked || isSaving}
          onSelect={handleSelect}
        />
      ))}
      {error ? (
        <Notice tone="warning" live>
          {error}
        </Notice>
      ) : null}
      {isLocked ? <Notice tone="warning">Role selection is locked.</Notice> : null}
      <Link
        className={`primaryButton ${!selectedRoleId || isSaving ? 'disabledLink' : ''}`}
        aria-disabled={!selectedRoleId || isSaving}
        onClick={(event) => {
          if (!selectedRoleId || isSaving) {
            event.preventDefault()
          }
        }}
        to={selectedRoleId && !isSaving ? '/participant/lobby' : '#'}
      >
        Continue
      </Link>
      <p className="smallNote">
        Role selection affects private information and choices. It locks once the facilitator
        starts.
      </p>
    </section>
  )
}

function RoleCard({
  roleId,
  label,
  briefing,
  selected,
  disabled = false,
  onSelect,
}: {
  roleId: string
  label: string
  briefing: string
  selected: boolean
  disabled?: boolean
  onSelect: (role: string) => void
}) {
  return (
    <button
      type="button"
      className={`roleCard ${roleId} ${selected ? 'selected' : ''}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(roleId)}
    >
      <span className="roleTitle">{label}</span>
      <span>{briefing}</span>
    </button>
  )
}

function ParticipantLobby({
  snapshot,
  liveSession,
}: {
  snapshot: ParticipantSnapshot
  liveSession: LiveSessionState | null
}) {
  if (liveSession?.actor === 'participant') {
    const participant = liveSession.lobby.participants.find(
      (participant) => participant.id === liveSession.participantId,
    )
    const selectedRole = roleName(liveSession.lobby, participant?.role_id)

    return (
      <section className="screenStack">
        <StatusLine state="connected" />
        <div>
          <p className="eyebrow">Room</p>
          <h1 className="roomCode">{liveSession.roomCode}</h1>
          <p className="muted">
            {liveSession.participantName}, you are {selectedRole ?? 'waiting to choose a role'}.
          </p>
        </div>
        <LiveLobbyCount lobby={liveSession.lobby} />
        {liveSession.lobby.warning ? (
          <Notice tone="warning" live>
            {liveSession.lobby.warning}
          </Notice>
        ) : (
          <Notice tone="neutral">Waiting for the facilitator.</Notice>
        )}
        <LiveParticipantList lobby={liveSession.lobby} />
        {liveSession.lobby.phase === 'lobby' ? (
          <Link className="secondaryLink" to="/participant/role">
            Change role before start
          </Link>
        ) : null}
        {liveSession.lobby.phase === 'briefing' ? (
          <Link className="primaryButton" to="/participant/briefing">
            View briefing
          </Link>
        ) : null}
        {liveSession.lobby.phase === 'round_open' || liveSession.lobby.phase === 'round_locked' ? (
          <Link className="primaryButton" to="/participant/round">
            Go to round
          </Link>
        ) : null}
        {liveSession.lobby.phase === 'consequence_revealed' ? (
          <Link className="primaryButton" to="/participant/result">
            View result
          </Link>
        ) : null}
      </section>
    )
  }

  return (
    <section className="screenStack">
      <StatusLine state={snapshot.connection} />
      <div>
        <p className="eyebrow">Room</p>
        <h1 className="roomCode">{snapshot.roomCode}</h1>
        <p className="muted">
          {snapshot.participantName}, you are {snapshot.role.label}
        </p>
      </div>
      <CountGrid snapshot={snapshot} />
      <Notice tone="neutral">Waiting for the facilitator to start the exercise.</Notice>
      <Link className="secondaryLink" to="/participant/role">
        Change role before start
      </Link>
    </section>
  )
}

function RoleBriefing({
  snapshot,
  liveSession,
}: {
  snapshot: ParticipantSnapshot
  liveSession: LiveSessionState | null
}) {
  if (liveSession?.actor === 'participant') {
    const participant = liveSession.lobby.participants.find(
      (participant) => participant.id === liveSession.participantId,
    )
    const role = liveSession.lobby.roles.find((role) => role.id === participant?.role_id)

    if (role) {
      return (
        <section className="screenStack">
          <RoleBadgeByLabel roleId={role.id} label={role.name} />
          <h1>{role.name} briefing</h1>
          <div className={`privatePanel ${role.id}`}>
            <p>{role.briefing}</p>
          </div>
          <p className="muted">
            You will receive information the other role does not see. Share relevant observations
            before voting.
          </p>
          <Notice tone="neutral">Waiting for the facilitator to open Round 1.</Notice>
        </section>
      )
    }
  }

  return (
    <section className="screenStack">
      <RoleBadge role={snapshot.role.role} privacy="Role briefing" />
      <h1>{snapshot.role.label} briefing</h1>
      <div className={`privatePanel ${snapshot.role.role}`}>
        <p>{snapshot.role.briefing}</p>
      </div>
      <p className="muted">
        You will receive information the other role does not see. Share relevant observations before
        voting.
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
  liveSession,
  liveRound,
  setLiveRound,
}: {
  role: RoleId
  selectedChoiceId: string
  setSelectedChoiceId: (id: string) => void
  selectedChoice?: Choice
  choiceStep: ChoiceStep
  setChoiceStep: (step: ChoiceStep) => void
  mode: 'decision' | 'waiting'
  participantSnapshot: ParticipantSnapshot
  liveSession: LiveSessionState | null
  liveRound: LiveRoundSnapshot | null
  setLiveRound: (round: LiveRoundSnapshot | null) => void
}) {
  if (liveSession?.actor === 'participant') {
    return (
      <LiveParticipantRound
        liveSession={liveSession}
        liveRound={liveRound}
        setLiveRound={setLiveRound}
      />
    )
  }

  const content = participantSnapshot.role
  const step = mode === 'waiting' ? 'waiting' : choiceStep

  return (
    <section className="roundScreen">
      <div className="roundHeader">
        <span className="mono">
          Round {participantSnapshot.round.number} of {participantSnapshot.round.total}
        </span>
        <StatusLine state="connected" compact />
      </div>
      <RoleBadge role={role} privacy={`Private to ${content.label}`} />
      <IncidentPanel title="Shared incident update">
        {participantSnapshot.round.shared}
      </IncidentPanel>
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

function LiveParticipantRound({
  liveSession,
  liveRound,
  setLiveRound,
}: {
  liveSession: LiveSessionState
  liveRound: LiveRoundSnapshot | null
  setLiveRound: (round: LiveRoundSnapshot | null) => void
}) {
  const navigate = useNavigate()
  const [selectedChoiceId, setSelectedChoiceId] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!['round_open', 'round_locked', 'consequence_revealed'].includes(liveSession.lobby.phase)) {
      return
    }

    setIsLoading(true)
    getLiveRound(liveSession)
      .then((round) => {
        setLiveRound(round)
        setError('')
      })
      .catch((roundError) => {
        setError(roundError instanceof Error ? roundError.message : 'Could not load round.')
      })
      .finally(() => setIsLoading(false))
  }, [liveSession, setLiveRound])

  async function handleSubmitVote() {
    if (!liveRound || !selectedChoiceId) {
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const round = await submitLiveVote(liveSession, liveRound.round_id, selectedChoiceId)
      setLiveRound(round)
    } catch (voteError) {
      setError(voteError instanceof Error ? voteError.message : 'Could not submit vote.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!['round_open', 'round_locked', 'consequence_revealed'].includes(liveSession.lobby.phase)) {
    return (
      <section className="screenStack">
        <StatusLine state="connected" />
        <h1>Waiting for Round 1</h1>
        <Notice tone="neutral">The facilitator has not opened voting yet.</Notice>
      </section>
    )
  }

  if (isLoading && !liveRound) {
    return (
      <section className="screenStack">
        <StatusLine state="connected" />
        <h1>Loading round</h1>
        <Notice tone="neutral">Fetching your role-specific briefing.</Notice>
      </section>
    )
  }

  if (!liveRound?.role) {
    return (
      <section className="screenStack">
        <StatusLine state="connected" />
        <h1>Round unavailable</h1>
        {error ? <Notice tone="warning">{error}</Notice> : null}
      </section>
    )
  }

  if (liveRound.result) {
    return (
      <LiveParticipantRoundResult
        round={liveRound}
        onContinue={() => navigate('/participant/result')}
      />
    )
  }

  return (
    <section className="roundScreen">
      <div className="roundHeader">
        <span className="mono">
          Round {liveRound.round_number} of {liveRound.total_rounds}
        </span>
        <StatusLine state="connected" compact />
      </div>
      <RoleBadgeByLabel roleId={liveRound.role.id} label={liveRound.role.name} />
      <IncidentPanel title="Shared incident update">{liveRound.shared_update}</IncidentPanel>
      <div className={`privatePanel ${liveRound.role.id}`}>
        <p className="panelLabel">Private to {liveRound.role.name}</p>
        <p>{liveRound.role.private_information}</p>
      </div>
      {error ? (
        <Notice tone="warning" live>
          {error}
        </Notice>
      ) : null}
      {liveRound.vote_submitted ? (
        <Notice tone="success" live>
          Vote accepted. Your decision is recorded and cannot be changed.
        </Notice>
      ) : liveRound.phase === 'round_open' ? (
        <form className="choicePanel">
          <fieldset>
            <legend>Choose one action</legend>
            {liveRound.role.choices.map((choice) => (
              <label className={`choiceCard ${liveRound.role?.id}`} key={choice.id}>
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
            disabled={!selectedChoiceId || isSubmitting}
            onClick={handleSubmitVote}
          >
            {isSubmitting ? 'Submitting...' : 'Submit decision'}
          </button>
        </form>
      ) : (
        <Notice tone="neutral">Voting is locked. Waiting for the facilitator to reveal.</Notice>
      )}
    </section>
  )
}

function LiveParticipantRoundResult({
  round,
  onContinue,
}: {
  round: LiveRoundSnapshot
  onContinue?: () => void
}) {
  return (
    <section className="screenStack">
      <p className="eyebrow">Round {round.round_number} result</p>
      <h1>Consequence reveal</h1>
      <LiveDecisionGrid round={round} />
      <IncidentPanel title="Public consequence">{round.result?.public_consequence ?? ''}</IncidentPanel>
      {round.result?.interaction_summaries.map((summary) => (
        <Notice tone="success" key={summary}>
          {summary}
        </Notice>
      ))}
      <LiveMetricGrid metrics={round.result?.metric_deltas ?? []} />
      <p className="learningPoint">Learning point: {round.result?.learning_point}</p>
      {onContinue ? (
        <button type="button" className="secondaryButton" onClick={onContinue}>
          View result
        </button>
      ) : null}
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
          <button
            type="button"
            className="primaryButton"
            onClick={() => setChoiceStep('submitted')}
          >
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

function ParticipantResult({
  snapshot,
  liveSession,
  liveRound,
  setLiveRound,
}: {
  snapshot: ParticipantSnapshot
  liveSession: LiveSessionState | null
  liveRound: LiveRoundSnapshot | null
  setLiveRound: (round: LiveRoundSnapshot | null) => void
}) {
  useEffect(() => {
    if (liveSession?.actor !== 'participant') {
      return
    }

    getLiveRound(liveSession)
      .then(setLiveRound)
      .catch(() => undefined)
  }, [liveSession, setLiveRound])

  if (liveSession?.actor === 'participant' && liveRound?.result) {
    return <LiveParticipantRoundResult round={liveRound} />
  }

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
      <Notice tone="neutral">
        Waiting for the facilitator to continue, {snapshot.role.shortLabel}.
      </Notice>
      <Link className="secondaryLink" to="/participant/debrief">
        Static debrief preview
      </Link>
    </section>
  )
}

function ParticipantDebrief({
  snapshot,
  liveSession,
  liveDebrief,
  setLiveDebrief,
}: {
  snapshot: ParticipantSnapshot
  liveSession: LiveSessionState | null
  liveDebrief: LiveDebriefSnapshot | null
  setLiveDebrief: (debrief: LiveDebriefSnapshot | null) => void
}) {
  useEffect(() => {
    if (liveSession?.actor !== 'participant') {
      return
    }

    getLiveDebrief(liveSession)
      .then(setLiveDebrief)
      .catch(() => undefined)
  }, [liveSession, setLiveDebrief])

  if (liveSession?.actor === 'participant' && liveDebrief) {
    return (
      <section className="screenStack">
        <p className="eyebrow">Final organisational outcome</p>
        <h1>Final debrief</h1>
        <FinalMetricGrid metrics={liveFinalMetrics(liveDebrief)} compact />
        <TimelineList items={liveTimelineItems(liveDebrief).slice(0, 3)} compact />
        <section className="debriefPanel" aria-labelledby="participant-discussion">
          <h2 id="participant-discussion">Discussion prompts</h2>
          <DebriefQuestionList questions={liveDebrief.discussion_questions.slice(0, 3)} />
        </section>
        <Notice tone="neutral">
          Results are organisational learning signals, not individual scores.
        </Notice>
      </section>
    )
  }

  return (
    <section className="screenStack">
      <p className="eyebrow">Final organisational outcome</p>
      <h1>Final debrief</h1>
      <FinalMetricGrid metrics={snapshot.debrief.metrics} compact />
      <TimelineList items={snapshot.debrief.timeline.slice(0, 3)} compact />
      <section className="debriefPanel" aria-labelledby="participant-discussion">
        <h2 id="participant-discussion">Discussion prompts</h2>
        <DebriefQuestionList questions={snapshot.debrief.discussionQuestions.slice(0, 3)} />
      </section>
      <Notice tone="neutral">
        Results are organisational learning signals, not individual scores.
      </Notice>
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

function CreateSession({
  snapshot,
  setLiveSession,
}: {
  snapshot: FacilitatorSnapshot
  setLiveSession: (session: LiveSessionState | null) => void
}) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'quick' | 'standard'>('standard')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  async function handleCreate() {
    setError('')
    setIsCreating(true)

    try {
      const session = await createLiveSession(mode)
      setLiveSession(session)
      navigate('/facilitator/lobby')
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create session.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <section className="facilitatorStack">
      <div>
        <p className="eyebrow">Facilitator</p>
        <h1>Create session</h1>
        <p className="muted">
          Fictional training content only. No real room is created in this static slice.
        </p>
      </div>
      <div className="setupGrid">
        <section className="panel">
          <h2>Mode</h2>
          <SegmentedControl
            value={mode}
            options={[
              ['standard', 'Standard, 5 rounds'],
              ['quick', 'Quick, 1 3 5'],
            ]}
            onChange={(value) => setMode(value as 'quick' | 'standard')}
          />
        </section>
        <section className="panel">
          <h2>Scenario</h2>
          <p>{snapshot.scenarioTitle}</p>
        </section>
      </div>
      {error ? (
        <Notice tone="warning" live>
          {error}
        </Notice>
      ) : null}
      <button
        type="button"
        className="primaryButton desktopAction"
        disabled={isCreating}
        onClick={handleCreate}
      >
        {isCreating ? 'Creating...' : 'Create temporary session'}
      </button>
    </section>
  )
}

function FacilitatorLobby({
  snapshot,
  variant,
  setVariant,
  liveSession,
  setLiveSession,
}: {
  snapshot: FacilitatorSnapshot
  variant: FacilitatorLobbyVariant
  setVariant: (variant: FacilitatorLobbyVariant) => void
  liveSession: LiveSessionState | null
  setLiveSession: (session: LiveSessionState | null) => void
}) {
  const navigate = useNavigate()
  const [closeError, setCloseError] = useState('')
  const [startError, setStartError] = useState('')
  const [isStarting, setIsStarting] = useState(false)

  async function handleCloseLiveSession() {
    if (!liveSession) {
      return
    }

    setCloseError('')

    try {
      const lobby = await closeLiveSession(liveSession)
      setLiveSession({ ...liveSession, lobby })
    } catch (error) {
      setCloseError(error instanceof Error ? error.message : 'Could not close session.')
    }
  }

  async function handleStartLiveSession() {
    if (!liveSession) {
      return
    }

    setStartError('')
    setIsStarting(true)

    try {
      const lobby = await startLiveSession(liveSession)
      setLiveSession({ ...liveSession, lobby })
      navigate('/facilitator/round')
    } catch (error) {
      setStartError(error instanceof Error ? error.message : 'Could not start exercise.')
    } finally {
      setIsStarting(false)
    }
  }

  if (liveSession?.actor === 'facilitator') {
    const canStart = canStartFromLobby(liveSession.lobby)

    return (
      <section className="facilitatorStack">
        <div className="facilitatorLobby">
          <section className="roomPanel" aria-labelledby="live-room-code">
            <p className="eyebrow">Room code</p>
            <h1 id="live-room-code" className="roomCode">
              {liveSession.roomCode}
            </h1>
            <QrPanel svg={liveSession.joinQrSvg} />
            <p className="muted">{liveSession.joinUrl}</p>
          </section>
          <section className="participantsPanel">
            <LiveLobbyCount lobby={liveSession.lobby} />
            {liveSession.lobby.warning ? (
              <Notice tone="warning" live>
                {liveSession.lobby.warning}
              </Notice>
            ) : null}
            {liveSession.lobby.phase === 'closed' ? (
              <Notice tone="warning" live>
                Room is closed.
              </Notice>
            ) : null}
            {closeError ? (
              <Notice tone="warning" live>
                {closeError}
              </Notice>
            ) : null}
            {startError ? (
              <Notice tone="warning" live>
                {startError}
              </Notice>
            ) : null}
            <LiveParticipantList lobby={liveSession.lobby} />
            <div className="buttonRow">
              <button
                type="button"
                className="secondaryButton"
                disabled={liveSession.lobby.phase === 'closed'}
                onClick={handleCloseLiveSession}
              >
                End session
              </button>
              <button
                type="button"
                className="primaryButton"
                disabled={!canStart || isStarting || liveSession.lobby.phase !== 'lobby'}
                onClick={handleStartLiveSession}
              >
                {isStarting ? 'Starting...' : 'Start exercise'}
              </button>
            </div>
          </section>
        </div>
      </section>
    )
  }

  return (
    <section className="facilitatorStack">
      <div className="facilitatorLobby">
        <section className="roomPanel" aria-labelledby="room-code">
          <p className="eyebrow">Room code</p>
          <h1 id="room-code" className="roomCode">
            {snapshot.roomCode}
          </h1>
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
          {snapshot.lobby.warning ? (
            <Notice tone="warning" live>
              {snapshot.lobby.warning}
            </Notice>
          ) : null}
          <ParticipantList participants={snapshot.participants} />
          <div className="buttonRow">
            <button type="button" className="secondaryButton">
              End session
            </button>
            <Link className="primaryButton" to="/facilitator/round">
              Start exercise
            </Link>
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
  liveSession,
  liveRound,
  setLiveRound,
}: {
  snapshot: FacilitatorSnapshot
  variant: VoteVariant
  setVariant: (variant: VoteVariant) => void
  liveSession: LiveSessionState | null
  liveRound: LiveRoundSnapshot | null
  setLiveRound: (round: LiveRoundSnapshot | null) => void
}) {
  const [error, setError] = useState('')
  const [isWorking, setIsWorking] = useState(false)

  useEffect(() => {
    if (
      liveSession?.actor !== 'facilitator' ||
      !['round_open', 'round_locked', 'consequence_revealed'].includes(liveSession.lobby.phase)
    ) {
      return
    }

    getLiveRound(liveSession)
      .then(setLiveRound)
      .catch(() => undefined)
  }, [liveSession, setLiveRound])

  async function runRoundAction(action: (session: LiveSessionState) => Promise<LiveRoundSnapshot>) {
    if (!liveSession) {
      return
    }

    setError('')
    setIsWorking(true)

    try {
      const round = await action(liveSession)
      setLiveRound(round)
    } catch (roundError) {
      setError(roundError instanceof Error ? roundError.message : 'Could not update round.')
    } finally {
      setIsWorking(false)
    }
  }

  if (liveSession?.actor === 'facilitator') {
    const livePhase = liveRound?.phase ?? liveSession.lobby.phase

    if (livePhase === 'briefing') {
      return (
        <section className="facilitatorStack">
          <div className="roundControlHeader">
            <div>
              <p className="eyebrow">Briefing</p>
              <h1>Ready to open Round 1</h1>
              <p className="muted">
                Role selection is locked. Open voting when participants are ready.
              </p>
            </div>
            <button
              type="button"
              className="primaryButton desktopAction"
              disabled={isWorking}
              onClick={() => runRoundAction(openLiveRound)}
            >
              {isWorking ? 'Opening...' : 'Open round'}
            </button>
          </div>
          {error ? <Notice tone="warning">{error}</Notice> : null}
        </section>
      )
    }

    if (liveRound) {
      return (
        <section className="facilitatorStack">
          <div className="roundControlHeader">
            <div>
              <p className="eyebrow">{livePhase === 'round_open' ? 'Voting open' : 'Round locked'}</p>
              <h1>
                Round {liveRound.round_number} of {liveRound.total_rounds}: {liveRound.title}
              </h1>
              <p className="muted">{liveRound.shared_update}</p>
            </div>
            {livePhase === 'round_open' ? (
              <button
                type="button"
                className="primaryButton desktopAction"
                disabled={isWorking}
                onClick={() => runRoundAction(lockLiveRound)}
              >
                {isWorking ? 'Locking...' : 'Lock voting'}
              </button>
            ) : null}
            {livePhase === 'round_locked' ? (
              <button
                type="button"
                className="primaryButton desktopAction"
                disabled={isWorking}
                onClick={() => runRoundAction(revealLiveRound)}
              >
                {isWorking ? 'Revealing...' : 'Reveal result'}
              </button>
            ) : null}
            {livePhase === 'consequence_revealed' && liveRound.has_next_round ? (
              <button
                type="button"
                className="primaryButton desktopAction"
                disabled={isWorking}
                onClick={() => runRoundAction(advanceLiveRound)}
              >
                {isWorking ? 'Advancing...' : 'Next round'}
              </button>
            ) : null}
          </div>
          {error ? (
            <Notice tone="warning" live>
              {error}
            </Notice>
          ) : null}
          <div className="controlGrid">
            <section className="panel">
              <h2>Vote completion</h2>
              <LiveVoteProgressCards progress={liveRound.vote_progress} />
              {liveRound.result ? (
                <>
                  <LiveDecisionGrid round={liveRound} />
                  <IncidentPanel title="Public consequence">
                    {liveRound.result.public_consequence}
                  </IncidentPanel>
                  <LiveMetricGrid metrics={liveRound.result.metric_deltas} />
                </>
              ) : null}
            </section>
            <section className="panel">
              <h2>Private facilitator note</h2>
              <p>{liveRound.facilitator_note}</p>
            </section>
          </div>
        </section>
      )
    }

    return (
      <section className="facilitatorStack">
        <h1>Round unavailable</h1>
        {error ? <Notice tone="warning">{error}</Notice> : null}
      </section>
    )
  }

  return (
    <section className="facilitatorStack">
      <div className="roundControlHeader">
        <div>
          <p className="eyebrow">Voting open</p>
          <h1>
            Round {snapshot.round.number} of {snapshot.round.total}: {snapshot.round.title}
          </h1>
          <p className="muted">{snapshot.round.shared}</p>
        </div>
        <Link className="primaryButton desktopAction" to="/facilitator/lock">
          Lock voting
        </Link>
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
          {snapshot.vote.warning ? (
            <Notice tone="warning" live>
              {snapshot.vote.warning}
            </Notice>
          ) : null}
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

function LockRoundConfirmation({ snapshot }: { snapshot: FacilitatorSnapshot }) {
  return (
    <section className="facilitatorStack confirmDesktop">
      <h1>Lock voting for this round?</h1>
      <p className="muted">HR: 2/3 votes. IT Helpdesk: 1/3 votes.</p>
      <Notice tone="warning">Late votes will be rejected after locking.</Notice>
      <section className="panel">
        <h2>Possible facilitator action</h2>
        <p>
          {roles[snapshot.tie.role].label} may need a tie-break if the final missing vote lands
          evenly.
        </p>
      </section>
      <div className="buttonRow twoColumn">
        <Link className="secondaryButton" to="/facilitator/round">
          Cancel
        </Link>
        <Link className="secondaryButton" to="/facilitator/tie">
          Resolve tie
        </Link>
        <Link className="primaryButton" to="/facilitator/result">
          Confirm lock
        </Link>
      </div>
    </section>
  )
}

function TieResolution({ snapshot }: { snapshot: FacilitatorSnapshot }) {
  return (
    <section className="facilitatorStack">
      <div className="roundControlHeader">
        <div>
          <p className="eyebrow">Tie requires resolution</p>
          <h1>{roles[snapshot.tie.role].label} department decision</h1>
          <p className="muted">
            Ask the tied department to discuss briefly, then choose the final department action.
          </p>
        </div>
        <Link className="primaryButton desktopAction" to="/facilitator/result">
          Confirm resolution
        </Link>
      </div>
      <div className="tieGrid">
        <TieChoiceList tie={snapshot.tie} />
        <section className="panel">
          <h2>Facilitator note</h2>
          <p>{snapshot.privateRoundNote}</p>
        </section>
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
        <Link className="primaryButton desktopAction" to="/facilitator/debrief">
          Reveal to participants
        </Link>
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

function FacilitatorDebrief({
  snapshot,
  liveSession,
  liveDebrief,
  setLiveDebrief,
}: {
  snapshot: FacilitatorSnapshot
  liveSession: LiveSessionState | null
  liveDebrief: LiveDebriefSnapshot | null
  setLiveDebrief: (debrief: LiveDebriefSnapshot | null) => void
}) {
  useEffect(() => {
    if (liveSession?.actor !== 'facilitator') {
      return
    }

    getLiveDebrief(liveSession)
      .then(setLiveDebrief)
      .catch(() => undefined)
  }, [liveSession, setLiveDebrief])

  if (liveSession?.actor === 'facilitator' && liveDebrief) {
    return (
      <section className="facilitatorStack">
        <div className="roundControlHeader">
          <div>
            <p className="eyebrow">Completed session</p>
            <h1>Final debrief</h1>
            <p className="muted">
              {liveDebrief.scenario_title}, {liveDebrief.mode} mode.
            </p>
          </div>
          <button type="button" className="primaryButton desktopAction">
            End session
          </button>
        </div>
        <FinalMetricGrid metrics={liveFinalMetrics(liveDebrief)} />
        <div className="debriefGrid">
          <section className="panel">
            <h2>Decision timeline</h2>
            <TimelineList items={liveTimelineItems(liveDebrief)} />
          </section>
          <section className="panel">
            <h2>Learning points</h2>
            <LearningPointList points={liveDebrief.learning_points} />
          </section>
          <section className="panel debriefQuestionsPanel">
            <h2>Discussion questions</h2>
            <DebriefQuestionList questions={liveDebrief.discussion_questions} />
          </section>
        </div>
      </section>
    )
  }

  return (
    <section className="facilitatorStack">
      <div className="roundControlHeader">
        <div>
          <p className="eyebrow">Completed session</p>
          <h1>Final debrief</h1>
          <p className="muted">
            Use this static view to lead the discussion from outcomes to generic response habits.
          </p>
        </div>
        <button type="button" className="primaryButton desktopAction">
          End session
        </button>
      </div>
      <FinalMetricGrid metrics={snapshot.debrief.metrics} />
      <div className="debriefGrid">
        <section className="panel">
          <h2>Decision timeline</h2>
          <TimelineList items={snapshot.debrief.timeline} />
        </section>
        <section className="panel">
          <h2>Learning points</h2>
          <LearningPointList points={snapshot.debrief.learningPoints} />
        </section>
        <section className="panel debriefQuestionsPanel">
          <h2>Discussion questions</h2>
          <DebriefQuestionList questions={snapshot.debrief.discussionQuestions} />
        </section>
      </div>
    </section>
  )
}

function FinalMetricGrid({
  metrics,
  compact = false,
}: {
  metrics: FinalMetric[]
  compact?: boolean
}) {
  return (
    <div className={`finalMetricGrid ${compact ? 'compact' : ''}`} aria-label="Final metrics">
      {metrics.map((metric) => (
        <div className={metric.trend} key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          <em>{metric.trend}</em>
        </div>
      ))}
    </div>
  )
}

function TimelineList({ items, compact = false }: { items: TimelineItem[]; compact?: boolean }) {
  return (
    <ol className={`timelineList ${compact ? 'compact' : ''}`}>
      {items.map((item) => (
        <li key={item.round}>
          <span className="mono">R{item.round}</span>
          <div>
            <strong>{item.title}</strong>
            {!compact ? (
              <p>
                HR: {item.hrDecision} IT Helpdesk: {item.itDecision}
              </p>
            ) : null}
            <p>{item.outcome}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function liveFinalMetrics(debrief: LiveDebriefSnapshot): FinalMetric[] {
  return debrief.metrics.map((metric) => ({
    label: metric.name,
    value: metric.value,
    trend: metric.trend,
  }))
}

function liveTimelineItems(debrief: LiveDebriefSnapshot): TimelineItem[] {
  return debrief.timeline.map((entry) => {
    const decisions = Object.fromEntries(
      entry.decisions.map((decision) => [decision.role_id, decision.choice_label]),
    )

    return {
      round: entry.round_number,
      title: entry.title,
      hrDecision: decisions.hr ?? 'No HR decision recorded.',
      itDecision: decisions['it-helpdesk'] ?? 'No IT Helpdesk decision recorded.',
      outcome: entry.learning_point,
    }
  })
}

function LearningPointList({ points }: { points: string[] }) {
  return (
    <ul className="debriefList">
      {points.map((point) => (
        <li key={point}>{point}</li>
      ))}
    </ul>
  )
}

function DebriefQuestionList({ questions }: { questions: string[] }) {
  return (
    <ol className="debriefList">
      {questions.map((question) => (
        <li key={question}>{question}</li>
      ))}
    </ol>
  )
}

function TieChoiceList({ tie }: { tie: TieResolutionSnapshot }) {
  return (
    <section className="panel">
      <h2>Tied choices</h2>
      <div className="tieChoiceList">
        {tie.choices.map((choice, index) => (
          <button
            type="button"
            className={`tieChoice ${tie.role}`}
            aria-pressed={index === 0}
            key={choice.id}
          >
            <span className="voteCount">{choice.votes} votes</span>
            <span>{choice.label}</span>
          </button>
        ))}
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
        <div className="avatar" aria-hidden="true">
          {email.senderInitials}
        </div>
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
          <div key={field.label}>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
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

function StatusLine({ state, compact = false }: { state: ConnectionState; compact?: boolean }) {
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

function RoleBadgeByLabel({ roleId, label }: { roleId: string; label: string }) {
  return <span className={`roleBadge ${roleId}`}>{label} - Private briefing</span>
}

function LiveDecisionGrid({ round }: { round: LiveRoundSnapshot }) {
  return (
    <div className="decisionGrid">
      {round.result?.decisions.map((decision) => (
        <div className={`decisionSummary ${decision.role_id}`} key={decision.role_id}>
          <strong>{decision.role_name} chose</strong>
          <p>{decision.choice_label}</p>
        </div>
      ))}
    </div>
  )
}

function LiveVoteProgressCards({ progress }: { progress: LiveVoteProgress[] }) {
  return (
    <div className="voteCards">
      {progress.map((role) => (
        <div className={`voteCard ${role.role_id}`} key={role.role_id}>
          <span>{role.role_name}</span>
          <strong>
            {role.submitted}/{role.expected}
          </strong>
        </div>
      ))}
    </div>
  )
}

function LiveMetricGrid({ metrics }: { metrics: LiveMetricDelta[] }) {
  return (
    <div className="metricGrid" aria-label="Metric changes">
      {metrics.map((metric) => (
        <div key={metric.id}>
          <span>{metric.name}</span>
          <strong>{formatSigned(metric.delta)}</strong>
        </div>
      ))}
    </div>
  )
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : String(value)
}

function CountGrid({ snapshot }: { snapshot: ParticipantSnapshot }) {
  return (
    <div className="countGrid" aria-label="Participant counts">
      <div>
        <strong>
          {snapshot.lobby.total}/{snapshot.maxParticipants}
        </strong>
        <span>participants</span>
      </div>
      <div className="hr">
        <strong>{snapshot.lobby.hr}</strong>
        <span>HR</span>
      </div>
      <div className="it-helpdesk">
        <strong>{snapshot.lobby.it}</strong>
        <span>IT Helpdesk</span>
      </div>
    </div>
  )
}

function RoleCountCards({ snapshot }: { snapshot: FacilitatorSnapshot }) {
  return (
    <div className="roleCountCards" aria-label="Role counts">
      <div>
        <strong>
          {snapshot.lobby.total}/{snapshot.maxParticipants}
        </strong>
        <span>Participants</span>
      </div>
      <div className="hr">
        <strong>{snapshot.lobby.hr}</strong>
        <span>HR</span>
      </div>
      <div className="it-helpdesk">
        <strong>{snapshot.lobby.it}</strong>
        <span>IT Helpdesk</span>
      </div>
    </div>
  )
}

function LiveLobbyCount({ lobby }: { lobby: LiveLobbySnapshot }) {
  return (
    <div className="liveLobbyCount" aria-label="Live lobby count">
      <div>
        <strong>
          {lobby.participant_count}/{lobby.max_participants}
        </strong>
        <span>participants</span>
      </div>
      {lobby.roles.map((role) => (
        <div key={role.id} className={role.id}>
          <strong>{lobby.role_counts[role.id] ?? 0}</strong>
          <span>{role.name}</span>
        </div>
      ))}
      <div>
        <strong>{lobby.phase}</strong>
        <span>status</span>
      </div>
    </div>
  )
}

function QrPanel({ svg }: { svg?: string }) {
  if (!svg) {
    return <div className="qrPlaceholder" aria-label="QR code placeholder" />
  }

  return (
    <div
      className="qrCode"
      aria-label="Join QR code"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

function roleName(lobby: LiveLobbySnapshot, roleId: string | null | undefined): string | null {
  if (!roleId) {
    return null
  }

  return lobby.roles.find((role) => role.id === roleId)?.name ?? roleId
}

function canStartFromLobby(lobby: LiveLobbySnapshot): boolean {
  const assignedCount = Object.values(lobby.role_counts).reduce((total, count) => total + count, 0)
  const everyRoleHasParticipants = lobby.roles.every((role) => (lobby.role_counts[role.id] ?? 0) > 0)

  return lobby.participant_count >= 2 && assignedCount === lobby.participant_count && everyRoleHasParticipants
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

function LiveParticipantList({ lobby }: { lobby: LiveLobbySnapshot }) {
  if (lobby.participants.length === 0) {
    return (
      <div className="emptyLobby" aria-live="polite">
        No participants have joined yet.
      </div>
    )
  }

  return (
    <ul className="participantList" aria-label="Live lobby participants">
      {lobby.participants.map((participant) => (
        <li key={participant.id}>
          <span>{participant.nickname}</span>
          <span>{roleName(lobby, participant.role_id) ?? 'No role yet'}</span>
          <span>{participant.status}</span>
        </li>
      ))}
    </ul>
  )
}

function isRoleId(roleId: string): roleId is RoleId {
  return roleId === 'hr' || roleId === 'it-helpdesk'
}

function VoteMiniGrid() {
  return (
    <div className="voteMiniGrid">
      <div>
        <strong>2/3</strong>
        <span>HR votes</span>
      </div>
      <div>
        <strong>1/3</strong>
        <span>IT votes</span>
      </div>
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
