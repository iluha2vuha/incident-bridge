#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from json import JSONDecodeError
from pathlib import Path

from pydantic import ValidationError


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SCENARIO_PATH = REPO_ROOT / "scenarios" / "friday_pay_run.json"

sys.path.insert(0, str(REPO_ROOT / "backend"))

from incident_bridge.scenario import ScenarioDraft


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate an Incident Bridge scenario JSON file.",
    )
    parser.add_argument(
        "scenario_path",
        nargs="?",
        type=Path,
        default=DEFAULT_SCENARIO_PATH,
        help="Scenario JSON file to validate. Defaults to scenarios/friday_pay_run.json.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    scenario_path = args.scenario_path

    if not scenario_path.is_absolute():
        scenario_path = Path.cwd() / scenario_path

    try:
        payload = json.loads(scenario_path.read_text(encoding="utf-8"))
        scenario = ScenarioDraft.model_validate(payload)
    except FileNotFoundError:
        print(f"Scenario file not found: {format_path(scenario_path)}", file=sys.stderr)
        return 1
    except JSONDecodeError as error:
        location = f"{format_path(scenario_path)}:{error.lineno}:{error.colno}"
        print(f"Scenario JSON is invalid: {location} {error.msg}", file=sys.stderr)
        return 1
    except ValidationError as error:
        print(f"Scenario validation failed: {format_path(scenario_path)}", file=sys.stderr)
        print(error, file=sys.stderr)
        return 1

    print(
        f"Validated {format_path(scenario_path)}: {scenario.title} "
        f"({len(scenario.rounds)} rounds, {len(scenario.roles)} roles)"
    )
    return 0


def format_path(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


if __name__ == "__main__":
    raise SystemExit(main())
