from __future__ import annotations

from typing import Dict, List, Literal, Optional, Set

from pydantic import BaseModel, ConfigDict, Field, model_validator


class StrictScenarioModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ScenarioMode(StrictScenarioModel):
    label: str = Field(min_length=1)
    round_ids: List[str] = Field(min_length=1)


class ScenarioModes(StrictScenarioModel):
    quick: ScenarioMode
    standard: ScenarioMode


class ScenarioRole(StrictScenarioModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    briefing: str = Field(min_length=1)


class ScenarioMetric(StrictScenarioModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    minimum: int
    maximum: int
    initial_value: int

    @model_validator(mode="after")
    def validate_bounds(self) -> "ScenarioMetric":
        if self.minimum >= self.maximum:
            raise ValueError("minimum must be less than maximum")

        if not self.minimum <= self.initial_value <= self.maximum:
            raise ValueError("initial_value must be within metric bounds")

        return self


class ScenarioInteractionConditions(StrictScenarioModel):
    choices: Optional[Dict[str, str]] = None
    present_flags: Optional[List[str]] = None
    absent_flags: Optional[List[str]] = None

    @model_validator(mode="after")
    def validate_has_condition(self) -> "ScenarioInteractionConditions":
        if not self.choices and not self.present_flags and not self.absent_flags:
            raise ValueError("at least one condition is required")

        return self


class ScenarioInteractionRule(StrictScenarioModel):
    id: str = Field(min_length=1)
    conditions: ScenarioInteractionConditions
    effects: Dict[str, int] = Field(min_length=1)
    adds_flags: List[str] = Field(default_factory=list)
    result_text: str = Field(min_length=1)


class ScenarioChoice(StrictScenarioModel):
    id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    effects: Dict[str, int] = Field(min_length=1)
    adds_flags: List[str] = Field(default_factory=list)


class ScenarioRound(StrictScenarioModel):
    id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    purpose: str = Field(min_length=1)
    shared_update: str = Field(min_length=1)
    role_information: Dict[str, str]
    choices: Dict[str, List[ScenarioChoice]]
    interaction_rules: List[ScenarioInteractionRule] = Field(default_factory=list)
    public_consequence: str = Field(min_length=1)
    facilitator_note: str = Field(min_length=1)
    learning_objective: str = Field(min_length=1)
    learning_point: str = Field(min_length=1)
    discussion_questions: List[str] = Field(min_length=1)


class ScenarioDraft(StrictScenarioModel):
    schema_version: Literal[1]
    id: str = Field(min_length=1)
    version: str = Field(min_length=1)
    status: Literal["draft"]
    title: str = Field(min_length=1)
    summary: str = Field(min_length=1)
    modes: ScenarioModes
    roles: List[ScenarioRole] = Field(min_length=2)
    metrics: List[ScenarioMetric] = Field(min_length=1)
    flags: List[str] = Field(default_factory=list)
    rounds: List[ScenarioRound] = Field(min_length=1)
    final_debrief: List[str] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_references(self) -> "ScenarioDraft":
        role_ids = [role.id for role in self.roles]
        metric_id_list = [metric.id for metric in self.metrics]
        metric_ids = set(metric_id_list)
        flag_ids = set(self.flags)
        round_ids = [round_.id for round_ in self.rounds]

        ensure_unique(role_ids, "role ids")
        ensure_unique(metric_id_list, "metric ids")
        ensure_unique(self.flags, "flags")
        ensure_unique(round_ids, "round ids")

        self.validate_modes(round_ids)

        for round_ in self.rounds:
            self.validate_round(round_, role_ids, metric_ids, flag_ids)

        return self

    def validate_modes(self, round_ids: List[str]) -> None:
        standard_round_ids = self.modes.standard.round_ids
        quick_round_ids = self.modes.quick.round_ids

        ensure_unique(standard_round_ids, "standard mode round ids")
        ensure_unique(quick_round_ids, "quick mode round ids")

        for round_id in standard_round_ids + quick_round_ids:
            if round_id not in round_ids:
                raise ValueError(f"mode references unknown round id: {round_id}")

        if len(standard_round_ids) != len(round_ids):
            raise ValueError("standard mode must include every scenario round")

        if len(quick_round_ids) >= len(standard_round_ids):
            raise ValueError("quick mode must be shorter than standard mode")

        last_standard_index = -1
        for round_id in quick_round_ids:
            standard_index = standard_round_ids.index(round_id)

            if standard_index <= last_standard_index:
                raise ValueError("quick mode must preserve standard mode order")

            last_standard_index = standard_index

    def validate_round(
        self,
        round_: ScenarioRound,
        role_ids: List[str],
        metric_ids: Set[str],
        flag_ids: Set[str],
    ) -> None:
        if set(round_.role_information.keys()) != set(role_ids):
            raise ValueError(f"{round_.id} must include private information for every role")

        if set(round_.choices.keys()) != set(role_ids):
            raise ValueError(f"{round_.id} must include choices for every role")

        choices_by_role: Dict[str, Set[str]] = {}

        for role_id in role_ids:
            choices = round_.choices[role_id]

            if len(choices) < 2:
                raise ValueError(f"{round_.id} must include at least two choices for {role_id}")

            choice_id_list = [choice.id for choice in choices]
            choice_ids = set(choice_id_list)
            ensure_unique(choice_id_list, f"{round_.id} {role_id} choice ids")
            choices_by_role[role_id] = choice_ids

            for choice in choices:
                validate_exact_effect_metrics(choice.effects, metric_ids, f"{choice.id} effects")
                validate_flags(choice.adds_flags, flag_ids, f"{choice.id} adds_flags")

        for rule in round_.interaction_rules:
            validate_effect_metric_references(rule.effects, metric_ids, f"{rule.id} effects")
            validate_flags(rule.adds_flags, flag_ids, f"{rule.id} adds_flags")
            validate_rule_conditions(rule, role_ids, choices_by_role, flag_ids)


def validate_rule_conditions(
    rule: ScenarioInteractionRule,
    role_ids: List[str],
    choices_by_role: Dict[str, Set[str]],
    flag_ids: Set[str],
) -> None:
    conditions = rule.conditions

    if conditions.choices is not None:
        for role_id, choice_id in conditions.choices.items():
            if role_id not in role_ids:
                raise ValueError(f"{rule.id} references unknown role: {role_id}")

            if choice_id not in choices_by_role[role_id]:
                raise ValueError(f"{rule.id} references unknown choice for {role_id}: {choice_id}")

    if conditions.present_flags is not None:
        validate_flags(conditions.present_flags, flag_ids, f"{rule.id} present_flags")

    if conditions.absent_flags is not None:
        validate_flags(conditions.absent_flags, flag_ids, f"{rule.id} absent_flags")


def validate_exact_effect_metrics(
    effects: Dict[str, int],
    metric_ids: Set[str],
    label: str,
) -> None:
    if set(effects.keys()) != metric_ids:
        raise ValueError(f"{label} must include every scenario metric")


def validate_effect_metric_references(
    effects: Dict[str, int],
    metric_ids: Set[str],
    label: str,
) -> None:
    unknown_metric_ids = set(effects.keys()) - metric_ids

    if unknown_metric_ids:
        raise ValueError(f"{label} references unknown metrics: {sorted(unknown_metric_ids)}")


def validate_flags(flags: List[str], flag_ids: Set[str], label: str) -> None:
    ensure_unique(flags, label)
    unknown_flags = set(flags) - flag_ids

    if unknown_flags:
        raise ValueError(f"{label} references unknown flags: {sorted(unknown_flags)}")


def ensure_unique(values, label: str) -> None:
    values_list = list(values)

    if len(values_list) != len(set(values_list)):
        raise ValueError(f"{label} must be unique")
