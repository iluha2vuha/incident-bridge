from __future__ import annotations

import unittest
from datetime import datetime, timedelta, timezone

from incident_bridge.sessions import (
    JoinSessionRequest,
    SessionError,
    SessionManager,
)


class SessionManagerTest(unittest.TestCase):
    def test_creates_session_with_public_room_code_and_private_facilitator_token(self) -> None:
        manager = SessionManager()

        response = manager.create_session(scenario_id="friday-pay-run", mode="quick")

        self.assertEqual(len(response.room_code), 6)
        self.assertGreater(len(response.facilitator_token), 30)
        self.assertIn(response.room_code, response.join_url)
        self.assertEqual(response.lobby.participant_count, 0)
        self.assertEqual(response.lobby.role_counts, {"hr": 0, "it-helpdesk": 0})

    def test_joins_room_with_temporary_participant_token(self) -> None:
        manager = SessionManager()
        session = manager.create_session(scenario_id="friday-pay-run", mode="standard")

        response = manager.join_session(
            JoinSessionRequest(room_code=session.room_code.lower(), nickname="  Jordan   P.  "),
        )

        self.assertEqual(response.session_id, session.session_id)
        self.assertEqual(response.lobby.participant_count, 1)
        self.assertEqual(response.lobby.participants[0].nickname, "Jordan P.")
        self.assertGreater(len(response.participant_token), 30)
        self.assertEqual(response.lobby.warning, "1 participant still needs a role.")

    def test_selects_role_and_updates_role_counts(self) -> None:
        manager = SessionManager()
        session = manager.create_session(scenario_id="friday-pay-run", mode="standard")
        participant = manager.join_session(
            JoinSessionRequest(room_code=session.room_code, nickname="Jordan"),
        )

        snapshot = manager.select_role(
            session.session_id,
            participant_token=participant.participant_token,
            role_id="hr",
        )

        self.assertEqual(snapshot.participants[0].role_id, "hr")
        self.assertEqual(snapshot.role_counts, {"hr": 1, "it-helpdesk": 0})
        self.assertEqual(snapshot.warning, "IT Helpdesk has no participants.")

    def test_rejects_invalid_role(self) -> None:
        manager = SessionManager()
        session = manager.create_session(scenario_id="friday-pay-run", mode="standard")
        participant = manager.join_session(
            JoinSessionRequest(room_code=session.room_code, nickname="Jordan"),
        )

        with self.assertRaisesRegex(SessionError, "Role"):
            manager.select_role(
                session.session_id,
                participant_token=participant.participant_token,
                role_id="finance",
            )

    def test_starts_session_and_locks_role_selection(self) -> None:
        manager = SessionManager()
        session = manager.create_session(scenario_id="friday-pay-run", mode="standard")
        hr_participant = manager.join_session(
            JoinSessionRequest(room_code=session.room_code, nickname="Jordan"),
        )
        it_participant = manager.join_session(
            JoinSessionRequest(room_code=session.room_code, nickname="Morgan"),
        )
        manager.select_role(
            session.session_id,
            participant_token=hr_participant.participant_token,
            role_id="hr",
        )
        manager.select_role(
            session.session_id,
            participant_token=it_participant.participant_token,
            role_id="it-helpdesk",
        )

        started = manager.start_session(session.session_id, session.facilitator_token)

        self.assertEqual(started.phase, "briefing")

        with self.assertRaisesRegex(SessionError, "locked"):
            manager.select_role(
                session.session_id,
                participant_token=hr_participant.participant_token,
                role_id="it-helpdesk",
            )

    def test_start_requires_all_participants_to_have_roles(self) -> None:
        manager = SessionManager()
        session = manager.create_session(scenario_id="friday-pay-run", mode="standard")
        hr_participant = manager.join_session(
            JoinSessionRequest(room_code=session.room_code, nickname="Jordan"),
        )
        manager.join_session(JoinSessionRequest(room_code=session.room_code, nickname="Morgan"))
        manager.select_role(
            session.session_id,
            participant_token=hr_participant.participant_token,
            role_id="hr",
        )

        with self.assertRaisesRegex(SessionError, "Every participant"):
            manager.start_session(session.session_id, session.facilitator_token)

    def test_opens_first_round_with_role_filtered_participant_content(self) -> None:
        manager = SessionManager()
        session, hr_participant, _it_participant = create_started_session(manager)

        facilitator_round = manager.open_round(session.session_id, session.facilitator_token)
        participant_round = manager.round_for_token(
            session.session_id,
            participant_token=hr_participant.participant_token,
        )

        self.assertEqual(facilitator_round.phase, "round_open")
        self.assertEqual(facilitator_round.round_number, 1)
        self.assertEqual(facilitator_round.role, None)
        self.assertIn("Strong outcomes preserve", facilitator_round.facilitator_note or "")
        self.assertEqual(participant_round.role.id if participant_round.role else "", "hr")
        self.assertIn("sender display name", participant_round.role.private_information)
        self.assertNotIn("password reset", participant_round.model_dump_json())
        self.assertEqual(len(participant_round.role.choices), 4)

    def test_accepts_one_vote_per_participant(self) -> None:
        manager = SessionManager()
        session, hr_participant, _it_participant = create_started_session(manager)
        round_snapshot = manager.open_round(session.session_id, session.facilitator_token)

        accepted = manager.submit_vote(
            session.session_id,
            participant_token=hr_participant.participant_token,
            round_id=round_snapshot.round_id,
            choice_id="hr-r1-secure-contact-escalate",
        )

        self.assertTrue(accepted.vote_submitted)

        with self.assertRaisesRegex(SessionError, "already"):
            manager.submit_vote(
                session.session_id,
                participant_token=hr_participant.participant_token,
                round_id=round_snapshot.round_id,
                choice_id="hr-r1-watch-for-pattern",
            )

    def test_locks_aggregates_and_reveals_first_round_result(self) -> None:
        manager = SessionManager()
        session, hr_participant, it_participant = create_started_session(manager)
        round_snapshot = manager.open_round(session.session_id, session.facilitator_token)
        manager.submit_vote(
            session.session_id,
            participant_token=hr_participant.participant_token,
            round_id=round_snapshot.round_id,
            choice_id="hr-r1-secure-contact-escalate",
        )
        manager.submit_vote(
            session.session_id,
            participant_token=it_participant.participant_token,
            round_id=round_snapshot.round_id,
            choice_id="it-r1-verify-and-review",
        )

        locked = manager.lock_round(session.session_id, session.facilitator_token)

        self.assertEqual(locked.phase, "round_locked")
        self.assertIsNotNone(locked.result)
        self.assertEqual(len(locked.result.decisions), 2)
        self.assertIn("connect the payroll message", locked.result.interaction_summaries[0])
        metric_deltas = {metric.id: metric.delta for metric in locked.result.metric_deltas}
        self.assertEqual(metric_deltas["incident_control"], 27)
        self.assertEqual(metric_deltas["evidence_quality"], 28)

        participant_locked = manager.round_for_token(
            session.session_id,
            participant_token=hr_participant.participant_token,
        )
        self.assertIsNone(participant_locked.result)

        with self.assertRaisesRegex(SessionError, "not open"):
            manager.submit_vote(
                session.session_id,
                participant_token=hr_participant.participant_token,
                round_id=round_snapshot.round_id,
                choice_id="hr-r1-watch-for-pattern",
            )

        revealed = manager.reveal_round(session.session_id, session.facilitator_token)

        self.assertEqual(revealed.phase, "consequence_revealed")
        self.assertIsNotNone(revealed.result)
        self.assertIn("being treated as suspicious", revealed.result.public_consequence)

        participant_revealed = manager.round_for_token(
            session.session_id,
            participant_token=hr_participant.participant_token,
        )
        self.assertIsNotNone(participant_revealed.result)

    def test_rejects_invalid_room_code(self) -> None:
        manager = SessionManager()

        with self.assertRaisesRegex(SessionError, "Room code"):
            manager.join_session(JoinSessionRequest(room_code="BAD123", nickname="Jordan"))

    def test_rejects_full_room(self) -> None:
        manager = SessionManager()
        session = manager.create_session(scenario_id="friday-pay-run", mode="standard")

        for index in range(9):
            manager.join_session(
                JoinSessionRequest(room_code=session.room_code, nickname=f"Player {index}"),
            )

        with self.assertRaisesRegex(SessionError, "full"):
            manager.join_session(JoinSessionRequest(room_code=session.room_code, nickname="Extra"))

    def test_rejects_closed_room(self) -> None:
        manager = SessionManager()
        session = manager.create_session(scenario_id="friday-pay-run", mode="standard")
        manager.close_session(session.session_id, session.facilitator_token)

        with self.assertRaisesRegex(SessionError, "closed"):
            manager.join_session(JoinSessionRequest(room_code=session.room_code, nickname="Jordan"))

    def test_rejects_expired_room(self) -> None:
        current_time = datetime(2026, 8, 12, 12, tzinfo=timezone.utc)

        def now() -> datetime:
            return current_time

        manager = SessionManager(now=now)
        session = manager.create_session(scenario_id="friday-pay-run", mode="standard")
        current_time += timedelta(hours=3)

        with self.assertRaisesRegex(SessionError, "expired"):
            manager.join_session(JoinSessionRequest(room_code=session.room_code, nickname="Jordan"))


def create_started_session(
    manager: SessionManager,
) -> tuple[object, object, object]:
    session = manager.create_session(scenario_id="friday-pay-run", mode="standard")
    hr_participant = manager.join_session(
        JoinSessionRequest(room_code=session.room_code, nickname="Jordan"),
    )
    it_participant = manager.join_session(
        JoinSessionRequest(room_code=session.room_code, nickname="Morgan"),
    )
    manager.select_role(
        session.session_id,
        participant_token=hr_participant.participant_token,
        role_id="hr",
    )
    manager.select_role(
        session.session_id,
        participant_token=it_participant.participant_token,
        role_id="it-helpdesk",
    )
    manager.start_session(session.session_id, session.facilitator_token)
    return session, hr_participant, it_participant


if __name__ == "__main__":
    unittest.main()
