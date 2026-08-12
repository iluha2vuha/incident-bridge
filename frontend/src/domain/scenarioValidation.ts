import type {
  ScenarioChoice,
  ScenarioDraft,
  ScenarioEffects,
  ScenarioInteractionConditions,
  ScenarioInteractionRule,
  ScenarioMetric,
  ScenarioMode,
  ScenarioRole,
  ScenarioRound,
} from './scenario'

type Path = string

const scenarioKeys = [
  'schema_version',
  'id',
  'version',
  'status',
  'title',
  'summary',
  'modes',
  'roles',
  'metrics',
  'flags',
  'rounds',
  'final_debrief',
]

const modesKeys = ['quick', 'standard']
const modeKeys = ['label', 'round_ids']
const roleKeys = ['id', 'name', 'briefing']
const metricKeys = ['id', 'name', 'minimum', 'maximum', 'initial_value']
const roundKeys = [
  'id',
  'title',
  'purpose',
  'shared_update',
  'role_information',
  'choices',
  'interaction_rules',
  'public_consequence',
  'facilitator_note',
  'learning_objective',
  'learning_point',
  'discussion_questions',
]
const choiceKeys = ['id', 'label', 'effects', 'adds_flags']
const interactionRuleKeys = ['id', 'conditions', 'effects', 'adds_flags', 'result_text']
const conditionKeys = ['choices', 'present_flags', 'absent_flags']

export class ScenarioValidationError extends Error {
  readonly issues: string[]

  constructor(issues: string[]) {
    super(`Scenario validation failed:\n${issues.map((issue) => `- ${issue}`).join('\n')}`)
    this.name = 'ScenarioValidationError'
    this.issues = issues
  }
}

export function validateScenarioDraft(value: unknown): ScenarioDraft {
  const errors = collectScenarioValidationErrors(value)

  if (errors.length > 0) {
    throw new ScenarioValidationError(errors)
  }

  return value as ScenarioDraft
}

export function collectScenarioValidationErrors(value: unknown): string[] {
  const errors: string[] = []

  if (!isRecord(value)) {
    return ['scenario must be an object']
  }

  validateStrictKeys(value, scenarioKeys, 'scenario', errors)
  expectExactNumber(value.schema_version, 1, 'scenario.schema_version', errors)
  expectNonEmptyString(value.id, 'scenario.id', errors)
  expectNonEmptyString(value.version, 'scenario.version', errors)
  expectExactString(value.status, 'draft', 'scenario.status', errors)
  expectNonEmptyString(value.title, 'scenario.title', errors)
  expectNonEmptyString(value.summary, 'scenario.summary', errors)

  const roles = validateRoles(value.roles, errors)
  const metrics = validateMetrics(value.metrics, errors)
  const flags = validateFlags(value.flags, errors)
  const rounds = validateRounds(value.rounds, roles, metrics, flags, errors)

  validateModes(value.modes, rounds, errors)
  validateStringArray(value.final_debrief, 'scenario.final_debrief', errors)

  return errors
}

function validateRoles(value: unknown, errors: string[]): ScenarioRole[] {
  if (!Array.isArray(value)) {
    errors.push('scenario.roles must be an array')
    return []
  }

  if (value.length < 2) {
    errors.push('scenario.roles must define at least two roles')
  }

  const roleIds = new Set<string>()
  const roles: ScenarioRole[] = []

  value.forEach((role, index) => {
    const path = `scenario.roles[${index}]`

    if (!isRecord(role)) {
      errors.push(`${path} must be an object`)
      return
    }

    validateStrictKeys(role, roleKeys, path, errors)
    expectNonEmptyString(role.id, `${path}.id`, errors)
    expectNonEmptyString(role.name, `${path}.name`, errors)
    expectNonEmptyString(role.briefing, `${path}.briefing`, errors)

    if (typeof role.id === 'string') {
      expectUnique(role.id, roleIds, `${path}.id`, errors)
    }

    roles.push(role as ScenarioRole)
  })

  return roles
}

