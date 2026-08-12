import type {
  LiveDebriefSnapshot,
  LiveLobbySnapshot,
  LiveRoundSnapshot,
  LiveSessionState,
} from '../domain/model'

const API_BASE_URL = import.meta.env.VITE_INCIDENT_BRIDGE_API_URL ?? 'http://127.0.0.1:8000'

type CreateSessionResponse = {
  session_id: string
  room_code: string
  facilitator_token: string
  join_url: string
  join_qr_svg: string
  lobby: LiveLobbySnapshot
}

type JoinSessionResponse = {
  session_id: string
  participant_id: string
  participant_token: string
  lobby: LiveLobbySnapshot
}

type ReconnectSessionResponse = {
  actor: 'facilitator' | 'participant'
  participant_id?: string | null
  participant_name?: string | null
  lobby: LiveLobbySnapshot
}

type SessionErrorBody = {
  detail?: {
    code?: string
    message?: string
  }
}

export async function createLiveSession(mode: 'quick' | 'standard'): Promise<LiveSessionState> {
  const response = await request<CreateSessionResponse>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ scenario_id: 'friday-pay-run', mode }),
  })

  return {
    actor: 'facilitator',
    sessionId: response.session_id,
    roomCode: response.room_code,
    facilitatorToken: response.facilitator_token,
    joinUrl: response.join_url,
    joinQrSvg: response.join_qr_svg,
    lobby: response.lobby,
  }
}

export async function joinLiveSession(
  roomCode: string,
  nickname: string,
): Promise<LiveSessionState> {
  const response = await request<JoinSessionResponse>('/api/sessions/join', {
    method: 'POST',
    body: JSON.stringify({ room_code: roomCode, nickname }),
  })

  return {
    actor: 'participant',
    sessionId: response.session_id,
    roomCode: response.lobby.room_code,
    participantId: response.participant_id,
    participantToken: response.participant_token,
    participantName: nickname.trim(),
    lobby: response.lobby,
  }
}

export async function reconnectLiveSession(session: LiveSessionState): Promise<LiveSessionState> {
  const body =
    session.actor === 'facilitator'
      ? { facilitator_token: session.facilitatorToken }
      : { participant_token: session.participantToken }
  const response = await request<ReconnectSessionResponse>(
    `/api/sessions/${session.sessionId}/reconnect`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )

  if (response.actor === 'facilitator') {
    return {
      ...session,
      actor: 'facilitator',
      lobby: response.lobby,
    }
  }

  return {
    ...session,
    actor: 'participant',
    participantId: response.participant_id ?? session.participantId,
    participantName: response.participant_name ?? session.participantName,
    lobby: response.lobby,
  }
}

export async function closeLiveSession(session: LiveSessionState): Promise<LiveLobbySnapshot> {
  if (!session.facilitatorToken) {
    throw new Error('Permission denied.')
  }

  return await request<LiveLobbySnapshot>(`/api/sessions/${session.sessionId}/close`, {
    method: 'POST',
    body: JSON.stringify({ facilitator_token: session.facilitatorToken }),
  })
}

export async function selectParticipantRole(
  session: LiveSessionState,
  roleId: string,
): Promise<LiveLobbySnapshot> {
  if (!session.participantToken) {
    throw new Error('Permission denied.')
  }

  return await request<LiveLobbySnapshot>(`/api/sessions/${session.sessionId}/role`, {
    method: 'POST',
    body: JSON.stringify({ participant_token: session.participantToken, role_id: roleId }),
  })
}

export async function startLiveSession(session: LiveSessionState): Promise<LiveLobbySnapshot> {
  if (!session.facilitatorToken) {
    throw new Error('Permission denied.')
  }

  return await request<LiveLobbySnapshot>(`/api/sessions/${session.sessionId}/start`, {
    method: 'POST',
    body: JSON.stringify({ facilitator_token: session.facilitatorToken }),
  })
}

