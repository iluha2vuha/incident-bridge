from __future__ import annotations

import secrets
import string
import json
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from pathlib import Path
from typing import Callable, Literal, Optional

from pydantic import BaseModel, Field, field_validator

from incident_bridge.engine import (
    AcceptedVote,
    GameEngineError,
    GameEngineErrorCode,
    GamePhase,
    RoundResult,
    calculate_round_result,
    choice_for_role,
    initial_metric_values,
    transition_phase,
)
from incident_bridge.scenario import ScenarioDraft, ScenarioRound


MAX_PARTICIPANTS = 9
SESSION_TTL = timedelta(hours=2)
ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
NICKNAME_ALLOWED = set(string.ascii_letters + string.digits + " .'-")
REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SCENARIO_PATH = REPO_ROOT / "scenarios" / "friday_pay_run.json"
SessionPhase = GamePhase


@dataclass(frozen=True)
class SessionRole:
    id: str
    name: str
    briefing: str


@dataclass(frozen=True)
class TimelineEntry:
    round_number: int
    round_id: str
    title: str
    decisions: dict[str, str]
    outcome: str
    learning_point: str


class SessionErrorCode(str, Enum):
    INVALID_ROOM_CODE = "invalid_room_code"
    CLOSED_ROOM = "closed_room"
    EXPIRED_ROOM = "expired_room"
    ROOM_FULL = "room_full"
    INVALID_NICKNAME = "invalid_nickname"
    INVALID_ROLE = "invalid_role"
    INVALID_CHOICE = "invalid_choice"
    DUPLICATE_VOTE = "duplicate_vote"
    STALE_ROUND = "stale_round_id"
    VOTE_AFTER_LOCK = "vote_after_lock"
    PERMISSION_DENIED = "permission_denied"
    ROLE_SELECTION_LOCKED = "role_selection_locked"
    ROUND_NOT_OPEN = "round_not_open"
    ROUND_NOT_LOCKED = "round_not_locked"
    NO_NEXT_ROUND = "no_next_round"
    SESSION_NOT_FOUND = "session_not_found"
    START_BLOCKED = "start_blocked"
    TIE_REQUIRES_RESOLUTION = "tie_requires_resolution"


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
    phase: SessionPhase
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


class FacilitatorTokenRequest(BaseModel):
    facilitator_token: str


class SubmitVoteRequest(BaseModel):
    participant_token: str
    round_id: str = Field(min_length=1)
    choice_id: str = Field(min_length=1)


class ReconnectSessionRequest(BaseModel):
    facilitator_token: Optional[str] = None
    participant_token: Optional[str] = None


class ReconnectSessionResponse(BaseModel):
    actor: Literal["facilitator", "participant"]
    participant_id: Optional[str] = None
    participant_name: Optional[str] = None
    lobby: LobbySnapshot


class ResolveTieRequest(BaseModel):
    facilitator_token: str
    role_id: str = Field(min_length=1)
    choice_id: str = Field(min_length=1)


class RoundChoiceView(BaseModel):
    id: str
    label: str


class ParticipantRoundRoleView(BaseModel):
    id: str
    name: str
    briefing: str
    private_information: str
    choices: list[RoundChoiceView]


class RoundResultChoiceView(BaseModel):
    role_id: str
    role_name: str
    choice_id: str
    choice_label: str


class MetricDeltaView(BaseModel):
    id: str
    name: str
    delta: int
    value: int


class FinalMetricView(BaseModel):
    id: str
    name: str
    value: int
    trend: Literal["strong", "steady", "strained"]


class RoundResultView(BaseModel):
    public_consequence: str
    interaction_summaries: list[str]
    decisions: list[RoundResultChoiceView]
    metric_deltas: list[MetricDeltaView]
    learning_point: str


class VoteProgressView(BaseModel):
    role_id: str
    role_name: str
    submitted: int
    expected: int


