import { useMemo, useState, type ReactNode } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import './App.css'

type RoleId = 'hr' | 'it-helpdesk'
type ConnectionState = 'connected' | 'disconnected' | 'reconnecting'
type ChoiceStep = 'choice' | 'confirm' | 'submitted' | 'waiting'
type FacilitatorLobbyVariant = 'ready' | 'emptyRole' | 'imbalance'
type VoteVariant = 'open' | 'arriving' | 'complete' | 'missing'

type Choice = {
  id: string
  label: string
}

type RoleContent = {
  role: RoleId
  label: string
  shortLabel: string
  briefing: string
  privateInfo: string
  choices: Choice[]
}

const roles: Record<RoleId, RoleContent> = {
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

const round = {
  number: 1,
  total: 5,
  title: 'The Suspicious Payroll Request',
  shared:
    "An employee reports an urgent message asking them to confirm payroll information before today's pay run.",
  consequence:
    "The report is now being treated as suspicious. The quality of the next step depends on whether HR and Helpdesk combine the employee's concern with the account activity.",
  learning: 'A business request and a technical event can be parts of one incident.',
}

const fakeParticipants = [
  { name: 'Jordan P.', role: 'HR', status: 'connected' },
  { name: 'Morgan T.', role: 'HR', status: 'connected' },
  { name: 'Priya S.', role: 'HR', status: 'connected' },
  { name: 'Sam R.', role: 'IT Helpdesk', status: 'connected' },
  { name: 'Alex K.', role: 'IT Helpdesk', status: 'connected' },
  { name: 'Chen W.', role: 'IT Helpdesk', status: 'connected' },
]

const navGroups = [
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

function App() {
  return (
    <BrowserRouter>
      <PrototypeApp />
    </BrowserRouter>
  )
}

function PrototypeApp() {
  const [role, setRole] = useState<RoleId>('hr')
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>('')
  const [choiceStep, setChoiceStep] = useState<ChoiceStep>('choice')
  const [connection, setConnection] = useState<ConnectionState>('connected')
  const [lobbyVariant, setLobbyVariant] = useState<FacilitatorLobbyVariant>('ready')
  const [voteVariant, setVoteVariant] = useState<VoteVariant>('open')

  const roleContent = roles[role]
  const selectedChoice = roleContent.choices.find(
    (choice) => choice.id === selectedChoiceId,
  )

  const state = {
    role,
    setRole,
    selectedChoiceId,
    setSelectedChoiceId,
    selectedChoice,
    choiceStep,
    setChoiceStep,
    connection,
    setConnection,
    lobbyVariant,
    setLobbyVariant,
    voteVariant,
    setVoteVariant,
  }

  return (
    <div className="app">
      <TopBar />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/review" replace />} />
          <Route path="/review" element={<ReviewIndex {...state} />} />
          <Route path="/participant/join" element={<ParticipantShell><JoinScreen /></ParticipantShell>} />
          <Route path="/participant/role" element={<ParticipantShell><RoleSelection role={role} setRole={setRole} /></ParticipantShell>} />
          <Route path="/participant/lobby" element={<ParticipantShell><ParticipantLobby role={role} connection={connection} /></ParticipantShell>} />
          <Route path="/participant/briefing" element={<ParticipantShell><RoleBriefing role={role} /></ParticipantShell>} />
          <Route path="/participant/round" element={<ParticipantShell><RoundWorkspace {...state} mode="decision" /></ParticipantShell>} />
          <Route path="/participant/waiting" element={<ParticipantShell><RoundWorkspace {...state} mode="waiting" /></ParticipantShell>} />
          <Route path="/participant/result" element={<ParticipantShell><ParticipantResult role={role} /></ParticipantShell>} />
          <Route path="/participant/disconnected" element={<ParticipantShell><ConnectionExample state="disconnected" selectedChoice={selectedChoice} /></ParticipantShell>} />
          <Route path="/participant/reconnecting" element={<ParticipantShell><ConnectionExample state="reconnecting" selectedChoice={selectedChoice} /></ParticipantShell>} />
          <Route path="/facilitator/create" element={<FacilitatorShell><CreateSession /></FacilitatorShell>} />
          <Route path="/facilitator/lobby" element={<FacilitatorShell><FacilitatorLobby variant={lobbyVariant} setVariant={setLobbyVariant} /></FacilitatorShell>} />
          <Route path="/facilitator/round" element={<FacilitatorShell><LiveRoundControl variant={voteVariant} setVariant={setVoteVariant} /></FacilitatorShell>} />
          <Route path="/facilitator/lock" element={<FacilitatorShell><LockRoundConfirmation /></FacilitatorShell>} />
          <Route path="/facilitator/result" element={<FacilitatorShell><FacilitatorResult /></FacilitatorShell>} />
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
      <Link className="brand" to="/review" aria-label="Incident Bridge review index">
        Incident Bridge
      </Link>
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
        {navGroups.map((group) => (
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
      <input id="room-code" value="AB7K2P" readOnly className="codeInput" />
      <label className="fieldLabel" htmlFor="nickname">Temporary nickname</label>
      <input id="nickname" value="Jordan" readOnly />
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

function ParticipantLobby({
  role,
  connection,
}: {
  role: RoleId
  connection: ConnectionState
}) {
  return (
    <section className="screenStack">
      <StatusLine state={connection} />
      <div>
        <p className="eyebrow">Room</p>
        <h1 className="roomCode">AB7K2P</h1>
        <p className="muted">Jordan, you are {roles[role].label}</p>
      </div>
      <CountGrid />
      <Notice tone="neutral">Waiting for the facilitator to start the exercise.</Notice>
      <Link className="secondaryLink" to="/participant/role">
        Change role before start
      </Link>
    </section>
  )
}

function RoleBriefing({ role }: { role: RoleId }) {
  const content = roles[role]

  return (
    <section className="screenStack">
      <RoleBadge role={role} privacy="Role briefing" />
      <h1>{content.label} briefing</h1>
      <div className={`privatePanel ${role}`}>
        <p>{content.briefing}</p>
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
}: {
  role: RoleId
  selectedChoiceId: string
  setSelectedChoiceId: (id: string) => void
  selectedChoice?: Choice
  choiceStep: ChoiceStep
  setChoiceStep: (step: ChoiceStep) => void
  mode: 'decision' | 'waiting'
}) {
  const content = roles[role]
  const step = mode === 'waiting' ? 'waiting' : choiceStep

  return (
    <section className="roundScreen">
      <div className="roundHeader">
        <span className="mono">Round {round.number} of {round.total}</span>
        <StatusLine state="connected" compact />
      </div>
      <RoleBadge role={role} privacy={`Private to ${content.label}`} />
      <IncidentPanel title="Shared incident update">{round.shared}</IncidentPanel>
      <div className={`privatePanel ${role}`}>
        <p className="panelLabel">Private to {content.label}</p>
        <p>{content.privateInfo}</p>
      </div>
      {role === 'hr' ? <EmailArtifact /> : <TicketArtifact />}
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

function ParticipantResult({ role }: { role: RoleId }) {
  return (
    <section className="screenStack">
      <p className="eyebrow">Round 1 result</p>
      <h1>Consequence reveal</h1>
      <div className="decisionGrid">
        <DecisionSummary role="hr" text={roles.hr.choices[1].label} />
        <DecisionSummary role="it-helpdesk" text={roles['it-helpdesk'].choices[1].label} />
      </div>
      <IncidentPanel title="Public consequence">{round.consequence}</IncidentPanel>
      <MetricGrid />
      <p className="learningPoint">Learning point: {round.learning}</p>
      <Notice tone="neutral">Waiting for the facilitator to continue, {roles[role].shortLabel}.</Notice>
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

function CreateSession() {
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
          <p>The Friday Pay Run</p>
        </section>
      </div>
      <Link className="primaryButton desktopAction" to="/facilitator/lobby">
        Create temporary session
      </Link>
    </section>
  )
}

function FacilitatorLobby({
  variant,
  setVariant,
}: {
  variant: FacilitatorLobbyVariant
  setVariant: (variant: FacilitatorLobbyVariant) => void
}) {
  const counts = useMemo(() => {
    if (variant === 'emptyRole') return { total: 4, hr: 4, it: 0 }
    if (variant === 'imbalance') return { total: 5, hr: 4, it: 1 }
    return { total: 6, hr: 3, it: 3 }
  }, [variant])

  const warning =
    variant === 'emptyRole'
      ? 'IT Helpdesk has no participants.'
      : variant === 'imbalance'
        ? 'Role imbalance: HR 4, IT Helpdesk 1.'
        : ''

  return (
    <section className="facilitatorStack">
      <div className="facilitatorLobby">
        <section className="roomPanel" aria-labelledby="room-code">
          <p className="eyebrow">Room code</p>
          <h1 id="room-code" className="roomCode">AB7K2P</h1>
          <div className="qrPlaceholder" aria-label="QR code placeholder" />
          <p className="muted">incident-bridge.example/join</p>
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
          <RoleCountCards total={counts.total} hr={counts.hr} it={counts.it} />
          {warning ? <Notice tone="warning" live>{warning}</Notice> : null}
          <ParticipantList />
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
  variant,
  setVariant,
}: {
  variant: VoteVariant
  setVariant: (variant: VoteVariant) => void
}) {
  const votes = {
    open: { hr: '0/3', it: '0/3', warning: '' },
    arriving: { hr: '2/3', it: '1/3', warning: 'Missing: Morgan, Sam, Alex.' },
    complete: { hr: '3/3', it: '3/3', warning: '' },
    missing: { hr: '3/3', it: '1/3', warning: 'Two IT Helpdesk participants have not voted.' },
  }[variant]

  return (
    <section className="facilitatorStack">
      <div className="roundControlHeader">
        <div>
          <p className="eyebrow">Voting open</p>
          <h1>Round 1 of 5: {round.title}</h1>
          <p className="muted">{round.shared}</p>
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
            <VoteCard role="hr" value={votes.hr} />
            <VoteCard role="it-helpdesk" value={votes.it} />
          </div>
          {votes.warning ? <Notice tone="warning" live>{votes.warning}</Notice> : null}
          <div className="eventTimeline">
            <p>09:41 - Round opened</p>
            <p>09:42 - HR vote received</p>
            <p>09:43 - IT Helpdesk vote received</p>
          </div>
        </section>
        <section className="panel">
          <h2>Private facilitator note</h2>
          <p>
            Ask HR what the sender name looked like before asking IT what they
            saw on the account. That is the coordination moment.
          </p>
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

function FacilitatorResult() {
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
          <DecisionSummary role="hr" text={roles.hr.choices[1].label} />
          <DecisionSummary role="it-helpdesk" text={roles['it-helpdesk'].choices[1].label} />
        </section>
        <section className="panel">
          <h2>Public consequence</h2>
          <p>{round.consequence}</p>
          <MetricGrid />
          <p className="learningPoint">Learning point: {round.learning}</p>
        </section>
      </div>
    </section>
  )
}

function EmailArtifact() {
  return (
    <article className="artifact emailArtifact" aria-labelledby="email-subject">
      <p className="artifactLabel">Simulated training artifact - email</p>
      <div className="emailToolbar">
        <span>Inbox</span>
        <span aria-hidden="true">Reply / Forward / More</span>
      </div>
      <div className="emailSender">
        <div className="avatar" aria-hidden="true">MC</div>
        <div>
          <strong>Maya Chen - People Operations</strong>
          <p>To: Jordan Patel. Today, 09:07</p>
        </div>
      </div>
      <Notice tone="incident">This message was sent from an address outside the organisation.</Notice>
      <h2 id="email-subject">Action required before today's pay run</h2>
      <p>
        Hi Jordan, we are finalising this cycle's run and your record needs a
        quick confirmation of bank and ID details before 11am today. Reply with
        the attached form completed so payroll is not delayed.
      </p>
    </article>
  )
}

function TicketArtifact() {
  return (
    <article className="artifact ticketArtifact" aria-labelledby="ticket-title">
      <p className="artifactLabel">Simulated training artifact - BridgeDesk ticket</p>
      <div className="ticketHeader">
        <span className="mono">INC-10427</span>
        <span className="statusPill">New</span>
      </div>
      <h2 id="ticket-title">Password reset requested from unrecognised browser</h2>
      <dl>
        <div><dt>Priority</dt><dd>Medium</dd></div>
        <div><dt>Category</dt><dd>Account and authentication</dd></div>
        <div><dt>Reporter</dt><dd>Jordan Patel</dd></div>
        <div><dt>Created</dt><dd>08:54</dd></div>
      </dl>
      <p>
        A password reset was requested this morning from a browser not previously
        seen on this account. No incident has been formally reported. The account
        remains active.
      </p>
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

function CountGrid() {
  return (
    <div className="countGrid" aria-label="Participant counts">
      <div><strong>6/9</strong><span>participants</span></div>
      <div className="hr"><strong>3</strong><span>HR</span></div>
      <div className="it-helpdesk"><strong>3</strong><span>IT Helpdesk</span></div>
    </div>
  )
}

function RoleCountCards({ total, hr, it }: { total: number; hr: number; it: number }) {
  return (
    <div className="roleCountCards" aria-label="Role counts">
      <div><strong>{total}/9</strong><span>Participants</span></div>
      <div className="hr"><strong>{hr}</strong><span>HR</span></div>
      <div className="it-helpdesk"><strong>{it}</strong><span>IT Helpdesk</span></div>
    </div>
  )
}

function ParticipantList() {
  return (
    <ul className="participantList" aria-label="Connected participants">
      {fakeParticipants.map((participant) => (
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

function MetricGrid() {
  return (
    <div className="metricGrid" aria-label="Metric deltas">
      <div><span>Incident Control</span><strong>+8</strong></div>
      <div><span>Evidence Quality</span><strong>+6</strong></div>
      <div><span>Business Continuity</span><strong>-3</strong></div>
      <div><span>Employee Trust</span><strong>+4</strong></div>
    </div>
  )
}

export default App