export async function openLiveRound(session: LiveSessionState): Promise<LiveRoundSnapshot> {
  if (!session.facilitatorToken) {
    throw new Error('Permission denied.')
  }

  return await request<LiveRoundSnapshot>(`/api/sessions/${session.sessionId}/round/open`, {
    method: 'POST',
    body: JSON.stringify({ facilitator_token: session.facilitatorToken }),
  })
}

export async function getLiveRound(session: LiveSessionState): Promise<LiveRoundSnapshot> {
  const url = new URL(`${API_BASE_URL}/api/sessions/${session.sessionId}/round`)

  if (session.actor === 'facilitator' && session.facilitatorToken) {
    url.searchParams.set('facilitator_token', session.facilitatorToken)
  }

  if (session.actor === 'participant' && session.participantToken) {
    url.searchParams.set('participant_token', session.participantToken)
  }

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(await errorMessage(response))
  }

  return (await response.json()) as LiveRoundSnapshot
}

export async function submitLiveVote(
  session: LiveSessionState,
  roundId: string,
  choiceId: string,
): Promise<LiveRoundSnapshot> {
  if (!session.participantToken) {
    throw new Error('Permission denied.')
  }

  return await request<LiveRoundSnapshot>(`/api/sessions/${session.sessionId}/vote`, {
    method: 'POST',
    body: JSON.stringify({
      participant_token: session.participantToken,
      round_id: roundId,
      choice_id: choiceId,
    }),
  })
}

export async function lockLiveRound(session: LiveSessionState): Promise<LiveRoundSnapshot> {
  if (!session.facilitatorToken) {
    throw new Error('Permission denied.')
  }

  return await request<LiveRoundSnapshot>(`/api/sessions/${session.sessionId}/round/lock`, {
    method: 'POST',
    body: JSON.stringify({ facilitator_token: session.facilitatorToken }),
  })
}

export async function revealLiveRound(session: LiveSessionState): Promise<LiveRoundSnapshot> {
  if (!session.facilitatorToken) {
    throw new Error('Permission denied.')
  }

  return await request<LiveRoundSnapshot>(`/api/sessions/${session.sessionId}/round/reveal`, {
    method: 'POST',
    body: JSON.stringify({ facilitator_token: session.facilitatorToken }),
  })
}

export async function advanceLiveRound(session: LiveSessionState): Promise<LiveRoundSnapshot> {
  if (!session.facilitatorToken) {
    throw new Error('Permission denied.')
  }

  return await request<LiveRoundSnapshot>(`/api/sessions/${session.sessionId}/round/advance`, {
    method: 'POST',
    body: JSON.stringify({ facilitator_token: session.facilitatorToken }),
  })
}

export async function getLiveDebrief(session: LiveSessionState): Promise<LiveDebriefSnapshot> {
  const url = new URL(`${API_BASE_URL}/api/sessions/${session.sessionId}/debrief`)

  if (session.actor === 'facilitator' && session.facilitatorToken) {
    url.searchParams.set('facilitator_token', session.facilitatorToken)
  }

  if (session.actor === 'participant' && session.participantToken) {
    url.searchParams.set('participant_token', session.participantToken)
  }

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(await errorMessage(response))
  }

  return (await response.json()) as LiveDebriefSnapshot
}

export function lobbyWebSocketUrl(
  sessionId: string,
  actor: LiveSessionState['actor'],
  facilitatorToken?: string,
  participantToken?: string,
): string {
  const url = new URL(`/ws/sessions/${sessionId}/lobby`, API_BASE_URL)

  if (actor === 'facilitator' && facilitatorToken) {
    url.searchParams.set('facilitator_token', facilitatorToken)
  }

  if (actor === 'participant' && participantToken) {
    url.searchParams.set('participant_token', participantToken)
  }

  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  if (!response.ok) {
    throw new Error(await errorMessage(response))
  }

  return (await response.json()) as T
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as SessionErrorBody
    return body.detail?.message ?? `Request failed with status ${response.status}`
  } catch {
    return `Request failed with status ${response.status}`
  }
}
