from __future__ import annotations

import json
from pathlib import Path
from typing import Literal, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from incident_bridge.scenario import ScenarioDraft
from incident_bridge.sessions import (
    CloseSessionRequest,
    CreateSessionRequest,
    CreateSessionResponse,
    JoinSessionRequest,
    JoinSessionResponse,
    LobbySnapshot,
    SessionError,
    SessionErrorCode,
    SessionManager,
    session_error_payload,
)


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


class LobbyHub:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = {}

    async def connect(self, session_id: str, websocket: WebSocket, snapshot: LobbySnapshot) -> None:
        await websocket.accept()
        self._connections.setdefault(session_id, set()).add(websocket)
        await websocket.send_json({"type": "lobby:updated", "lobby": snapshot.model_dump()})

    async def disconnect(self, session_id: str, websocket: WebSocket) -> None:
        connections = self._connections.get(session_id)

        if not connections:
            return

        connections.discard(websocket)

        if not connections:
            del self._connections[session_id]

    async def broadcast(self, snapshot: LobbySnapshot) -> None:
        connections = list(self._connections.get(snapshot.session_id, set()))

        for websocket in connections:
            try:
                await websocket.send_json(
                    {"type": "lobby:updated", "lobby": snapshot.model_dump()},
                )
            except RuntimeError:
                await self.disconnect(snapshot.session_id, websocket)


def create_app(
    *,
    session_manager: Optional[SessionManager] = None,
    lobby_hub: Optional[LobbyHub] = None,
) -> FastAPI:
    manager = session_manager or SessionManager()
    hub = lobby_hub or LobbyHub()

    app = FastAPI(
        title="Incident Bridge API",
        summary="Authoritative API skeleton for the Incident Bridge tabletop exercise.",
        version="0.1.0",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(SessionError)
    async def handle_session_error(_request, error: SessionError) -> JSONResponse:
        return JSONResponse(
            status_code=error.status_code,
            content={"detail": session_error_payload(error)},
        )

    @app.exception_handler(RequestValidationError)
    async def handle_request_validation(_request, error: RequestValidationError) -> JSONResponse:
        error_locations = [validation_error.get("loc", ()) for validation_error in error.errors()]
        invalid_nickname = any("nickname" in location for location in error_locations)
        invalid_room_code = any("room_code" in location for location in error_locations)

        if invalid_nickname:
            code = SessionErrorCode.INVALID_NICKNAME
            message = "Nickname must be 1 to 24 supported characters."
        elif invalid_room_code:
            code = SessionErrorCode.INVALID_ROOM_CODE
            message = "Room code was not recognised."
        else:
            code = SessionErrorCode.PERMISSION_DENIED
            message = "Invalid request."

        return JSONResponse(
            status_code=400,
            content={"detail": {"code": code.value, "message": message}},
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

    @app.post("/api/sessions", response_model=CreateSessionResponse)
    async def create_session(request: CreateSessionRequest) -> CreateSessionResponse:
        return manager.create_session(scenario_id=request.scenario_id, mode=request.mode)

    @app.post("/api/sessions/join", response_model=JoinSessionResponse)
    async def join_session(request: JoinSessionRequest) -> JoinSessionResponse:
        response = manager.join_session(request)
        await hub.broadcast(response.lobby)
        return response

    @app.get("/api/sessions/{session_id}/lobby", response_model=LobbySnapshot)
    async def get_lobby(
        session_id: str,
        facilitator_token: Optional[str] = None,
        participant_token: Optional[str] = None,
    ) -> LobbySnapshot:
        return manager.lobby_for_token(
            session_id,
            facilitator_token=facilitator_token,
            participant_token=participant_token,
        )

    @app.post("/api/sessions/{session_id}/close", response_model=LobbySnapshot)
    async def close_session(session_id: str, request: CloseSessionRequest) -> LobbySnapshot:
        snapshot = manager.close_session(session_id, request.facilitator_token)
        await hub.broadcast(snapshot)
        return snapshot

    @app.websocket("/ws/sessions/{session_id}/lobby")
    async def lobby_websocket(
        websocket: WebSocket,
        session_id: str,
        facilitator_token: Optional[str] = None,
        participant_token: Optional[str] = None,
    ) -> None:
        try:
            if facilitator_token:
                snapshot = manager.connect_facilitator(session_id, facilitator_token)
                participant_connected = False
            elif participant_token:
                snapshot = manager.connect_participant(session_id, participant_token)
                participant_connected = True
            else:
                raise SessionError(
                    SessionErrorCode.PERMISSION_DENIED,
                    "Permission denied.",
                    403,
                )

            await hub.connect(session_id, websocket, snapshot)

            if participant_connected:
                await hub.broadcast(snapshot)

            while True:
                await websocket.receive_text()
        except SessionError as error:
            await websocket.close(code=1008, reason=error.code.value)
        except WebSocketDisconnect:
            pass
        finally:
            await hub.disconnect(session_id, websocket)

            if "participant_connected" in locals() and participant_connected and participant_token:
                snapshot = manager.disconnect_participant(session_id, participant_token)
                await hub.broadcast(snapshot)

    return app


def load_default_scenario() -> ScenarioDraft:
    payload = json.loads(DEFAULT_SCENARIO_PATH.read_text(encoding="utf-8"))
    return ScenarioDraft.model_validate(payload)


app = create_app()
