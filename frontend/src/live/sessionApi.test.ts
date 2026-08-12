import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LiveDebriefSnapshot, LiveLobbySnapshot, LiveRoundSnapshot } from '../domain/model'
import {
  advanceLiveRound,
  createLiveSession,
  getLiveDebrief,
  getLiveRound,
  joinLiveSession,
  lockLiveRound,
  lobbyWebSocketUrl,
  openLiveRound,
  revealLiveRound,
  selectParticipantRole,
  startLiveSession,
  submitLiveVote,
} from './sessionApi'

const lobby: LiveLobbySnapshot = {
  session_id: 'session-1',
  room_code: 'AB7K2P',
  phase: 'lobby',
  scenario_id: 'friday-pay-run',
  mode: 'standard',
  max_participants: 9,
  participant_count: 0,
  roles: [
    {
      id: 'hr',
      name: 'HR',
      briefing: 'Protect employee information.',
    },
    {
      id: 'it-helpdesk',
      name: 'IT Helpdesk',
      briefing: 'Secure accounts.',
    },
  ],
  role_counts: {
    hr: 0,
    'it-helpdesk': 0,
  },
  participants: [],
  warning: '',
}

const round: LiveRoundSnapshot = {
  session_id: 'session-1',
  phase: 'round_open',
  round_id: 'r1-suspicious-payroll-request',
  round_number: 1,
  total_rounds: 5,
  has_next_round: true,
  title: 'The Suspicious Payroll Request',
  shared_update: 'An employee reports an urgent payroll message.',
  role: {
    id: 'hr',
    name: 'HR',
    briefing: 'Protect employee information.',
    private_information: 'The sender display name looks like HR.',
    choices: [{ id: 'hr-r1-secure-contact-escalate', label: 'Escalate securely.' }],
  },
  vote_submitted: false,
  vote_progress: [{ role_id: 'hr', role_name: 'HR', submitted: 0, expected: 1 }],
  facilitator_note: null,
  result: null,
}

const debrief: LiveDebriefSnapshot = {
  session_id: 'session-1',
  scenario_title: 'The Friday Pay Run',
  mode: 'standard',
  metrics: [{ id: 'incident_control', name: 'Incident Control', value: 72, trend: 'strong' }],
  timeline: [
    {
      round_number: 1,
      round_id: 'r1-suspicious-payroll-request',
      title: 'The Suspicious Payroll Request',
      decisions: [
        {
          role_id: 'hr',
          role_name: 'HR',
          choice_id: 'hr-r1-secure-contact-escalate',
          choice_label: 'Escalate securely.',
        },
      ],
      outcome: 'The report is now being treated as suspicious.',
      learning_point: 'A business request and a technical event can be parts of one incident.',
    },
  ],
  learning_points: ['A business request and a technical event can be parts of one incident.'],
  discussion_questions: ['Which role had information the other role needed?'],
}

