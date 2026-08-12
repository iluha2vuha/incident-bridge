import type {
  ConnectionState,
  FacilitatorLobbyVariant,
  FacilitatorSnapshot,
  ParticipantSnapshot,
  RoleArtifact,
  RoleId,
  VoteVariant,
} from '../domain/model'
import { metricDeltas, mockDepartmentDecisions, roles, scenario } from './scenario'
import { fakeParticipants, lobbySnapshots, mockSession, voteSnapshots } from './session'

function roleArtifact(role: RoleId): RoleArtifact {
  if (role === 'hr') {
    return { kind: 'email', content: scenario.artifacts.hrEmail }
  }

  return { kind: 'ticket', content: scenario.artifacts.itTicket }
}

export function buildParticipantSnapshot(
  role: RoleId,
  connection: ConnectionState,
): ParticipantSnapshot {
  return {
    roomCode: mockSession.roomCode,
    participantName: mockSession.participantName,
    maxParticipants: mockSession.maxParticipants,
    connection,
    role: roles[role],
    lobby: lobbySnapshots.ready,
    round: scenario.round,
    artifact: roleArtifact(role),
    departmentDecisions: mockDepartmentDecisions,
    metricDeltas,
  }
}

export function buildFacilitatorSnapshot(
  lobbyVariant: FacilitatorLobbyVariant,
  voteVariant: VoteVariant,
): FacilitatorSnapshot {
  return {
    roomCode: mockSession.roomCode,
    joinUrl: mockSession.joinUrl,
    maxParticipants: mockSession.maxParticipants,
    participants: fakeParticipants,
    lobby: lobbySnapshots[lobbyVariant],
    vote: voteSnapshots[voteVariant],
    round: scenario.round,
    departmentDecisions: mockDepartmentDecisions,
    metricDeltas,
    privateRoundNote: scenario.facilitatorNote,
    scenarioTitle: scenario.title,
  }
}
