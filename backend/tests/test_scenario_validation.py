from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path
from typing import Any, Dict

from pydantic import ValidationError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from incident_bridge.scenario import ScenarioDraft


SCENARIO_PATH = Path(__file__).resolve().parents[2] / "scenarios" / "friday_pay_run.json"


def load_scenario() -> Dict[str, Any]:
    return json.loads(SCENARIO_PATH.read_text(encoding="utf-8"))


class ScenarioValidationTest(unittest.TestCase):
    def test_accepts_friday_pay_run_json_draft(self) -> None:
        scenario = ScenarioDraft.model_validate(load_scenario())

        self.assertEqual(scenario.id, "friday-pay-run")
        self.assertEqual(len(scenario.rounds), 5)
        self.assertEqual(
            scenario.modes.quick.round_ids,
            [
                "r1-suspicious-payroll-request",
                "r3-suspicious-mailbox-activity",
                "r5-recovery-and-communication",
            ],
        )

    def test_rejects_unknown_mode_round_id(self) -> None:
        scenario = load_scenario()
        scenario["modes"]["quick"]["round_ids"] = [
            "r1-suspicious-payroll-request",
            "missing-round",
        ]

        with self.assertRaisesRegex(ValidationError, "unknown round id"):
            ScenarioDraft.model_validate(scenario)

    def test_rejects_choice_missing_metric_effect(self) -> None:
        scenario = load_scenario()
        first_choice = scenario["rounds"][0]["choices"]["hr"][0]
        del first_choice["effects"]["employee_trust"]

        with self.assertRaisesRegex(ValidationError, "must include every scenario metric"):
            ScenarioDraft.model_validate(scenario)

    def test_rejects_unknown_choice_flag(self) -> None:
        scenario = load_scenario()
        scenario["rounds"][0]["choices"]["hr"][0]["adds_flags"] = ["not_a_declared_flag"]

        with self.assertRaisesRegex(ValidationError, "unknown flags"):
            ScenarioDraft.model_validate(scenario)

    def test_rejects_duplicate_declared_flags(self) -> None:
        scenario = load_scenario()
        scenario["flags"].append("evidence_preserved")

        with self.assertRaisesRegex(ValidationError, "flags must be unique"):
            ScenarioDraft.model_validate(scenario)

    def test_rejects_interaction_choice_for_wrong_role(self) -> None:
        scenario = load_scenario()
        first_rule = scenario["rounds"][0]["interaction_rules"][0]
        first_rule["conditions"]["choices"]["hr"] = "it-r1-verify-and-review"

        with self.assertRaisesRegex(ValidationError, "unknown choice for hr"):
            ScenarioDraft.model_validate(scenario)

    def test_rejects_missing_role_private_information(self) -> None:
        scenario = load_scenario()
        del scenario["rounds"][0]["role_information"]["it-helpdesk"]

        with self.assertRaisesRegex(ValidationError, "private information for every role"):
            ScenarioDraft.model_validate(scenario)


if __name__ == "__main__":
    unittest.main()
