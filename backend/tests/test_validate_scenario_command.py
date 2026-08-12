from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = REPO_ROOT / "scripts" / "validate_scenario.py"


class ValidateScenarioCommandTest(unittest.TestCase):
    def test_validates_default_friday_pay_run_scenario(self) -> None:
        result = subprocess.run(
            [sys.executable, str(SCRIPT_PATH)],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Validated scenarios/friday_pay_run.json", result.stdout)
        self.assertIn("The Friday Pay Run", result.stdout)

    def test_reports_schema_errors_for_invalid_scenario(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            invalid_scenario_path = Path(temporary_directory) / "invalid_scenario.json"
            invalid_scenario_path.write_text(
                json.dumps(
                    {
                        "schema_version": 1,
                        "id": "invalid",
                        "version": "0.0.0",
                        "status": "draft",
                    }
                ),
                encoding="utf-8",
            )

            result = subprocess.run(
                [sys.executable, str(SCRIPT_PATH), str(invalid_scenario_path)],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )

        self.assertEqual(result.returncode, 1)
        self.assertIn("Scenario validation failed:", result.stderr)
        self.assertIn("Field required", result.stderr)


if __name__ == "__main__":
    unittest.main()