class RoundSnapshot(BaseModel):
    session_id: str
    phase: SessionPhase
    round_id: str
    round_number: int
    total_rounds: int
    has_next_round: bool
    title: str
    shared_update: str
    role: Optional[ParticipantRoundRoleView] = None
    vote_submitted: bool = False
    vote_progress: list[VoteProgressView] = Field(default_factory=list)
    facilitator_note: Optional[str] = None
    result: Optional[RoundResultView] = None


class TimelineEntryView(BaseModel):
    round_number: int
    round_id: str
    title: str
    decisions: list[RoundResultChoiceView]
    outcome: str
    learning_point: str


class DebriefSnapshot(BaseModel):
    session_id: str
    scenario_title: str
    mode: Literal["quick", "standard"]
    metrics: list[FinalMetricView]
    timeline: list[TimelineEntryView]
    learning_points: list[str]
    discussion_questions: list[str]


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
    scenario: ScenarioDraft
    expires_at: datetime
    roles: tuple[SessionRole, ...]
    max_participants: int = MAX_PARTICIPANTS
    phase: Literal[
        "lobby",
        "briefing",
        "round_open",
        "round_locked",
        "consequence_revealed",
    ] = "lobby"
    closed: bool = False
    participants: dict[str, Participant] = field(default_factory=dict)
    current_round_id: Optional[str] = None
    votes: dict[str, AcceptedVote] = field(default_factory=dict)
    tie_resolutions: dict[str, str] = field(default_factory=dict)
    round_result: Optional[RoundResult] = None
    flags: set[str] = field(default_factory=set)
    metric_values: dict[str, int] = field(default_factory=dict)
    timeline: list[TimelineEntry] = field(default_factory=list)

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
        scenarios: Optional[dict[str, ScenarioDraft]] = None,
    ) -> None:
        self._now = now or (lambda: datetime.now(timezone.utc))
        self._join_url_base = join_url_base
        self._scenarios = scenarios or load_builtin_scenarios()
        self._sessions: dict[str, GameSession] = {}
        self._room_codes: dict[str, str] = {}

    def create_session(
        self,
        *,
        scenario_id: str,
        mode: Literal["quick", "standard"],
    ) -> CreateSessionResponse:
        scenario = self._scenarios.get(scenario_id)

        if not scenario:
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
            scenario=scenario,
            expires_at=self._now() + SESSION_TTL,
            roles=tuple(
                SessionRole(id=role.id, name=role.name, briefing=role.briefing)
                for role in scenario.roles
            ),
            metric_values=initial_metric_values(scenario),
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
        self._transition_session(session, "closed")
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

        self._transition_session(session, "briefing")
        return session.snapshot()

    def open_round(self, session_id: str, facilitator_token: str) -> RoundSnapshot:
        session = self._session(session_id)
        self._ensure_facilitator(session, facilitator_token)
        self._ensure_not_expired(session)

        if session.closed:
            raise SessionError(SessionErrorCode.CLOSED_ROOM, "Room is closed.", 410)

        if session.phase == "lobby":
            raise SessionError(
                SessionErrorCode.ROUND_NOT_OPEN,
                "Exercise must be started before opening a round.",
                400,
            )

        if session.current_round_id is None:
            session.current_round_id = self._round_ids(session)[0]
            session.votes.clear()
            session.tie_resolutions.clear()
            session.round_result = None

        if session.phase == "briefing":
            self._transition_session(session, "round_open")

        return self.round_for_token(session_id, facilitator_token=facilitator_token)

    def round_for_token(
        self,
        session_id: str,
        *,
        facilitator_token: Optional[str] = None,
        participant_token: Optional[str] = None,
    ) -> RoundSnapshot:
        session = self._session(session_id)
        self._ensure_not_expired(session)

        if session.closed:
            raise SessionError(SessionErrorCode.CLOSED_ROOM, "Room is closed.", 410)

        participant: Optional[Participant] = None

        if facilitator_token:
            self._ensure_facilitator(session, facilitator_token)
        elif participant_token:
            participant = self._participant_for_token(session, participant_token)
        else:
            raise SessionError(SessionErrorCode.PERMISSION_DENIED, "Permission denied.", 403)

        round_ = self._current_round(session)
        return self._round_snapshot(session, round_, participant)

    def submit_vote(
        self,
        session_id: str,
        *,
        participant_token: str,
        round_id: str,
        choice_id: str,
    ) -> RoundSnapshot:
        session = self._session(session_id)
        self._ensure_not_expired(session)

        if session.closed:
            raise SessionError(SessionErrorCode.CLOSED_ROOM, "Room is closed.", 410)

        if session.phase != "round_open":
            raise SessionError(SessionErrorCode.VOTE_AFTER_LOCK, "Voting is not open.", 409)

        if round_id != session.current_round_id:
            raise SessionError(SessionErrorCode.STALE_ROUND, "Round ID is stale.", 409)

        participant = self._participant_for_token(session, participant_token)

        if participant.id in session.votes:
            raise SessionError(
                SessionErrorCode.DUPLICATE_VOTE,
                "Vote has already been accepted.",
                409,
            )

        if not participant.role_id:
            raise SessionError(SessionErrorCode.INVALID_ROLE, "Participant has no role.", 400)

        round_ = self._current_round(session)

        try:
            choice_for_role(round_, participant.role_id, choice_id)
        except GameEngineError as error:
            raise self._session_error_from_engine_error(error) from error

        session.votes[participant.id] = AcceptedVote(
            participant_id=participant.id,
            role_id=participant.role_id,
            choice_id=choice_id,
        )

        return self._round_snapshot(session, round_, participant)

    def lock_round(self, session_id: str, facilitator_token: str) -> RoundSnapshot:
        session = self._session(session_id)
        self._ensure_facilitator(session, facilitator_token)
        self._ensure_not_expired(session)

        if session.closed:
            raise SessionError(SessionErrorCode.CLOSED_ROOM, "Room is closed.", 410)

        if session.phase != "round_open":
            raise SessionError(SessionErrorCode.ROUND_NOT_OPEN, "Round is not open.", 409)

        round_ = self._current_round(session)

        try:
            session.round_result = calculate_round_result(
                scenario=session.scenario,
                round_=round_,
                role_ids=[role.id for role in session.roles],
                votes=list(session.votes.values()),
                metric_values=session.metric_values,
                flags=session.flags,
                tie_resolutions=session.tie_resolutions,
            )
        except GameEngineError as error:
            raise self._session_error_from_engine_error(error) from error

        session.metric_values = session.round_result.metric_values
        session.flags = session.round_result.flags
        self._record_timeline_entry(session, round_)
        self._transition_session(session, "round_locked")

        return self._round_snapshot(session, round_, None)

    def reveal_round(self, session_id: str, facilitator_token: str) -> RoundSnapshot:
        session = self._session(session_id)
        self._ensure_facilitator(session, facilitator_token)
        self._ensure_not_expired(session)

        if session.closed:
            raise SessionError(SessionErrorCode.CLOSED_ROOM, "Room is closed.", 410)

        if session.phase != "round_locked":
            raise SessionError(SessionErrorCode.ROUND_NOT_LOCKED, "Round is not locked.", 409)

        if session.round_result is None:
            raise SessionError(SessionErrorCode.ROUND_NOT_LOCKED, "Round result is missing.", 409)

        self._transition_session(session, "consequence_revealed")
        return self._round_snapshot(session, self._current_round(session), None)

    def debrief_for_token(
        self,
        session_id: str,
        *,
        facilitator_token: Optional[str] = None,
        participant_token: Optional[str] = None,
    ) -> DebriefSnapshot:
        session = self._session(session_id)
        self._ensure_not_expired(session)
        self._ensure_actor(session, facilitator_token, participant_token)

        return self._debrief_snapshot(session)

    def advance_round(self, session_id: str, facilitator_token: str) -> RoundSnapshot:
        session = self._session(session_id)
        self._ensure_facilitator(session, facilitator_token)
        self._ensure_not_expired(session)

        if session.closed:
            raise SessionError(SessionErrorCode.CLOSED_ROOM, "Room is closed.", 410)

        if session.phase != "consequence_revealed":
            raise SessionError(
                SessionErrorCode.ROUND_NOT_LOCKED,
                "Round result must be revealed before advancing.",
                409,
            )

        round_ids = self._round_ids(session)
        current_round_id = session.current_round_id

        if current_round_id is None:
            raise SessionError(SessionErrorCode.ROUND_NOT_OPEN, "Round is not open.", 404)

        current_index = round_ids.index(current_round_id)

        if current_index >= len(round_ids) - 1:
            raise SessionError(
                SessionErrorCode.NO_NEXT_ROUND,
                "No next round is available.",
                409,
            )

        session.current_round_id = round_ids[current_index + 1]
        session.votes.clear()
        session.tie_resolutions.clear()
        session.round_result = None
        self._transition_session(session, "briefing")
        return self._round_snapshot(session, self._current_round(session), None)

    def reconnect_session(
        self,
        session_id: str,
        *,
        facilitator_token: Optional[str] = None,
        participant_token: Optional[str] = None,
    ) -> ReconnectSessionResponse:
        session = self._session(session_id)
        self._ensure_not_expired(session)

        if facilitator_token:
            self._ensure_facilitator(session, facilitator_token)
            return ReconnectSessionResponse(actor="facilitator", lobby=session.snapshot())

        if participant_token:
            participant = self._participant_for_token(session, participant_token)
            return ReconnectSessionResponse(
                actor="participant",
                participant_id=participant.id,
                participant_name=participant.nickname,
                lobby=session.snapshot(),
            )

        raise SessionError(SessionErrorCode.PERMISSION_DENIED, "Permission denied.", 403)

    def resolve_tie(
        self,
        session_id: str,
        *,
        facilitator_token: str,
        role_id: str,
        choice_id: str,
    ) -> RoundSnapshot:
        session = self._session(session_id)
        self._ensure_facilitator(session, facilitator_token)
        self._ensure_not_expired(session)

        if session.closed:
            raise SessionError(SessionErrorCode.CLOSED_ROOM, "Room is closed.", 410)

        if session.phase != "round_open":
            raise SessionError(SessionErrorCode.ROUND_NOT_OPEN, "Round is not open.", 409)

        round_ = self._current_round(session)

        try:
            choice_for_role(round_, role_id, choice_id)
        except GameEngineError as error:
            raise self._session_error_from_engine_error(error) from error

        tied_choice_ids = self._tied_choice_ids(session, role_id)

        if choice_id not in tied_choice_ids:
            raise SessionError(
                SessionErrorCode.INVALID_CHOICE,
                "Tie resolution must choose one of the tied choices.",
                400,
            )

        session.tie_resolutions[role_id] = choice_id
        return self._round_snapshot(session, round_, None)

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

    def _round_snapshot(
        self,
        session: GameSession,
        round_: ScenarioRound,
        participant: Optional[Participant],
    ) -> RoundSnapshot:
        round_ids = self._round_ids(session)
        role = None
        vote_submitted = False

        if participant is not None:
            if not participant.role_id:
                raise SessionError(SessionErrorCode.INVALID_ROLE, "Participant has no role.", 400)

            session_role = self._role(session, participant.role_id)
            role = ParticipantRoundRoleView(
                id=session_role.id,
                name=session_role.name,
                briefing=session_role.briefing,
                private_information=round_.role_information[session_role.id],
                choices=[
                    RoundChoiceView(id=choice.id, label=choice.label)
                    for choice in round_.choices[session_role.id]
                ],
            )
            vote_submitted = participant.id in session.votes

        return RoundSnapshot(
            session_id=session.id,
            phase="closed" if session.closed else session.phase,
            round_id=round_.id,
            round_number=round_ids.index(round_.id) + 1,
            total_rounds=len(round_ids),
            has_next_round=round_ids.index(round_.id) < len(round_ids) - 1,
            title=round_.title,
            shared_update=round_.shared_update,
            role=role,
            vote_submitted=vote_submitted,
            vote_progress=self._vote_progress(session),
            facilitator_note=None if participant is not None else round_.facilitator_note,
            result=(
                self._result_view(session, round_)
                if session.round_result
                and (participant is None or session.phase == "consequence_revealed")
                else None
            ),
        )

    def _vote_progress(self, session: GameSession) -> list[VoteProgressView]:
        expected_counts = session.role_counts()
        submitted_counts = {role.id: 0 for role in session.roles}

        for vote in session.votes.values():
            submitted_counts[vote.role_id] = submitted_counts.get(vote.role_id, 0) + 1

        return [
            VoteProgressView(
                role_id=role.id,
                role_name=role.name,
                submitted=submitted_counts[role.id],
                expected=expected_counts[role.id],
            )
            for role in session.roles
        ]

    def _tied_choice_ids(self, session: GameSession, role_id: str) -> set[str]:
        counts: dict[str, int] = {}

        for vote in session.votes.values():
            if vote.role_id == role_id:
                counts[vote.choice_id] = counts.get(vote.choice_id, 0) + 1

        if not counts:
            return set()

        top_count = max(counts.values())
        top_choices = {choice_id for choice_id, count in counts.items() if count == top_count}

        if len(top_choices) < 2:
            return set()

        return top_choices

    def _result_view(self, session: GameSession, round_: ScenarioRound) -> RoundResultView:
        if session.round_result is None:
            raise SessionError(SessionErrorCode.ROUND_NOT_LOCKED, "Round result is missing.", 409)

        decisions = []

        for role in session.roles:
            decision = session.round_result.decisions[role.id]
            choice = choice_for_role(round_, role.id, decision.choice_id)
            decisions.append(
                RoundResultChoiceView(
                    role_id=role.id,
                    role_name=role.name,
                    choice_id=choice.id,
                    choice_label=choice.label,
                )
            )

        return RoundResultView(
            public_consequence=round_.public_consequence,
            interaction_summaries=session.round_result.interaction_summaries,
            decisions=decisions,
            metric_deltas=[
                MetricDeltaView(
                    id=metric.id,
                    name=metric.name,
                    delta=session.round_result.metric_deltas[metric.id],
                    value=session.round_result.metric_values[metric.id],
                )
                for metric in session.scenario.metrics
            ],
            learning_point=round_.learning_point,
        )

    def _record_timeline_entry(self, session: GameSession, round_: ScenarioRound) -> None:
        if session.round_result is None:
            return

        round_ids = self._round_ids(session)

        session.timeline = [
            entry for entry in session.timeline if entry.round_id != round_.id
        ]
        session.timeline.append(
            TimelineEntry(
                round_number=round_ids.index(round_.id) + 1,
                round_id=round_.id,
                title=round_.title,
                decisions={
                    role_id: decision.choice_id
                    for role_id, decision in session.round_result.decisions.items()
                },
                outcome=round_.public_consequence,
                learning_point=round_.learning_point,
            )
        )

    def _debrief_snapshot(self, session: GameSession) -> DebriefSnapshot:
        return DebriefSnapshot(
            session_id=session.id,
            scenario_title=session.scenario.title,
            mode=session.mode,
            metrics=[
                FinalMetricView(
                    id=metric.id,
                    name=metric.name,
                    value=session.metric_values.get(metric.id, metric.initial_value),
                    trend=self._metric_trend(
                        session.metric_values.get(metric.id, metric.initial_value),
                    ),
                )
                for metric in session.scenario.metrics
            ],
            timeline=[
                TimelineEntryView(
                    round_number=entry.round_number,
                    round_id=entry.round_id,
                    title=entry.title,
                    decisions=self._timeline_decisions(session, entry),
                    outcome=entry.outcome,
                    learning_point=entry.learning_point,
                )
                for entry in sorted(session.timeline, key=lambda item: item.round_number)
            ],
            learning_points=[
                self._round_by_id(session, round_id).learning_point
                for round_id in self._round_ids(session)
            ],
            discussion_questions=[
                question
                for round_id in self._round_ids(session)
                for question in self._round_by_id(session, round_id).discussion_questions
            ]
            + session.scenario.final_debrief,
        )

    def _timeline_decisions(
        self,
        session: GameSession,
        entry: TimelineEntry,
    ) -> list[RoundResultChoiceView]:
        round_ = self._round_by_id(session, entry.round_id)
        decisions = []

        for role in session.roles:
            choice_id = entry.decisions[role.id]
            choice = choice_for_role(round_, role.id, choice_id)
            decisions.append(
                RoundResultChoiceView(
                    role_id=role.id,
                    role_name=role.name,
                    choice_id=choice.id,
                    choice_label=choice.label,
                )
            )

        return decisions

    def _metric_trend(self, value: int) -> Literal["strong", "steady", "strained"]:
        if value >= 70:
            return "strong"

        if value >= 45:
            return "steady"

        return "strained"

    def _round_ids(self, session: GameSession) -> list[str]:
        mode = (
            session.scenario.modes.quick
            if session.mode == "quick"
            else session.scenario.modes.standard
        )
        return mode.round_ids

    def _current_round(self, session: GameSession) -> ScenarioRound:
        if session.current_round_id is None:
            raise SessionError(SessionErrorCode.ROUND_NOT_OPEN, "Round is not open.", 404)

        return self._round_by_id(session, session.current_round_id)

    def _round_by_id(self, session: GameSession, round_id: str) -> ScenarioRound:
        for round_ in session.scenario.rounds:
            if round_.id == round_id:
                return round_

        raise SessionError(SessionErrorCode.ROUND_NOT_OPEN, "Round is not available.", 404)

    def _role(self, session: GameSession, role_id: str) -> SessionRole:
        for role in session.roles:
            if role.id == role_id:
                return role

        raise SessionError(SessionErrorCode.INVALID_ROLE, "Role was not recognised.", 400)

    def _transition_session(self, session: GameSession, target: SessionPhase) -> None:
        if target == "closed":
            session.closed = True
            return

        try:
            session.phase = transition_phase(session.phase, target)
        except GameEngineError as error:
            raise self._session_error_from_engine_error(error) from error

    def _session_error_from_engine_error(self, error: GameEngineError) -> SessionError:
        if error.code == GameEngineErrorCode.INVALID_CHOICE:
            return SessionError(SessionErrorCode.INVALID_CHOICE, error.message, 400)

        if error.code == GameEngineErrorCode.TIE_REQUIRES_RESOLUTION:
            return SessionError(SessionErrorCode.TIE_REQUIRES_RESOLUTION, error.message, 409)

        if error.code == GameEngineErrorCode.MISSING_ROLE_VOTE:
            return SessionError(SessionErrorCode.START_BLOCKED, error.message, 400)

        return SessionError(SessionErrorCode.PERMISSION_DENIED, error.message, 409)

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

        if session.phase != "lobby":
            raise SessionError(SessionErrorCode.CLOSED_ROOM, "Room is already in progress.", 409)

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


def load_builtin_scenarios() -> dict[str, ScenarioDraft]:
    payload = json.loads(DEFAULT_SCENARIO_PATH.read_text(encoding="utf-8"))
    scenario = ScenarioDraft.model_validate(payload)
    return {scenario.id: scenario}
