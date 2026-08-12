import type {
  MetricDelta,
  RoleContent,
  RoleId,
  ScenarioArtifacts,
  ScenarioContent,
} from '../domain/model'
import type { ScenarioDraft, ScenarioEffects, ScenarioRound } from '../domain/scenario'
import { validateScenarioDraft } from '../domain/scenarioValidation'
import fridayPayRunScenarioJson from '../../../scenarios/friday_pay_run.json?raw'

export const fridayPayRunScenarioDraft = validateScenarioDraft(
  JSON.parse(fridayPayRunScenarioJson) as unknown,
)

export function buildMockScenarioContent(
  scenarioDraft: ScenarioDraft,
  artifacts: ScenarioArtifacts,
): ScenarioContent {
  const round = firstStandardRound(scenarioDraft)

  return {
    id: scenarioDraft.id,
    title: scenarioDraft.title,
    modeLabel: `${scenarioDraft.modes.standard.label}, ${scenarioDraft.modes.standard.round_ids.length} rounds`,
    round: {
      number: 1,
      total: scenarioDraft.modes.standard.round_ids.length,
      title: round.title,
      shared: round.shared_update,
      consequence: round.public_consequence,
      learning: round.learning_point,
    },
    roles: buildRoleContent(scenarioDraft, round),
    artifacts,
    facilitatorNote: round.facilitator_note,
    finalDebrief: scenarioDraft.final_debrief,
  }
}

export function buildDepartmentDecisionLabels(
  scenarioContent: ScenarioContent,
  selectedChoiceIds: Record<RoleId, string>,
): Record<RoleId, string> {
  return {
    hr: getSelectedChoiceLabel(scenarioContent, 'hr', selectedChoiceIds.hr),
    'it-helpdesk': getSelectedChoiceLabel(
      scenarioContent,
      'it-helpdesk',
      selectedChoiceIds['it-helpdesk'],
    ),
  }
}

export function buildMetricDeltas(
  scenarioDraft: ScenarioDraft,
  selectedChoiceIds: Record<RoleId, string>,
): MetricDelta[] {
  const round = firstStandardRound(scenarioDraft)
  const effects = emptyEffects(scenarioDraft)

  for (const [roleId, choiceId] of Object.entries(selectedChoiceIds) as [RoleId, string][]) {
    const choice = round.choices[roleId]?.find((candidate) => candidate.id === choiceId)

    if (!choice) {
      throw new Error(`Mock decision ${choiceId} is not a ${roleId} choice`)
    }

    addEffects(effects, choice.effects)
  }

  for (const rule of round.interaction_rules) {
    const ruleChoices = rule.conditions.choices

    if (!ruleChoices) {
      continue
    }

    const matches = Object.entries(ruleChoices).every(
      ([roleId, choiceId]) => selectedChoiceIds[roleId as RoleId] === choiceId,
    )

    if (matches) {
      addEffects(effects, rule.effects)
    }
  }

  return scenarioDraft.metrics.map((metric) => ({
    label: metric.name,
    value: formatDelta(effects[metric.id] ?? 0),
  }))
}

function getSelectedChoiceLabel(
  scenarioContent: ScenarioContent,
  roleId: RoleId,
  choiceId: string,
): string {
  const choice = scenarioContent.roles[roleId].choices.find(
    (candidate) => candidate.id === choiceId,
  )

  if (!choice) {
    throw new Error(`Mock decision ${choiceId} is not a ${roleId} choice`)
  }

  return choice.label
}

function buildRoleContent(
  scenarioDraft: ScenarioDraft,
  round: ScenarioRound,
): Record<RoleId, RoleContent> {
  return {
    hr: buildRole(scenarioDraft, round, 'hr'),
    'it-helpdesk': buildRole(scenarioDraft, round, 'it-helpdesk'),
  }
}

function buildRole(
  scenarioDraft: ScenarioDraft,
  round: ScenarioRound,
  roleId: RoleId,
): RoleContent {
  const role = scenarioDraft.roles.find((candidate) => candidate.id === roleId)

  if (!role) {
    throw new Error(`Scenario is missing required static mock role: ${roleId}`)
  }

  return {
    role: roleId,
    label: role.name,
    shortLabel: roleId === 'hr' ? 'HR' : 'IT',
    briefing: role.briefing,
    privateInfo: round.role_information[roleId],
    choices: round.choices[roleId].map((choice) => ({
      id: choice.id,
      label: choice.label,
    })),
  }
}

function firstStandardRound(scenarioDraft: ScenarioDraft): ScenarioRound {
  const firstRoundId = scenarioDraft.modes.standard.round_ids[0]
  const round = scenarioDraft.rounds.find((candidate) => candidate.id === firstRoundId)

  if (!round) {
    throw new Error(`Scenario standard mode references missing first round: ${firstRoundId}`)
  }

  return round
}

function emptyEffects(scenarioDraft: ScenarioDraft): ScenarioEffects {
  return Object.fromEntries(scenarioDraft.metrics.map((metric) => [metric.id, 0]))
}

function addEffects(target: ScenarioEffects, effects: ScenarioEffects): void {
  for (const [metricId, value] of Object.entries(effects)) {
    target[metricId] = (target[metricId] ?? 0) + value
  }
}

function formatDelta(value: number): string {
  if (value > 0) {
    return `+${value}`
  }

  return String(value)
}
