import { describe, expect, it } from 'vitest'
import { buildFacilitatorSnapshot, buildParticipantSnapshot } from './snapshots'

describe('mock protocol snapshots', () => {
  it('returns HR-only participant round artefacts for HR', () => {
    const snapshot = buildParticipantSnapshot('hr', 'connected')

    expect(snapshot.role.role).toBe('hr')
    expect(snapshot.artifact.kind).toBe('email')
    expect(JSON.stringify(snapshot)).toContain('People Operations')
    expect(JSON.stringify(snapshot)).not.toContain('BridgeDesk')
    expect(Object.hasOwn(snapshot, 'privateRoundNote')).toBe(false)
  })

  it('returns IT-only participant round artefacts for IT Helpdesk', () => {
    const snapshot = buildParticipantSnapshot('it-helpdesk', 'connected')

    expect(snapshot.role.role).toBe('it-helpdesk')
    expect(snapshot.artifact.kind).toBe('ticket')
    expect(JSON.stringify(snapshot)).toContain('INC-10427')
    expect(JSON.stringify(snapshot)).not.toContain('People Operations')
    expect(Object.hasOwn(snapshot, 'privateRoundNote')).toBe(false)
  })

  it('returns facilitator lobby and vote snapshots for review controls', () => {
    const snapshot = buildFacilitatorSnapshot('imbalance', 'missing')

    expect(snapshot.lobby.warning).toMatch(/role imbalance/i)
    expect(snapshot.vote.warning).toMatch(/not voted/i)
    expect(snapshot.privateRoundNote).toMatch(/preserve the message/i)
    expect(snapshot.participants).toHaveLength(6)
    expect(snapshot.debrief.timeline).toHaveLength(5)
    expect(snapshot.tie.choices).toHaveLength(2)
  })
})
