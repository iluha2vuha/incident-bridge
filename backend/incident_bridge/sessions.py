from __future__ import annotations

import secrets
import string
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Callable, Literal, Optional, Sequence

from pydantic import BaseModel, Field, field_validator


MAX_PARTICIPANTS = 9
SESSION_TTL = timedelta(hours=2)
ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
NICKNAME_ALLOWED = set(string.ascii_letters + string.digits + " .'-")


@dataclass(frozen=True)
class SessionRole:
    id: str
    name: str
    briefing: str


DEFAULT_ROLES: tuple[SessionRole, ...] = (
    SessionRole(
        id="hr",
        name="HR",
        briefing=(
            "Protect employee information, keep payroll moving, support employee trust, "
            "verify sensitive requests, and escalate appropriately."
        ),
    ),
    SessionRole(
        id="it-helpdesk",
        name="IT Helpdesk",
        briefing=(
            "Verify identity, secure accounts, preserve evidence, contain compromise, "
            "investigate wider impact, and avoid unnecessary disruption."
        ),
    ),
)


class SessionErrorCode(str, Enum):
    INVALID_ROOM_CODE = "invalid_room_code"
    CLOSED_ROOM = "closed_room"
    EXPIRED_ROOM = "expired_room"
    ROOM_FULL = "room_full"
    INVALID_NICKNAME = "invalid_nickname"
    INVALID_ROLE = "invalid_role"
    PERMISSION_DENIED = "permission_denied"
    ROLE_SELECTION_LOCKED = "role_selection_locked"
    SESSION_NOT_FOUND = "session_not_found"
    START_BLOCKED = "start_blocked"


class SessionError(Exception):
    def __init__(self, code: SessionErrorCode, message: str, status_code: int) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


class ParticipantView(BaseModel):
    id: str
    nickname: str
    role_id: Optional[str]
    status: Literal["connected", "disconnected"]


class RoleView(BaseModel):
    id: str
    name: str
    briefing: str


class LobbySnapshot(BaseModel):
    session_id: str
    room_code: str
    phase: Literal["lobby", "briefing", "closed"]
    scenario_id: str
    mode: Literal["quick", "standard"]
    max_participants: int
    participant_count: int
    roles: list[RoleView]
    role_counts: dict[str, int]
    participants: list[ParticipantView]
    warning: str = ""


class CreateSessionRequest(BaseModel):
    scenario_id: str = "friday-pay-run"
    mode: Literal["quick", "standard"] = "standard"


class CreateSessionResponse(BaseModel):
    session_id: str
    room_code: str
    facilitator_token: str
    join_url: str
    lobby: LobbySnapshot