function validateMetrics(value: unknown, errors: string[]): ScenarioMetric[] {
  if (!Array.isArray(value)) {
    errors.push('scenario.metrics must be an array')
    return []
  }

  if (value.length < 1) {
    errors.push('scenario.metrics must define at least one metric')
  }

  const metricIds = new Set<string>()
  const metrics: ScenarioMetric[] = []

  value.forEach((metric, index) => {
    const path = `scenario.metrics[${index}]`

    if (!isRecord(metric)) {
      errors.push(`${path} must be an object`)
      return
    }

    validateStrictKeys(metric, metricKeys, path, errors)
    expectNonEmptyString(metric.id, `${path}.id`, errors)
    expectNonEmptyString(metric.name, `${path}.name`, errors)
    expectNumber(metric.minimum, `${path}.minimum`, errors)
    expectNumber(metric.maximum, `${path}.maximum`, errors)
    expectNumber(metric.initial_value, `${path}.initial_value`, errors)

    if (typeof metric.id === 'string') {
      expectUnique(metric.id, metricIds, `${path}.id`, errors)
    }

    if (
      typeof metric.minimum === 'number' &&
      typeof metric.maximum === 'number' &&
      metric.minimum >= metric.maximum
    ) {
      errors.push(`${path}.minimum must be less than ${path}.maximum`)
    }

    if (
      typeof metric.minimum === 'number' &&
      typeof metric.maximum === 'number' &&
      typeof metric.initial_value === 'number' &&
      (metric.initial_value < metric.minimum || metric.initial_value > metric.maximum)
    ) {
      errors.push(`${path}.initial_value must be within metric bounds`)
    }

    metrics.push(metric as ScenarioMetric)
  })

  return metrics
}

function validateFlags(value: unknown, errors: string[]): Set<string> {
  const flags = new Set<string>()

  if (!Array.isArray(value)) {
    errors.push('scenario.flags must be an array')
    return flags
  }

  value.forEach((flag, index) => {
    const path = `scenario.flags[${index}]`
    expectNonEmptyString(flag, path, errors)

    if (typeof flag === 'string') {
      expectUnique(flag, flags, path, errors)
    }
  })

  return flags
}

function validateRounds(
  value: unknown,
  roles: ScenarioRole[],
  metrics: ScenarioMetric[],
  flags: Set<string>,
  errors: string[],
): ScenarioRound[] {
  if (!Array.isArray(value)) {
    errors.push('scenario.rounds must be an array')
    return []
  }

  if (value.length < 1) {
    errors.push('scenario.rounds must define at least one round')
  }

  const roundIds = new Set<string>()
  const rounds: ScenarioRound[] = []
  const roleIds = roles.map((role) => role.id)
  const metricIds = new Set(metrics.map((metric) => metric.id))

  value.forEach((round, index) => {
    const path = `scenario.rounds[${index}]`

    if (!isRecord(round)) {
      errors.push(`${path} must be an object`)
      return
    }

    validateStrictKeys(round, roundKeys, path, errors)
    expectNonEmptyString(round.id, `${path}.id`, errors)
    expectNonEmptyString(round.title, `${path}.title`, errors)
    expectNonEmptyString(round.purpose, `${path}.purpose`, errors)
    expectNonEmptyString(round.shared_update, `${path}.shared_update`, errors)
    expectNonEmptyString(round.public_consequence, `${path}.public_consequence`, errors)
    expectNonEmptyString(round.facilitator_note, `${path}.facilitator_note`, errors)
    expectNonEmptyString(round.learning_objective, `${path}.learning_objective`, errors)
    expectNonEmptyString(round.learning_point, `${path}.learning_point`, errors)
    validateStringArray(round.discussion_questions, `${path}.discussion_questions`, errors)

    if (typeof round.id === 'string') {
      expectUnique(round.id, roundIds, `${path}.id`, errors)
    }

    validateRoleTextMap(round.role_information, roleIds, `${path}.role_information`, errors)
    const choicesByRole = validateChoices(round.choices, roleIds, metricIds, flags, path, errors)
    validateInteractionRules(
      round.interaction_rules,
      roleIds,
      metricIds,
      flags,
      choicesByRole,
      `${path}.interaction_rules`,
      errors,
    )

    rounds.push(round as ScenarioRound)
  })

  return rounds
}

