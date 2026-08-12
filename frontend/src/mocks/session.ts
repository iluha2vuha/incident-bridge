import type {
  FacilitatorLobbyVariant,
  LobbySnapshot,
  ParticipantRecord,
  VoteSnapshot,
  VoteVariant,
} from '../domain/model'

export const mockSession = {
  roomCode: 'AB7K2P',
  joinUrl: 'incident-bridge.example/join',
  participantName: 'Jordan',
  maxParticipants: 9,
}

export const fakeParticipants: ParticipantRecord[] = [
  { name: 'Jordan P.', role: 'HR', status: 'connected' },
  { name: 'Morgan T.', role: 'HR', status: 'connected' },
  { name: 'Priya S.', role: 'HR', status: 'connected' },
  { name: 'Sam R.', role: 'IT Helpdesk', status: 'connected' },
  { name: 'Alex K.', role: 'IT Helpdesk', status: 'connected' },
  { name: 'Chen W.', role: 'IT Helpdesk', status: 'connected' },
]

export const lobbySnapshots: Record<FacilitatorLobbyVariant, LobbySnapshot> = {
  ready: { total: 6, hr: 3, it: 3, warning: '' },
  emptyRole: { total: 4, hr: 4, it: 0, warning: 'IT Helpdesk has no participants.' },
  imbalance: { total: 5, hr: 4, it: 1, warning: 'Role imbalance: HR 4, IT Helpdesk 1.' },
}

export const voteSnapshots: Record<VoteVariant, VoteSnapshot> = {
  open: { hr: '0/3', it: '0/3', warning: '' },
  arriving: { hr: '2/3', it: '1/3', warning: 'Missing: Morgan, Sam, Alex.' },
  complete: { hr: '3/3', it: '3/3', warning: '' },
  missing: { hr: '3/3', it: '1/3', warning: 'Two IT Helpdesk participants have not voted.' },
}
