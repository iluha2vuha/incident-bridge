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


if __name__ == "__main__":
    unittest.main()