function validateModes(value: unknown, rounds: ScenarioRound[], errors: string[]): void {
  if (!isRecord(value)) {
    errors.push('scenario.modes must be an object')
    return
  }

  validateStrictKeys(value, modesKeys, 'scenario.modes', errors)
  const roundIds = rounds.map((round) => round.id)
  const standardRoundIds = validateMode(value.standard, 'scenario.modes.standard', roundIds, errors)
  const quickRoundIds = validateMode(value.quick, 'scenario.modes.quick', roundIds, errors)

  if (standardRoundIds.length > 0 && standardRoundIds.length !== roundIds.length) {
    errors.push('scenario.modes.standard.round_ids must include every scenario round')
  }

  if (quickRoundIds.length > 0 && quickRoundIds.length >= standardRoundIds.length) {
    errors.push('scenario.modes.quick.round_ids must be shorter than standard mode')
  }

  let lastStandardIndex = -1
  for (const roundId of quickRoundIds) {
    const standardIndex = standardRoundIds.indexOf(roundId)

    if (standardIndex === -1) {
      errors.push(`scenario.modes.quick.round_ids references ${roundId}, which is not in standard mode`)
      continue
    }

    if (standardIndex <= lastStandardIndex) {
      errors.push('scenario.modes.quick.round_ids must preserve standard mode order')
    }

    lastStandardIndex = standardIndex
  }
}

function validateMode(
  value: unknown,
  path: Path,
  scenarioRoundIds: string[],
  errors: string[],
): string[] {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return []
  }

  validateStrictKeys(value, modeKeys, path, errors)
  expectNonEmptyString(value.label, `${path}.label`, errors)

  if (!Array.isArray(value.round_ids)) {
    errors.push(`${path}.round_ids must be an array`)
    return []
  }

  if (value.round_ids.length < 1) {
    errors.push(`${path}.round_ids must include at least one round`)
  }

  const seen = new Set<string>()

  value.round_ids.forEach((roundId, index) => {
    const roundPath = `${path}.round_ids[${index}]`
    expectNonEmptyString(roundId, roundPath, errors)

    if (typeof roundId !== 'string') {
      return
    }

    expectUnique(roundId, seen, roundPath, errors)

    if (!scenarioRoundIds.includes(roundId)) {
      errors.push(`${roundPath} must reference an existing round`)
    }
  })

  return value.round_ids.filter((roundId): roundId is string => typeof roundId === 'string')
}

function validateRoleTextMap(
  value: unknown,
  roleIds: string[],
  path: Path,
  errors: string[],
): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return
  }

  validateExactRecordKeys(value, roleIds, path, errors)

  for (const roleId of roleIds) {
    expectNonEmptyString(value[roleId], `${path}.${roleId}`, errors)
  }
}

function validateChoices(
  value: unknown,
  roleIds: string[],
  metricIds: Set<string>,
  flags: Set<string>,
  roundPath: Path,
  errors: string[],
): Map<string, Set<string>> {
  const choicesByRole = new Map<string, Set<string>>()
  const path = `${roundPath}.choices`

  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return choicesByRole
  }

  validateExactRecordKeys(value, roleIds, path, errors)

  for (const roleId of roleIds) {
    const choices = value[roleId]
    const choiceIds = new Set<string>()
    choicesByRole.set(roleId, choiceIds)

    if (!Array.isArray(choices)) {
      errors.push(`${path}.${roleId} must be an array`)
      continue
    }

    if (choices.length < 2) {
      errors.push(`${path}.${roleId} must include at least two choices`)
    }

    choices.forEach((choice, index) => {
      const choicePath = `${path}.${roleId}[${index}]`
      validateChoice(choice, choicePath, metricIds, flags, choiceIds, errors)
    })
  }

  return choicesByRole
}

