import { useCallback, useState } from 'react'
import type {
  ChoiceStep,
  ConnectionState,
  FacilitatorLobbyVariant,
  LiveLobbySnapshot,
  LiveSessionState,
  RoleId,
  VoteVariant,
} from '../domain/model'
import { roles } from '../mocks/scenario'
import { buildFacilitatorSnapshot, buildParticipantSnapshot } from '../mocks/snapshots'

export function usePrototypeState() {
  const [role, setRole] = useState<RoleId>('hr')
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>('')
  const [choiceStep, setChoiceStep] = useState<ChoiceStep>('choice')
  const [connection, setConnection] = useState<ConnectionState>('connected')
  const [lobbyVariant, setLobbyVariant] = useState<FacilitatorLobbyVariant>('ready')
  const [voteVariant, setVoteVariant] = useState<VoteVariant>('open')
  const [liveSession, setLiveSession] = useState<LiveSessionState | null>(null)

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
    participantSnapshot,
    facilitatorSnapshot,
  }
}

export type PrototypeState = ReturnType<typeof usePrototypeState>
