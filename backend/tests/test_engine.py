from __future__ import annotations

import json
import unittest
from pathlib import Path

from incident_bridge.engine import (
    AcceptedVote,
    GameEngineError,
    aggregate_role_decisions,
    calculate_round_result,
    initial_metric_values,
    transition_phase,
)
from incident_bridge.scenario import ScenarioDraft


SCENARIO_PATH = Path(__file__).resolve().parents[2] / "scenarios" / "friday_pay_run.json"


class GameEngineTest(unittest.TestCase):
    def setUp(self) -> None:
        payload = json.loads(SCENARIO_PATH.read_text(encoding="utf-8"))
        self.scenario = ScenarioDraft.model_validate(payload)
        self.round = self.scenario.rounds[0]
        self.role_ids = [role.id for role in self.scenario.roles]

    def test_majority_vote_becomes_role_decision(self) -> None:
        decisions = aggregate_role_decisions(
            role_ids=self.role_ids,
            votes=[
                AcceptedVote("p1", "hr", "hr-r1-secure-contact-escalate"),
                AcceptedVote("p2", "hr", "hr-r1-secure-contact-escalate"),
                AcceptedVote("p3", "hr", "hr-r1-watch-for-pattern"),
                AcceptedVote("p4", "it-helpdesk", "it-r1-verify-and-review"),
            ],
        )

        self.assertEqual(decisions["hr"].choice_id, "hr-r1-secure-contact-escalate")
        self.assertEqual(decisions["it-helpdesk"].choice_id, "it-r1-verify-and-review")

    def test_tied_role_vote_requires_facilitator_resolution(self) -> None:
        with self.assertRaisesRegex(GameEngineError, "tied"):
            aggregate_role_decisions(
                role_ids=["hr"],
                votes=[
                    AcceptedVote("p1", "hr", "hr-r1-secure-contact-escalate"),
                    AcceptedVote("p2", "hr", "hr-r1-watch-for-pattern"),
                ],
            )

    def test_tie_resolution_supplies_department_decision(self) -> None:
        decisions = aggregate_role_decisions(
            role_ids=["hr"],
            votes=[
                AcceptedVote("p1", "hr", "hr-r1-secure-contact-escalate"),
                AcceptedVote("p2", "hr", "hr-r1-watch-for-pattern"),
            ],
            tie_resolutions={"hr": "hr-r1-watch-for-pattern"},
        )

        self.assertEqual(decisions["hr"].choice_id, "hr-r1-watch-for-pattern")

    def test_result_applies_choice_effects_interaction_rules_and_flags(self) -> None:
        result = calculate_round_result(
            scenario=self.scenario,
            round_=self.round,
            role_ids=self.role_ids,
            votes=[
                AcceptedVote("p1", "hr", "hr-r1-secure-contact-escalate"),
                AcceptedVote("p2", "it-helpdesk", "it-r1-verify-and-review"),
            ],
            metric_values=initial_metric_values(self.scenario),
            flags=set(),
        )

        self.assertEqual(result.metric_deltas["incident_control"], 27)
        self.assertEqual(result.metric_deltas["evidence_quality"], 28)
        self.assertIn("coordinated_response", result.flags)
        self.assertIn("connect the payroll message", result.interaction_summaries[0])

    def test_interaction_rules_can_depend_on_absent_flags(self) -> None:
        result = calculate_round_result(
            scenario=self.scenario,
            round_=self.round,
            role_ids=self.role_ids,
            votes=[
                AcceptedVote("p1", "hr", "hr-r1-reply-for-context"),
                AcceptedVote("p2", "it-helpdesk", "it-r1-reset-now"),
            ],
            metric_values=initial_metric_values(self.scenario),
            flags=set(),
        )

        self.assertEqual(result.metric_deltas["evidence_quality"], -13)
        self.assertIn("avoidable gaps", result.interaction_summaries[0])

    def test_metric_values_are_clamped_to_configured_bounds(self) -> None:
        result = calculate_round_result(
            scenario=self.scenario,
            round_=self.round,
            role_ids=self.role_ids,
            votes=[
                AcceptedVote("p1", "hr", "hr-r1-secure-contact-escalate"),
                AcceptedVote("p2", "it-helpdesk", "it-r1-verify-and-review"),
            ],
            metric_values={
                "incident_control": 95,
                "evidence_quality": 95,
                "business_continuity": 5,
                "employee_trust": 95,
            },
            flags=set(),
        )

        self.assertEqual(result.metric_values["incident_control"], 100)
        self.assertEqual(result.metric_values["evidence_quality"], 100)
        self.assertEqual(result.metric_values["business_continuity"], 0)
        self.assertEqual(result.metric_values["employee_trust"], 100)

    def test_invalid_state_transition_is_rejected(self) -> None:
        with self.assertRaisesRegex(GameEngineError, "Cannot transition"):
            transition_phase("lobby", "round_open")


if __name__ == "__main__":
    unittest.main()