function validateChoice(
  value: unknown,
  path: Path,
  metricIds: Set<string>,
  flags: Set<string>,
  choiceIds: Set<string>,
  errors: string[],
): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return
  }

  validateStrictKeys(value, choiceKeys, path, errors)
  expectNonEmptyString(value.id, `${path}.id`, errors)
  expectNonEmptyString(value.label, `${path}.label`, errors)

  if (typeof value.id === 'string') {
    expectUnique(value.id, choiceIds, `${path}.id`, errors)
  }

  validateEffects(value.effects, metricIds, `${path}.effects`, errors, { requireAllMetrics: true })
  validateFlagReferences(value.adds_flags, flags, `${path}.adds_flags`, errors)
}

function validateInteractionRules(
  value: unknown,
  roleIds: string[],
  metricIds: Set<string>,
  flags: Set<string>,
  choicesByRole: Map<string, Set<string>>,
  path: Path,
  errors: string[],
): void {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`)
    return
  }

  const ruleIds = new Set<string>()

  value.forEach((rule, index) => {
    const rulePath = `${path}[${index}]`

    if (!isRecord(rule)) {
      errors.push(`${rulePath} must be an object`)
      return
    }

    validateStrictKeys(rule, interactionRuleKeys, rulePath, errors)
    expectNonEmptyString(rule.id, `${rulePath}.id`, errors)
    expectNonEmptyString(rule.result_text, `${rulePath}.result_text`, errors)

    if (typeof rule.id === 'string') {
      expectUnique(rule.id, ruleIds, `${rulePath}.id`, errors)
    }

    validateConditions(
      rule.conditions,
      roleIds,
      flags,
      choicesByRole,
      `${rulePath}.conditions`,
      errors,
    )
    validateEffects(rule.effects, metricIds, `${rulePath}.effects`, errors, {
      requireAllMetrics: false,
    })
    validateFlagReferences(rule.adds_flags, flags, `${rulePath}.adds_flags`, errors)
  })
}

function validateConditions(
  value: unknown,
  roleIds: string[],
  flags: Set<string>,
  choicesByRole: Map<string, Set<string>>,
  path: Path,
  errors: string[],
): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return
  }

  validateAllowedKeys(value, conditionKeys, path, errors)

  const hasChoices = Object.hasOwn(value, 'choices')
  const hasPresentFlags = Object.hasOwn(value, 'present_flags')
  const hasAbsentFlags = Object.hasOwn(value, 'absent_flags')

  if (!hasChoices && !hasPresentFlags && !hasAbsentFlags) {
    errors.push(`${path} must include at least one condition`)
  }

  if (hasChoices) {
    validateConditionChoices(value.choices, roleIds, choicesByRole, `${path}.choices`, errors)
  }

  if (hasPresentFlags) {
    validateFlagReferences(value.present_flags, flags, `${path}.present_flags`, errors)
  }

  if (hasAbsentFlags) {
    validateFlagReferences(value.absent_flags, flags, `${path}.absent_flags`, errors)
  }
}

function validateConditionChoices(
  value: unknown,
  roleIds: string[],
  choicesByRole: Map<string, Set<string>>,
  path: Path,
  errors: string[],
): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return
  }

  for (const key of Object.keys(value)) {
    if (!roleIds.includes(key)) {
      errors.push(`${path}.${key} must reference an existing role`)
    }
  }

  if (Object.keys(value).length < 1) {
    errors.push(`${path} must include at least one role choice condition`)
  }

  for (const roleId of roleIds) {
    if (!Object.hasOwn(value, roleId)) {
      continue
    }

    const choiceId = value[roleId]
    expectNonEmptyString(choiceId, `${path}.${roleId}`, errors)

    if (typeof choiceId === 'string' && !choicesByRole.get(roleId)?.has(choiceId)) {
      errors.push(`${path}.${roleId} must reference a choice for ${roleId}`)
    }
  }
}

function validateEffects(
  value: unknown,
  metricIds: Set<string>,
  path: Path,
  errors: string[],
  options: { requireAllMetrics: boolean },
): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return
  }

  const effectKeys = Object.keys(value)

  if (effectKeys.length < 1) {
    errors.push(`${path} must include at least one metric effect`)
  }

  if (options.requireAllMetrics && effectKeys.length !== metricIds.size) {
    errors.push(`${path} must include every scenario metric`)
  }

  for (const metricId of effectKeys) {
    if (!metricIds.has(metricId)) {
      errors.push(`${path}.${metricId} must reference an existing metric`)
      continue
    }

    expectNumber(value[metricId], `${path}.${metricId}`, errors)
  }

  if (options.requireAllMetrics) {
    for (const metricId of metricIds) {
      if (!Object.hasOwn(value, metricId)) {
        errors.push(`${path}.${metricId} is required`)
      }
    }
  }
}

function validateFlagReferences(
  value: unknown,
  flags: Set<string>,
  path: Path,
  errors: string[],
): void {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`)
    return
  }

  const seen = new Set<string>()

  value.forEach((flag, index) => {
    const flagPath = `${path}[${index}]`
    expectNonEmptyString(flag, flagPath, errors)

    if (typeof flag !== 'string') {
      return
    }

    expectUnique(flag, seen, flagPath, errors)

    if (!flags.has(flag)) {
      errors.push(`${flagPath} must reference an existing flag`)
    }
  })
}