describe('live session API helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a facilitator live session from the backend response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        session_id: 'session-1',
        room_code: 'AB7K2P',
        facilitator_token: 'facilitator-secret',
        join_url: 'http://localhost:5173/participant/join?room=AB7K2P',
        lobby,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const session = await createLiveSession('standard')

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/sessions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ scenario_id: 'friday-pay-run', mode: 'standard' }),
      }),
    )
    expect(session.actor).toBe('facilitator')
    expect(session.facilitatorToken).toBe('facilitator-secret')
    expect(session.lobby.room_code).toBe('AB7K2P')
  })

  it('joins a participant live session from the backend response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          session_id: 'session-1',
          participant_id: 'participant-1',
          participant_token: 'participant-secret',
          lobby: {
            ...lobby,
            participant_count: 1,
            participants: [
              {
                id: 'participant-1',
                nickname: 'Jordan',
                role_id: null,
                status: 'disconnected',
              },
            ],
          },
        }),
      ),
    )

    const session = await joinLiveSession('AB7K2P', 'Jordan')

    expect(session.actor).toBe('participant')
    expect(session.participantToken).toBe('participant-secret')
    expect(session.lobby.participant_count).toBe(1)
  })

  it('builds an authenticated lobby websocket URL', () => {
    expect(lobbyWebSocketUrl('session-1', 'facilitator', 'facilitator-secret')).toBe(
      'ws://127.0.0.1:8000/ws/sessions/session-1/lobby?facilitator_token=facilitator-secret',
    )
  })

  it('selects a participant role', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ...lobby, role_counts: { hr: 1 } }))
    vi.stubGlobal('fetch', fetchMock)

    await selectParticipantRole(
      {
        actor: 'participant',
        sessionId: 'session-1',
        roomCode: 'AB7K2P',
        participantToken: 'participant-secret',
        lobby,
      },
      'hr',
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/sessions/session-1/role',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ participant_token: 'participant-secret', role_id: 'hr' }),
      }),
    )
  })

  it('starts a live session as facilitator', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ...lobby, phase: 'briefing' }))
    vi.stubGlobal('fetch', fetchMock)

    await startLiveSession({
      actor: 'facilitator',
      sessionId: 'session-1',
      roomCode: 'AB7K2P',
      facilitatorToken: 'facilitator-secret',
      lobby,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/sessions/session-1/start',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ facilitator_token: 'facilitator-secret' }),
      }),
    )
  })

  it('opens the first live round', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(round))
    vi.stubGlobal('fetch', fetchMock)

    await openLiveRound({
      actor: 'facilitator',
      sessionId: 'session-1',
      roomCode: 'AB7K2P',
      facilitatorToken: 'facilitator-secret',
      lobby,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/sessions/session-1/round/open',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ facilitator_token: 'facilitator-secret' }),
      }),
    )
  })

  it('fetches a participant round snapshot', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(round))
    vi.stubGlobal('fetch', fetchMock)

    await getLiveRound({
      actor: 'participant',
      sessionId: 'session-1',
      roomCode: 'AB7K2P',
      participantToken: 'participant-secret',
      lobby,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/sessions/session-1/round?participant_token=participant-secret',
    )
  })

  it('submits a participant vote', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ...round, vote_submitted: true }))
    vi.stubGlobal('fetch', fetchMock)

    await submitLiveVote(
      {
        actor: 'participant',
        sessionId: 'session-1',
        roomCode: 'AB7K2P',
        participantToken: 'participant-secret',
        lobby,
      },
      'r1-suspicious-payroll-request',
      'hr-r1-secure-contact-escalate',
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/sessions/session-1/vote',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          participant_token: 'participant-secret',
          round_id: 'r1-suspicious-payroll-request',
          choice_id: 'hr-r1-secure-contact-escalate',
        }),
      }),
    )
  })

  it('locks, reveals, and advances a live round', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ...round, phase: 'round_locked' }))
      .mockResolvedValueOnce(jsonResponse({ ...round, phase: 'consequence_revealed' }))
      .mockResolvedValueOnce(
        jsonResponse({
          ...round,
          phase: 'briefing',
          round_id: 'r2-repeated-authentication-prompts',
          round_number: 2,
        }),
      )
    vi.stubGlobal('fetch', fetchMock)
    const session = {
      actor: 'facilitator' as const,
      sessionId: 'session-1',
      roomCode: 'AB7K2P',
      facilitatorToken: 'facilitator-secret',
      lobby,
    }

    await lockLiveRound(session)
    await revealLiveRound(session)
    await advanceLiveRound(session)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:8000/api/sessions/session-1/round/lock',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://127.0.0.1:8000/api/sessions/session-1/round/reveal',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://127.0.0.1:8000/api/sessions/session-1/round/advance',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('fetches a facilitator debrief snapshot', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(debrief))
    vi.stubGlobal('fetch', fetchMock)

    await getLiveDebrief({
      actor: 'facilitator',
      sessionId: 'session-1',
      roomCode: 'AB7K2P',
      facilitatorToken: 'facilitator-secret',
      lobby,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/sessions/session-1/debrief?facilitator_token=facilitator-secret',
    )
  })
})

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
