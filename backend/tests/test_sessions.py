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
        self.assertIn("<svg", response.join_qr_svg)
        self.assertIn("<path", response.join_qr_svg)
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

    def test_reconnect_restores_facilitator_and_participant_lobby_state(self) -> None:
        manager = SessionManager()
        session, hr_participant, _it_participant = create_started_session(manager)

        facilitator = manager.reconnect_session(
            session.session_id,
            facilitator_token=session.facilitator_token,
        )
        participant = manager.reconnect_session(
            session.session_id,
            participant_token=hr_participant.participant_token,
        )

        self.assertEqual(facilitator.actor, "facilitator")
        self.assertEqual(facilitator.lobby.phase, "briefing")
        self.assertEqual(participant.actor, "participant")
        self.assertEqual(participant.participant_id, hr_participant.participant_id)
        self.assertEqual(participant.participant_name, "Jordan")

    def test_rejects_late_join_after_start(self) -> None:
        manager = SessionManager()
        session, _hr_participant, _it_participant = create_started_session(manager)

        with self.assertRaisesRegex(SessionError, "progress"):
            manager.join_session(JoinSessionRequest(room_code=session.room_code, nickname="Late"))

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

    def test_rejects_stale_round_id_and_invalid_choice(self) -> None:
        manager = SessionManager()
        session, hr_participant, _it_participant = create_started_session(manager)
        manager.open_round(session.session_id, session.facilitator_token)

        with self.assertRaisesRegex(SessionError, "stale"):
            manager.submit_vote(
                session.session_id,
                participant_token=hr_participant.participant_token,
                round_id="old-round",
                choice_id="hr-r1-secure-contact-escalate",
            )

        with self.assertRaisesRegex(SessionError, "Choice"):
            manager.submit_vote(
                session.session_id,
                participant_token=hr_participant.participant_token,
                round_id="r1-suspicious-payroll-request",
                choice_id="it-r1-verify-and-review",
            )

    def test_majority_vote_wins_department_decision(self) -> None:
        manager = SessionManager()
        session, participants = create_started_session_with_roles(
            manager,
            [
                ("Jordan", "hr"),
                ("Priya", "hr"),
                ("Taylor", "hr"),
                ("Morgan", "it-helpdesk"),
            ],
        )
        round_snapshot = manager.open_round(session.session_id, session.facilitator_token)

        for participant, choice_id in [
            (participants[0], "hr-r1-secure-contact-escalate"),
            (participants[1], "hr-r1-secure-contact-escalate"),
            (participants[2], "hr-r1-watch-for-pattern"),
            (participants[3], "it-r1-verify-and-review"),
        ]:
            manager.submit_vote(
                session.session_id,
                participant_token=participant.participant_token,
                round_id=round_snapshot.round_id,
                choice_id=choice_id,
            )

        locked = manager.lock_round(session.session_id, session.facilitator_token)

        decisions = {decision.role_id: decision.choice_id for decision in locked.result.decisions}
        self.assertEqual(decisions["hr"], "hr-r1-secure-contact-escalate")

    def test_tied_department_vote_requires_resolution_before_lock(self) -> None:
        manager = SessionManager()
        session, participants = create_started_session_with_roles(
            manager,
            [
                ("Jordan", "hr"),
                ("Priya", "hr"),
                ("Morgan", "it-helpdesk"),
            ],
        )
        round_snapshot = manager.open_round(session.session_id, session.facilitator_token)

        for participant, choice_id in [
            (participants[0], "hr-r1-secure-contact-escalate"),
            (participants[1], "hr-r1-watch-for-pattern"),
            (participants[2], "it-r1-verify-and-review"),
        ]:
            manager.submit_vote(
                session.session_id,
                participant_token=participant.participant_token,
                round_id=round_snapshot.round_id,
                choice_id=choice_id,
            )

        with self.assertRaisesRegex(SessionError, "tied"):
            manager.lock_round(session.session_id, session.facilitator_token)

    def test_resolves_tied_department_vote_before_lock(self) -> None:
        manager = SessionManager()
        session, participants = create_started_session_with_roles(
            manager,
            [
                ("Jordan", "hr"),
                ("Priya", "hr"),
                ("Morgan", "it-helpdesk"),
            ],
        )
        round_snapshot = manager.open_round(session.session_id, session.facilitator_token)

        for participant, choice_id in [
            (participants[0], "hr-r1-secure-contact-escalate"),
            (participants[1], "hr-r1-watch-for-pattern"),
            (participants[2], "it-r1-verify-and-review"),
        ]:
            manager.submit_vote(
                session.session_id,
                participant_token=participant.participant_token,
                round_id=round_snapshot.round_id,
                choice_id=choice_id,
            )

        manager.resolve_tie(
            session.session_id,
            facilitator_token=session.facilitator_token,
            role_id="hr",
            choice_id="hr-r1-watch-for-pattern",
        )
        locked = manager.lock_round(session.session_id, session.facilitator_token)

        decisions = {decision.role_id: decision.choice_id for decision in locked.result.decisions}
        self.assertEqual(decisions["hr"], "hr-r1-watch-for-pattern")

    def test_lock_rejects_missed_role_votes(self) -> None:
        manager = SessionManager()
        session, participants = create_started_session_with_roles(
            manager,
            [("Jordan", "hr"), ("Morgan", "it-helpdesk")],
        )
        round_snapshot = manager.open_round(session.session_id, session.facilitator_token)
        manager.submit_vote(
            session.session_id,
            participant_token=participants[0].participant_token,
            round_id=round_snapshot.round_id,
            choice_id="hr-r1-secure-contact-escalate",
        )

        with self.assertRaisesRegex(SessionError, "it-helpdesk needs at least one vote"):
            manager.lock_round(session.session_id, session.facilitator_token)

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
        metric_values = {metric.id: metric.value for metric in locked.result.metric_deltas}
        self.assertLessEqual(metric_values["incident_control"], 100)
        self.assertLessEqual(metric_values["evidence_quality"], 100)

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

    def test_standard_mode_advances_through_all_five_rounds(self) -> None:
        manager = SessionManager()
        session, participants = create_started_session_with_roles(
            manager,
            [("Jordan", "hr"), ("Morgan", "it-helpdesk")],
            mode="standard",
        )
        expected_round_ids = [
            "r1-suspicious-payroll-request",
            "r2-repeated-authentication-prompts",
            "r3-suspicious-mailbox-activity",
            "r4-wider-organisational-impact",
            "r5-recovery-and-communication",
        ]

        for index, expected_round_id in enumerate(expected_round_ids):
            opened = manager.open_round(session.session_id, session.facilitator_token)
            self.assertEqual(opened.round_id, expected_round_id)
            self.assertEqual(opened.round_number, index + 1)
            self.assertEqual(opened.total_rounds, 5)
            self.assertEqual(opened.has_next_round, index < 4)
            submit_first_available_choices(manager, session, participants)
            manager.lock_round(session.session_id, session.facilitator_token)
            manager.reveal_round(session.session_id, session.facilitator_token)

            if index < 4:
                advanced = manager.advance_round(session.session_id, session.facilitator_token)
                self.assertEqual(advanced.phase, "briefing")
                self.assertEqual(advanced.round_id, expected_round_ids[index + 1])
            else:
                with self.assertRaisesRegex(SessionError, "No next"):
                    manager.advance_round(session.session_id, session.facilitator_token)

    def test_quick_mode_uses_selected_round_ids_from_same_scenario(self) -> None:
        manager = SessionManager()
        session, participants = create_started_session_with_roles(
            manager,
            [("Jordan", "hr"), ("Morgan", "it-helpdesk")],
            mode="quick",
        )
        expected_round_ids = [
            "r1-suspicious-payroll-request",
            "r3-suspicious-mailbox-activity",
            "r5-recovery-and-communication",
        ]

        for index, expected_round_id in enumerate(expected_round_ids):
            opened = manager.open_round(session.session_id, session.facilitator_token)
            self.assertEqual(opened.round_id, expected_round_id)
            self.assertEqual(opened.round_number, index + 1)
            self.assertEqual(opened.total_rounds, 3)
            submit_first_available_choices(manager, session, participants)
            manager.lock_round(session.session_id, session.facilitator_token)
            manager.reveal_round(session.session_id, session.facilitator_token)

            if index < 2:
                manager.advance_round(session.session_id, session.facilitator_token)

    def test_debrief_shows_final_metrics_timeline_learning_and_questions(self) -> None:
        manager = SessionManager()
        session, participants = create_started_session_with_roles(
            manager,
            [("Jordan", "hr"), ("Morgan", "it-helpdesk")],
            mode="quick",
        )

        for index in range(3):
            manager.open_round(session.session_id, session.facilitator_token)
            submit_first_available_choices(manager, session, participants)
            manager.lock_round(session.session_id, session.facilitator_token)
            manager.reveal_round(session.session_id, session.facilitator_token)

            if index < 2:
                manager.advance_round(session.session_id, session.facilitator_token)

        debrief = manager.debrief_for_token(
            session.session_id,
            facilitator_token=session.facilitator_token,
        )

        self.assertEqual(len(debrief.metrics), 4)
        self.assertTrue(all(0 <= metric.value <= 100 for metric in debrief.metrics))
        self.assertEqual(len(debrief.timeline), 3)
        self.assertEqual(debrief.timeline[0].round_id, "r1-suspicious-payroll-request")
        self.assertEqual(debrief.timeline[1].round_id, "r3-suspicious-mailbox-activity")
        self.assertEqual(debrief.timeline[2].round_id, "r5-recovery-and-communication")
        self.assertEqual(len(debrief.timeline[0].decisions), 2)
        self.assertEqual(len(debrief.learning_points), 3)
        self.assertGreaterEqual(len(debrief.discussion_questions), 6)

        participant_debrief = manager.debrief_for_token(
            session.session_id,
            participant_token=participants[0].participant_token,
        )
        self.assertEqual(participant_debrief.timeline[0].round_id, debrief.timeline[0].round_id)

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


def create_started_session_with_roles(
    manager: SessionManager,
    participant_specs: list[tuple[str, str]],
    mode: str = "standard",
) -> tuple[object, list[object]]:
    session = manager.create_session(scenario_id="friday-pay-run", mode=mode)
    participants = []

    for nickname, role_id in participant_specs:
        participant = manager.join_session(
            JoinSessionRequest(room_code=session.room_code, nickname=nickname),
        )
        manager.select_role(
            session.session_id,
            participant_token=participant.participant_token,
            role_id=role_id,
        )
        participants.append(participant)

    manager.start_session(session.session_id, session.facilitator_token)
    return session, participants


def submit_first_available_choices(
    manager: SessionManager,
    session: object,
    participants: list[object],
) -> None:
    for participant in participants:
        participant_round = manager.round_for_token(
            session.session_id,
            participant_token=participant.participant_token,
        )
        choice_id = participant_round.role.choices[0].id
        manager.submit_vote(
            session.session_id,
            participant_token=participant.participant_token,
            round_id=participant_round.round_id,
            choice_id=choice_id,
        )


if __name__ == "__main__":
    unittest.main()