function validateStringArray(value: unknown, path: Path, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`)
    return
  }

  if (value.length < 1) {
    errors.push(`${path} must include at least one item`)
  }

  value.forEach((item, index) => expectNonEmptyString(item, `${path}[${index}]`, errors))
}

function validateStrictKeys(
  value: Record<string, unknown>,
  allowedKeys: string[],
  path: Path,
  errors: string[],
): void {
  for (const key of allowedKeys) {
    if (!Object.hasOwn(value, key)) {
      errors.push(`${path}.${key} is required`)
    }
  }

  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) {
      errors.push(`${path}.${key} is not allowed`)
    }
  }
}

function validateAllowedKeys(
  value: Record<string, unknown>,
  allowedKeys: string[],
  path: Path,
  errors: string[],
): void {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) {
      errors.push(`${path}.${key} is not allowed`)
    }
  }
}

function validateExactRecordKeys(
  value: Record<string, unknown>,
  keys: string[],
  path: Path,
  errors: string[],
): void {
  for (const key of keys) {
    if (!Object.hasOwn(value, key)) {
      errors.push(`${path}.${key} is required`)
    }
  }

  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) {
      errors.push(`${path}.${key} must reference an existing role`)
    }
  }
}

function expectUnique(
  value: string,
  seen: Set<string>,
  path: Path,
  errors: string[],
): void {
  if (seen.has(value)) {
    errors.push(`${path} must be unique`)
    return
  }

  seen.add(value)
}

function expectNonEmptyString(value: unknown, path: Path, errors: string[]): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${path} must be a non-empty string`)
  }
}

function expectExactString(
  value: unknown,
  expected: string,
  path: Path,
  errors: string[],
): void {
  if (value !== expected) {
    errors.push(`${path} must be ${expected}`)
  }
}

function expectExactNumber(
  value: unknown,
  expected: number,
  path: Path,
  errors: string[],
): void {
  if (value !== expected) {
    errors.push(`${path} must be ${expected}`)
  }
}

function expectNumber(value: unknown, path: Path, errors: string[]): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    errors.push(`${path} must be a finite number`)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export type {
  ScenarioChoice,
  ScenarioDraft,
  ScenarioEffects,
  ScenarioInteractionConditions,
  ScenarioInteractionRule,
  ScenarioMetric,
  ScenarioMode,
  ScenarioRole,
  ScenarioRound,
}
