from __future__ import annotations

import json
from pathlib import Path
from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel

from incident_bridge.scenario import ScenarioDraft


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SCENARIO_PATH = REPO_ROOT / "scenarios" / "friday_pay_run.json"


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: Literal["incident-bridge-api"]


class ScenarioSummaryResponse(BaseModel):
    id: str
    title: str
    version: str
    status: str
    roles: list[str]
    metrics: list[str]
    quick_rounds: int
    standard_rounds: int


def create_app() -> FastAPI:
    app = FastAPI(
        title="Incident Bridge API",
        summary="Authoritative API skeleton for the Incident Bridge tabletop exercise.",
        version="0.1.0",
    )

    @app.get("/healthz", response_model=HealthResponse)
    def healthz() -> HealthResponse:
        return HealthResponse(status="ok", service="incident-bridge-api")

    @app.get("/api/scenario", response_model=ScenarioSummaryResponse)
    def scenario_summary() -> ScenarioSummaryResponse:
        scenario = load_default_scenario()

        return ScenarioSummaryResponse(
            id=scenario.id,
            title=scenario.title,
            version=scenario.version,
            status=scenario.status,
            roles=[role.name for role in scenario.roles],
            metrics=[metric.name for metric in scenario.metrics],
            quick_rounds=len(scenario.modes.quick.round_ids),
            standard_rounds=len(scenario.modes.standard.round_ids),
        )

    return app


def load_default_scenario() -> ScenarioDraft:
    payload = json.loads(DEFAULT_SCENARIO_PATH.read_text(encoding="utf-8"))
    return ScenarioDraft.model_validate(payload)


app = create_app()
