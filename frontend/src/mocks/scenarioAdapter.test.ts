import { describe, expect, it } from 'vitest'
import {
  metricDeltas,
  mockDepartmentChoiceIds,
  mockDepartmentDecisions,
  roles,
  scenario,
} from './scenario'
import { fridayPayRunScenarioDraft } from './scenarioAdapter'

describe('mock scenario adapter', () => {
  it('builds static scenario content from the validated JSON draft', () => {
    const firstRoundId = fridayPayRunScenarioDraft.modes.standard.round_ids[0]
    const firstRound = fridayPayRunScenarioDraft.rounds.find((round) => round.id === firstRoundId)

    expect(firstRound).toBeDefined()
    if (!firstRound) {
      throw new Error(`Missing first standard round: ${firstRoundId}`)
    }

    expect(scenario.id).toBe(fridayPayRunScenarioDraft.id)
    expect(scenario.title).toBe(fridayPayRunScenarioDraft.title)
    expect(scenario.modeLabel).toBe('Standard mode, 5 rounds')
    expect(scenario.round.title).toBe(firstRound.title)
    expect(scenario.round.shared).toBe(firstRound.shared_update)
    expect(scenario.round.consequence).toBe(firstRound.public_consequence)
    expect(scenario.round.learning).toBe(firstRound.learning_point)
    expect(scenario.facilitatorNote).toBe(firstRound.facilitator_note)
    expect(scenario.finalDebrief).toEqual(fridayPayRunScenarioDraft.final_debrief)
  })

  it('maps role-private information and choices from the first scenario round', () => {
    const firstRound = fridayPayRunScenarioDraft.rounds[0]

    expect(roles.hr.privateInfo).toBe(firstRound.role_information.hr)
    expect(roles['it-helpdesk'].privateInfo).toBe(firstRound.role_information['it-helpdesk'])
    expect(roles.hr.choices.map((choice) => choice.id)).toEqual(
      firstRound.choices.hr.map((choice) => choice.id),
    )
    expect(roles['it-helpdesk'].choices.map((choice) => choice.id)).toEqual(
      firstRound.choices['it-helpdesk'].map((choice) => choice.id),
    )
  })

  it('calculates mock result deltas from selected department choices and matching rules', () => {
    expect(mockDepartmentChoiceIds).toEqual({
      hr: 'hr-r1-secure-contact-escalate',
      'it-helpdesk': 'it-r1-verify-and-review',
    })
    expect(metricDeltas).toEqual([
      { label: 'Incident Control', value: '+27' },
      { label: 'Evidence Quality', value: '+28' },
      { label: 'Business Continuity', value: '-5' },
      { label: 'Employee Trust', value: '+17' },
    ])
    expect(mockDepartmentDecisions).toEqual({
      hr: 'Contact the employee through a trusted channel, preserve the message, and escalate the concern.',
      'it-helpdesk':
        'Verify the employee through an approved channel and review recent account activity.',
    })
  })
})
