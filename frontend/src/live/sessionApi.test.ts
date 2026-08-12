import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLiveSession, joinLiveSession, lobbyWebSocketUrl } from './sessionApi'

const lobby = {
  session_id: 'session-1',
  room_code: 'AB7K2P',
  phase: 'lobby',
  scenario_id: 'friday-pay-run',
  mode: 'standard',
  max_participants: 9,
  participant_count: 0,
  participants: [],
  warning: '',
} as const

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
})

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
