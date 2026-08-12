import { useCallback, useEffect, useState } from 'react'
import type {
  ChoiceStep,
  ConnectionState,
  FacilitatorLobbyVariant,
  LiveDebriefSnapshot,
  LiveLobbySnapshot,
  LiveRoundSnapshot,
  LiveSessionState,
  RoleId,
  VoteVariant,
} from '../domain/model'
import { roles } from '../mocks/scenario'
import { buildFacilitatorSnapshot, buildParticipantSnapshot } from '../mocks/snapshots'

const LIVE_SESSION_STORAGE_KEY = 'incident-bridge-live-session'

export function usePrototypeState() {
  const [role, setRole] = useState<RoleId>('hr')
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>('')
  const [choiceStep, setChoiceStep] = useState<ChoiceStep>('choice')
  const [connection, setConnection] = useState<ConnectionState>('connected')
  const [lobbyVariant, setLobbyVariant] = useState<FacilitatorLobbyVariant>('ready')
  const [voteVariant, setVoteVariant] = useState<VoteVariant>('open')
  const [liveSession, setLiveSession] = useState<LiveSessionState | null>(null)
  const [liveRound, setLiveRound] = useState<LiveRoundSnapshot | null>(null)
  const [liveDebrief, setLiveDebrief] = useState<LiveDebriefSnapshot | null>(null)

  const roleContent = roles[role]
  const selectedChoice = roleContent.choices.find((choice) => choice.id === selectedChoiceId)
  const participantSnapshot = buildParticipantSnapshot(role, connection)
  const facilitatorSnapshot = buildFacilitatorSnapshot(lobbyVariant, voteVariant)
  const updateLiveLobby = useCallback((lobby: LiveLobbySnapshot) => {
    setLiveSession((current) => {
      if (!current || current.sessionId !== lobby.session_id) {
        return current
      }

      return { ...current, lobby }
    })
  }, [])

  useEffect(() => {
    const savedSession = readStoredLiveSession()

    if (savedSession) {
      setLiveSession(savedSession)
    }
  }, [])

  useEffect(() => {
    if (liveSession) {
      window.localStorage.setItem(LIVE_SESSION_STORAGE_KEY, JSON.stringify(liveSession))
      return
    }

    window.localStorage.removeItem(LIVE_SESSION_STORAGE_KEY)
  }, [liveSession])

  return {
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
    liveSession,
    setLiveSession,
    updateLiveLobby,
    liveRound,
    setLiveRound,
    liveDebrief,
    setLiveDebrief,
    participantSnapshot,
    facilitatorSnapshot,
  }
}

export type PrototypeState = ReturnType<typeof usePrototypeState>

function readStoredLiveSession(): LiveSessionState | null {
  try {
    const rawSession = window.localStorage.getItem(LIVE_SESSION_STORAGE_KEY)

    if (!rawSession) {
      return null
    }

    return JSON.parse(rawSession) as LiveSessionState
  } catch {
    window.localStorage.removeItem(LIVE_SESSION_STORAGE_KEY)
    return null
  }
}
