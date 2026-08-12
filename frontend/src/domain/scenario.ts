export type ScenarioDraft = {
  schema_version: 1
  id: string
  version: string
  status: 'draft'
  title: string
  summary: string
  modes: ScenarioModes
  roles: ScenarioRole[]
  metrics: ScenarioMetric[]
  flags: string[]
  rounds: ScenarioRound[]
  final_debrief: string[]
}

export type ScenarioModes = {
  quick: ScenarioMode
  standard: ScenarioMode
}

export type ScenarioMode = {
  label: string
  round_ids: string[]
}

export type ScenarioRole = {
  id: string
  name: string
  briefing: string
}

export type ScenarioMetric = {
  id: string
  name: string
  minimum: number
  maximum: number
  initial_value: number
}

export type ScenarioRound = {
  id: string
  title: string
  purpose: string
  shared_update: string
  role_information: Record<string, string>
  choices: Record<string, ScenarioChoice[]>
  interaction_rules: ScenarioInteractionRule[]
  public_consequence: string
  facilitator_note: string
  learning_objective: string
  learning_point: string
  discussion_questions: string[]
}

export type ScenarioChoice = {
  id: string
  label: string
  effects: ScenarioEffects
  adds_flags: string[]
}

export type ScenarioEffects = Record<string, number>

export type ScenarioInteractionRule = {
  id: string
  conditions: ScenarioInteractionConditions
  effects: ScenarioEffects
  adds_flags: string[]
  result_text: string
}

export type ScenarioInteractionConditions = {
  choices?: Record<string, string>
  present_flags?: string[]
  absent_flags?: string[]
}
