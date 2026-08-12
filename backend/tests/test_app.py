from __future__ import annotations

import unittest

from fastapi.testclient import TestClient

from incident_bridge.app import create_app


class AppTest(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(create_app())

    def test_healthz_returns_ok(self) -> None:
        response = self.client.get("/healthz")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"status": "ok", "service": "incident-bridge-api"},
        )

    def test_scenario_summary_uses_validated_default_scenario(self) -> None:
        response = self.client.get("/api/scenario")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["id"], "friday-pay-run")
        self.assertEqual(body["title"], "The Friday Pay Run")
        self.assertEqual(body["roles"], ["HR", "IT Helpdesk"])
        self.assertEqual(body["quick_rounds"], 3)
        self.assertEqual(body["standard_rounds"], 5)

    def test_create_and_join_session(self) -> None:
        create_response = self.client.post(
            "/api/sessions",
            json={"scenario_id": "friday-pay-run", "mode": "standard"},
        )

        self.assertEqual(create_response.status_code, 200)
        created = create_response.json()
        self.assertIn("facilitator_token", created)
        self.assertEqual(created["lobby"]["participant_count"], 0)

        join_response = self.client.post(
            "/api/sessions/join",
            json={"room_code": created["room_code"], "nickname": "Jordan"},
        )

        self.assertEqual(join_response.status_code, 200)
        joined = join_response.json()
        self.assertIn("participant_token", joined)
        self.assertEqual(joined["session_id"], created["session_id"])
        self.assertEqual(joined["lobby"]["participants"][0]["nickname"], "Jordan")
        self.assertEqual(joined["lobby"]["role_counts"], {"hr": 0, "it-helpdesk": 0})

    def test_select_role_and_start_session(self) -> None:
        create_response = self.client.post(
            "/api/sessions",
            json={"scenario_id": "friday-pay-run", "mode": "standard"},
        )
        created = create_response.json()
        hr_join = self.client.post(
            "/api/sessions/join",
            json={"room_code": created["room_code"], "nickname": "Jordan"},
        ).json()
        it_join = self.client.post(
            "/api/sessions/join",
            json={"room_code": created["room_code"], "nickname": "Morgan"},
        ).json()

        role_response = self.client.post(
            f"/api/sessions/{created['session_id']}/role",
            json={"participant_token": hr_join["participant_token"], "role_id": "hr"},
        )

        self.assertEqual(role_response.status_code, 200)
        self.assertEqual(role_response.json()["role_counts"], {"hr": 1, "it-helpdesk": 0})

        self.client.post(
            f"/api/sessions/{created['session_id']}/role",
            json={"participant_token": it_join["participant_token"], "role_id": "it-helpdesk"},
        )
        start_response = self.client.post(
            f"/api/sessions/{created['session_id']}/start",
            json={"facilitator_token": created["facilitator_token"]},
        )

        self.assertEqual(start_response.status_code, 200)
        self.assertEqual(start_response.json()["phase"], "briefing")

        locked_response = self.client.post(
            f"/api/sessions/{created['session_id']}/role",
            json={"participant_token": hr_join["participant_token"], "role_id": "it-helpdesk"},
        )

        self.assertEqual(locked_response.status_code, 409)
        self.assertEqual(locked_response.json()["detail"]["code"], "role_selection_locked")

    def test_join_reports_controlled_errors(self) -> None:
        invalid_room = self.client.post(
            "/api/sessions/join",
            json={"room_code": "NOPE99", "nickname": "Jordan"},
        )

        self.assertEqual(invalid_room.status_code, 404)
        self.assertEqual(invalid_room.json()["detail"]["code"], "invalid_room_code")

        invalid_nickname = self.client.post(
            "/api/sessions/join",
            json={"room_code": "NOPE99", "nickname": "<script>"},
        )

        self.assertEqual(invalid_nickname.status_code, 400)
        self.assertEqual(invalid_nickname.json()["detail"]["code"], "invalid_nickname")

    def test_lobby_websocket_receives_join_updates(self) -> None:
        create_response = self.client.post(
            "/api/sessions",
            json={"scenario_id": "friday-pay-run", "mode": "standard"},
        )
        created = create_response.json()

        with self.client.websocket_connect(
            "/ws/sessions/{session_id}/lobby?facilitator_token={token}".format(
                session_id=created["session_id"],
                token=created["facilitator_token"],
            ),
        ) as websocket:
            initial_message = websocket.receive_json()

            self.assertEqual(initial_message["type"], "lobby:updated")
            self.assertEqual(initial_message["lobby"]["participant_count"], 0)

            join_response = self.client.post(
                "/api/sessions/join",
                json={"room_code": created["room_code"], "nickname": "Morgan"},
            )

            self.assertEqual(join_response.status_code, 200)
            update_message = websocket.receive_json()
            self.assertEqual(update_message["type"], "lobby:updated")
            self.assertEqual(update_message["lobby"]["participant_count"], 1)
            self.assertEqual(update_message["lobby"]["participants"][0]["nickname"], "Morgan")

            role_response = self.client.post(
                f"/api/sessions/{created['session_id']}/role",
                json={
                    "participant_token": join_response.json()["participant_token"],
                    "role_id": "it-helpdesk",
                },
            )

            self.assertEqual(role_response.status_code, 200)
            role_message = websocket.receive_json()
            self.assertEqual(role_message["type"], "lobby:updated")
            self.assertEqual(role_message["lobby"]["role_counts"]["it-helpdesk"], 1)


if __name__ == "__main__":
    unittest.main()
