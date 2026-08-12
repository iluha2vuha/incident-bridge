import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ScenarioValidationError,
  collectScenarioValidationErrors,
  validateScenarioDraft,
} from './scenarioValidation'

const scenarioPath = join(process.cwd(), '../scenarios/friday_pay_run.json')

function loadScenario(): unknown {
  return JSON.parse(readFileSync(scenarioPath, 'utf8')) as unknown
}

function loadScenarioRecord(): Record<string, unknown> {
  return structuredClone(loadScenario()) as Record<string, unknown>
}

describe('scenario draft validation', () => {
  it('accepts the Friday Pay Run JSON draft', () => {
    const scenario = validateScenarioDraft(loadScenario())

    expect(scenario.id).toBe('friday-pay-run')
    expect(scenario.rounds).toHaveLength(5)
    expect(scenario.modes.quick.round_ids).toEqual([
      'r1-suspicious-payroll-request',
      'r3-suspicious-mailbox-activity',
      'r5-recovery-and-communication',
    ])
  })

  it('rejects mode round IDs that are not in the scenario', () => {
    const scenario = loadScenarioRecord()
    const modes = scenario.modes as Record<string, Record<string, string[]>>
    modes.quick.round_ids = ['r1-suspicious-payroll-request', 'missing-round']

    expect(() => validateScenarioDraft(scenario)).toThrow(ScenarioValidationError)
    expect(collectScenarioValidationErrors(scenario)).toContain(
      'scenario.modes.quick.round_ids[1] must reference an existing round',
    )
  })

  it('rejects choices that do not include every metric', () => {
    const scenario = loadScenarioRecord()
    const firstRound = getRound(scenario, 0)
    const hrChoices = getChoices(firstRound, 'hr')
    const effects = hrChoices[0].effects as Record<string, unknown>

    delete effects.employee_trust

    expect(collectScenarioValidationErrors(scenario)).toContain(
      'scenario.rounds[0].choices.hr[0].effects.employee_trust is required',
    )
  })

  it('rejects unknown flags added by choices', () => {
    const scenario = loadScenarioRecord()
    const firstRound = getRound(scenario, 0)
    const hrChoices = getChoices(firstRound, 'hr')

    hrChoices[0].adds_flags = ['not_a_declared_flag']

    expect(collectScenarioValidationErrors(scenario)).toContain(
      'scenario.rounds[0].choices.hr[0].adds_flags[0] must reference an existing flag',
    )
  })

  it('rejects interaction rules that reference choices from another role', () => {
    const scenario = loadScenarioRecord()
    const firstRound = getRound(scenario, 0)
    const interactionRules = firstRound.interaction_rules as Record<string, unknown>[]
    const firstRule = interactionRules[0]
    const conditions = firstRule.conditions as Record<string, Record<string, string>>

    conditions.choices.hr = 'it-r1-verify-and-review'

    expect(collectScenarioValidationErrors(scenario)).toContain(
      'scenario.rounds[0].interaction_rules[0].conditions.choices.hr must reference a choice for hr',
    )
  })

  it('rejects role-private information that is missing a declared role', () => {
    const scenario = loadScenarioRecord()
    const firstRound = getRound(scenario, 0)
    const roleInformation = firstRound.role_information as Record<string, unknown>

    delete roleInformation['it-helpdesk']

    expect(collectScenarioValidationErrors(scenario)).toContain(
      'scenario.rounds[0].role_information.it-helpdesk is required',
    )
  })
})

function getRound(scenario: Record<string, unknown>, index: number): Record<string, unknown> {
  return (scenario.rounds as Record<string, unknown>[])[index]
}

function getChoices(round: Record<string, unknown>, roleId: string): Record<string, unknown>[] {
  return (round.choices as Record<string, Record<string, unknown>[]>)[roleId]
}
