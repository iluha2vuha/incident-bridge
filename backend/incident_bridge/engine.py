from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from enum import Enum
from typing import Literal

from incident_bridge.scenario import ScenarioChoice, ScenarioDraft, ScenarioRound


GamePhase = Literal[
    "lobby",
    "briefing",
    "round_open",
    "round_locked",
    "consequence_revealed",
    "closed",
]


class GameEngineErrorCode(str, Enum):
    INVALID_CHOICE = "invalid_choice"
    INVALID_TRANSITION = "invalid_transition"
    MISSING_ROLE_VOTE = "missing_role_vote"
    TIE_REQUIRES_RESOLUTION = "tie_requires_resolution"


class GameEngineError(Exception):
    def __init__(self, code: GameEngineErrorCode, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass(frozen=True)
class AcceptedVote:
    participant_id: str
    role_id: str
    choice_id: str


@dataclass(frozen=True)
class RoundDecision:
    role_id: str
    choice_id: str


@dataclass(frozen=True)
class RoundResult:
    decisions: dict[str, RoundDecision]
    metric_deltas: dict[str, int]
    metric_values: dict[str, int]
    flags: set[str]
    interaction_summaries: list[str]


VALID_TRANSITIONS: dict[str, set[str]] = {
    "lobby": {"briefing", "closed"},
    "briefing": {"round_open", "closed"},
    "round_open": {"round_locked", "closed"},
    "round_locked": {"consequence_revealed", "closed"},
    "consequence_revealed": {"briefing", "closed"},
    "closed": set(),
}


def transition_phase(current: GamePhase, target: GamePhase) -> GamePhase:
    if target not in VALID_TRANSITIONS[current]:
        raise GameEngineError(
            GameEngineErrorCode.INVALID_TRANSITION,
            f"Cannot transition from {current} to {target}.",
        )

    return target


def initial_metric_values(scenario: ScenarioDraft) -> dict[str, int]:
    return {metric.id: metric.initial_value for metric in scenario.metrics}


def aggregate_role_decisions(
    *,
    role_ids: list[str],
    votes: list[AcceptedVote],
) -> dict[str, RoundDecision]:
    decisions: dict[str, RoundDecision] = {}

    for role_id in role_ids:
        role_votes = [vote.choice_id for vote in votes if vote.role_id == role_id]

        if not role_votes:
            raise GameEngineError(
                GameEngineErrorCode.MISSING_ROLE_VOTE,
                f"{role_id} needs at least one vote before locking.",
            )

        counts = Counter(role_votes)
        top_count = max(counts.values())
        top_choices = [choice_id for choice_id, count in counts.items() if count == top_count]

        if len(top_choices) > 1:
            raise GameEngineError(
                GameEngineErrorCode.TIE_REQUIRES_RESOLUTION,
                f"{role_id} has a tied vote.",
            )

        decisions[role_id] = RoundDecision(role_id=role_id, choice_id=top_choices[0])

    return decisions


def calculate_round_result(
    *,
    scenario: ScenarioDraft,
    round_: ScenarioRound,
    role_ids: list[str],
    votes: list[AcceptedVote],
    metric_values: dict[str, int],
    flags: set[str],
) -> RoundResult:
    decisions = aggregate_role_decisions(role_ids=role_ids, votes=votes)
    metric_deltas = {metric.id: 0 for metric in scenario.metrics}
    result_flags = set(flags)

    for decision in decisions.values():
        choice = choice_for_role(round_, decision.role_id, decision.choice_id)
        add_effects(metric_deltas, choice.effects)
        result_flags.update(choice.adds_flags)

    interaction_summaries: list[str] = []

    for rule in round_.interaction_rules:
        conditions = rule.conditions

        if conditions.choices and not all(
            decisions[role_id].choice_id == choice_id
            for role_id, choice_id in conditions.choices.items()
        ):
            continue

        if conditions.present_flags and not set(conditions.present_flags).issubset(result_flags):
            continue

        if conditions.absent_flags and set(conditions.absent_flags).intersection(result_flags):
            continue

        add_effects(metric_deltas, rule.effects)
        result_flags.update(rule.adds_flags)
        interaction_summaries.append(rule.result_text)

    next_metric_values = {
        metric.id: clamp_metric(
            metric_values.get(metric.id, metric.initial_value) + metric_deltas[metric.id],
            minimum=metric.minimum,
            maximum=metric.maximum,
        )
        for metric in scenario.metrics
    }

    return RoundResult(
        decisions=decisions,
        metric_deltas=metric_deltas,
        metric_values=next_metric_values,
        flags=result_flags,
        interaction_summaries=interaction_summaries,
    )


def choice_for_role(round_: ScenarioRound, role_id: str, choice_id: str) -> ScenarioChoice:
    choices = round_.choices.get(role_id, [])

    for choice in choices:
        if choice.id == choice_id:
            return choice

    raise GameEngineError(
        GameEngineErrorCode.INVALID_CHOICE,
        "Choice was not recognised.",
    )


def add_effects(target: dict[str, int], effects: dict[str, int]) -> None:
    for metric_id, value in effects.items():
        target[metric_id] = target.get(metric_id, 0) + value


def clamp_metric(value: int, *, minimum: int, maximum: int) -> int:
    return min(maximum, max(minimum, value))
