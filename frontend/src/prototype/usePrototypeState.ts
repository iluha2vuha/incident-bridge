import { useState } from 'react'
import type {
  ChoiceStep,
  ConnectionState,
  FacilitatorLobbyVariant,
  RoleId,
  VoteVariant,
} from '../domain/model'
import { roles } from '../mocks/scenario'

export function usePrototypeState() {
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
  }
}

export type PrototypeState = ReturnType<typeof usePrototypeState>