class JoinSessionRequest(BaseModel):
    room_code: str = Field(min_length=1)
    nickname: str = Field(min_length=1, max_length=24)

    @field_validator("room_code")
    @classmethod
    def normalize_room_code(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("nickname")
    @classmethod
    def validate_nickname(cls, value: str) -> str:
        nickname = " ".join(value.strip().split())

        if not nickname:
            raise ValueError("nickname is required")

        if any(character not in NICKNAME_ALLOWED for character in nickname):
            raise ValueError("nickname contains unsupported characters")

        return nickname


class JoinSessionResponse(BaseModel):
    session_id: str
    participant_id: str
    participant_token: str
    lobby: LobbySnapshot


class CloseSessionRequest(BaseModel):
    facilitator_token: str


class SelectRoleRequest(BaseModel):
    participant_token: str
    role_id: str = Field(min_length=1)


class StartSessionRequest(BaseModel):
    facilitator_token: str


@dataclass
class Participant:
    id: str
    nickname: str
    token: str
    role_id: Optional[str] = None
    connected_count: int = 0

    @property
    def status(self) -> Literal["connected", "disconnected"]:
        if self.connected_count > 0:
            return "connected"

        return "disconnected"


@dataclass
class GameSession:
    id: str
    room_code: str
    facilitator_token: str
    scenario_id: str
    mode: Literal["quick", "standard"]
    expires_at: datetime
    roles: tuple[SessionRole, ...]
    max_participants: int = MAX_PARTICIPANTS
    phase: Literal["lobby", "briefing"] = "lobby"
    closed: bool = False
    participants: dict[str, Participant] = field(default_factory=dict)

    def snapshot(self) -> LobbySnapshot:
        role_counts = self.role_counts()
        warning = self._warning(role_counts)

        return LobbySnapshot(
            session_id=self.id,
            room_code=self.room_code,
            phase="closed" if self.closed else self.phase,
            scenario_id=self.scenario_id,
            mode=self.mode,
            max_participants=self.max_participants,
            participant_count=len(self.participants),
            roles=[
                RoleView(id=role.id, name=role.name, briefing=role.briefing)
                for role in self.roles
            ],
            role_counts=role_counts,
            participants=[
                ParticipantView(
                    id=participant.id,
                    nickname=participant.nickname,
                    role_id=participant.role_id,
                    status=participant.status,
                )
                for participant in self.participants.values()
            ],
            warning=warning,
        )

    def role_counts(self) -> dict[str, int]:
        counts = {role.id: 0 for role in self.roles}

        for participant in self.participants.values():
            if participant.role_id in counts:
                counts[participant.role_id] += 1

        return counts

    def _warning(self, role_counts: dict[str, int]) -> str:
        if len(self.participants) >= self.max_participants:
            return "Room is full."

        if not self.participants or self.closed:
            return ""

        unassigned_count = len(self.participants) - sum(role_counts.values())

        if unassigned_count == 1:
            return "1 participant still needs a role."

        if unassigned_count > 1:
            return f"{unassigned_count} participants still need a role."

        empty_roles = [role.name for role in self.roles if role_counts[role.id] == 0]

        if len(empty_roles) == 1:
            return f"{empty_roles[0]} has no participants."

        if len(empty_roles) > 1:
            return f"{', '.join(empty_roles)} have no participants."

        lowest_count = min(role_counts.values())
        highest_count = max(role_counts.values())

        if highest_count - lowest_count >= 3:
            role_summary = ", ".join(
                f"{role.name} {role_counts[role.id]}" for role in self.roles
            )
            return f"Role imbalance: {role_summary}."

        return ""


class SessionManager:
    def __init__(
        self,
        *,
        now: Optional[Callable[[], datetime]] = None,
        join_url_base: str = "http://localhost:5173/participant/join",
        available_roles: Sequence[SessionRole] = DEFAULT_ROLES,
    ) -> None:
        self._now = now or (lambda: datetime.now(timezone.utc))
        self._join_url_base = join_url_base
        self._available_roles = tuple(available_roles)
        self._sessions: dict[str, GameSession] = {}
        self._room_codes: dict[str, str] = {}

    def create_session(
        self,
        *,
        scenario_id: str,
        mode: Literal["quick", "standard"],
    ) -> CreateSessionResponse:
        if scenario_id != "friday-pay-run":
            raise SessionError(
                SessionErrorCode.SESSION_NOT_FOUND,
                "Scenario is not available.",
                404,
            )

        session = GameSession(
            id=secrets.token_urlsafe(12),
            room_code=self._generate_room_code(),
            facilitator_token=secrets.token_urlsafe(32),
            scenario_id=scenario_id,
            mode=mode,
            expires_at=self._now() + SESSION_TTL,
            roles=self._available_roles,
        )
        self._sessions[session.id] = session
        self._room_codes[session.room_code] = session.id

        return CreateSessionResponse(
            session_id=session.id,
            room_code=session.room_code,
            facilitator_token=session.facilitator_token,
            join_url=f"{self._join_url_base}?room={session.room_code}",
            lobby=session.snapshot(),
        )

    def join_session(self, request: JoinSessionRequest) -> JoinSessionResponse:
        session = self._session_for_room_code(request.room_code)
        self._ensure_joinable(session)

        participant = Participant(
            id=secrets.token_urlsafe(10),
            nickname=request.nickname,
            token=secrets.token_urlsafe(32),
        )
        session.participants[participant.id] = participant

        return JoinSessionResponse(
            session_id=session.id,
            participant_id=participant.id,
            participant_token=participant.token,
            lobby=session.snapshot(),
        )

    def close_session(self, session_id: str, facilitator_token: str) -> LobbySnapshot:
        session = self._session(session_id)
        self._ensure_facilitator(session, facilitator_token)
        session.closed = True
        return session.snapshot()

    def select_role(
        self,
        session_id: str,
        *,
        participant_token: str,
        role_id: str,
    ) -> LobbySnapshot:
        session = self._session(session_id)
        self._ensure_not_expired(session)

        if session.closed:
            raise SessionError(SessionErrorCode.CLOSED_ROOM, "Room is closed.", 410)

        if session.phase != "lobby":
            raise SessionError(
                SessionErrorCode.ROLE_SELECTION_LOCKED,
                "Role selection is locked.",
                409,
            )

        role_ids = {role.id for role in session.roles}

        if role_id not in role_ids:
            raise SessionError(SessionErrorCode.INVALID_ROLE, "Role was not recognised.", 400)

        participant = self._participant_for_token(session, participant_token)
        participant.role_id = role_id
        return session.snapshot()

    def start_session(self, session_id: str, facilitator_token: str) -> LobbySnapshot:
        session = self._session(session_id)
        self._ensure_facilitator(session, facilitator_token)
        self._ensure_not_expired(session)

        if session.closed:
            raise SessionError(SessionErrorCode.CLOSED_ROOM, "Room is closed.", 410)

        if session.phase != "lobby":
            return session.snapshot()

        role_counts = session.role_counts()
        unassigned_count = len(session.participants) - sum(role_counts.values())

        if len(session.participants) < 2:
            raise SessionError(
                SessionErrorCode.START_BLOCKED,
                "At least 2 participants are required.",
                400,
            )

        if unassigned_count > 0:
            raise SessionError(
                SessionErrorCode.START_BLOCKED,
                "Every participant needs a role before starting.",
                400,
            )

        if any(count == 0 for count in role_counts.values()):
            raise SessionError(
                SessionErrorCode.START_BLOCKED,
                "Each role needs at least one participant before starting.",
                400,
            )

        session.phase = "briefing"
        return session.snapshot()

    def lobby_for_token(
        self,
        session_id: str,
        *,
        facilitator_token: Optional[str] = None,
        participant_token: Optional[str] = None,
    ) -> LobbySnapshot:
        session = self._session(session_id)
        self._ensure_not_expired(session)
        self._ensure_actor(session, facilitator_token, participant_token)
        return session.snapshot()

    def connect_participant(self, session_id: str, participant_token: str) -> LobbySnapshot:
        session = self._session(session_id)
        participant = self._participant_for_token(session, participant_token)
        participant.connected_count += 1
        return session.snapshot()

    def disconnect_participant(self, session_id: str, participant_token: str) -> LobbySnapshot:
        session = self._session(session_id)
        participant = self._participant_for_token(session, participant_token)
        participant.connected_count = max(0, participant.connected_count - 1)
        return session.snapshot()

    def connect_facilitator(self, session_id: str, facilitator_token: str) -> LobbySnapshot:
        session = self._session(session_id)
        self._ensure_facilitator(session, facilitator_token)
        self._ensure_not_expired(session)
        return session.snapshot()

    def _session_for_room_code(self, room_code: str) -> GameSession:
        session_id = self._room_codes.get(room_code)

        if not session_id:
            raise SessionError(
                SessionErrorCode.INVALID_ROOM_CODE,
                "Room code was not recognised.",
                404,
            )

        return self._session(session_id)

    def _session(self, session_id: str) -> GameSession:
        session = self._sessions.get(session_id)

        if not session:
            raise SessionError(
                SessionErrorCode.SESSION_NOT_FOUND,
                "Session was not found.",
                404,
            )

        return session

    def _ensure_joinable(self, session: GameSession) -> None:
        self._ensure_not_expired(session)

        if session.closed:
            raise SessionError(SessionErrorCode.CLOSED_ROOM, "Room is closed.", 410)

        if len(session.participants) >= session.max_participants:
            raise SessionError(SessionErrorCode.ROOM_FULL, "Room is full.", 409)

    def _ensure_not_expired(self, session: GameSession) -> None:
        if self._now() >= session.expires_at:
            raise SessionError(SessionErrorCode.EXPIRED_ROOM, "Room has expired.", 410)

    def _ensure_actor(
        self,
        session: GameSession,
        facilitator_token: Optional[str],
        participant_token: Optional[str],
    ) -> None:
        if facilitator_token:
            self._ensure_facilitator(session, facilitator_token)
            return

        if participant_token:
            self._participant_for_token(session, participant_token)
            return

        raise SessionError(SessionErrorCode.PERMISSION_DENIED, "Permission denied.", 403)

    def _ensure_facilitator(self, session: GameSession, facilitator_token: str) -> None:
        if not secrets.compare_digest(session.facilitator_token, facilitator_token):
            raise SessionError(SessionErrorCode.PERMISSION_DENIED, "Permission denied.", 403)

    def _participant_for_token(self, session: GameSession, token: str) -> Participant:
        for participant in session.participants.values():
            if secrets.compare_digest(participant.token, token):
                return participant

        raise SessionError(SessionErrorCode.PERMISSION_DENIED, "Permission denied.", 403)

    def _generate_room_code(self) -> str:
        while True:
            room_code = "".join(secrets.choice(ROOM_CODE_ALPHABET) for _ in range(6))

            if room_code not in self._room_codes:
                return room_code


def session_error_payload(error: SessionError) -> dict[str, str]:
    return {"code": error.code.value, "message": error.message}
