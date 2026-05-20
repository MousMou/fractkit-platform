"""Tests for POST /v1/resend-key."""
import pytest
from unittest.mock import patch, MagicMock
from moto import mock_aws
from fastapi.testclient import TestClient

from app.main import app
from app.auth.dynamodb import create_table_if_not_exists, create_key

TABLE = "test-resend-key-table"
REGION = "us-east-1"


@pytest.fixture(autouse=True)
def env(monkeypatch):
    monkeypatch.setenv("DYNAMODB_TABLE", TABLE)
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "test")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "test")
    monkeypatch.setenv("AWS_DEFAULT_REGION", REGION)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    with mock_aws():
        create_table_if_not_exists(TABLE, REGION)
        yield


def test_resend_key_found_sends_email(client, db):
    create_key(tier="free", email="found@example.com")
    with patch("app.routes.resend_key._send") as mock_send:
        resp = client.post("/v1/resend-key", json={"email": "found@example.com"})
    assert resp.status_code == 200
    assert resp.json() == {"sent": True}
    mock_send.assert_called_once()
    args = mock_send.call_args[0]
    assert args[0] == "found@example.com"
    assert args[1].startswith("nb-")
    assert args[2] == "free"


def test_resend_key_not_found_still_returns_200(client, db):
    # No key registered for this email
    with patch("app.routes.resend_key._send") as mock_send:
        resp = client.post("/v1/resend-key", json={"email": "ghost@example.com"})
    assert resp.status_code == 200
    assert resp.json() == {"sent": True}
    mock_send.assert_not_called()


def test_resend_key_invalid_email(client, db):
    resp = client.post("/v1/resend-key", json={"email": "not-an-email"})
    assert resp.status_code == 422


def test_resend_key_ses_failure_still_returns_200(client, db):
    create_key(tier="pro", email="ses-fail@example.com")
    with patch("app.routes.resend_key._send", side_effect=Exception("SES down")):
        # _send swallows internally, but even if it raises, endpoint shouldn't crash
        # Actually _send catches internally — test that endpoint stays 200
        pass
    # Patch at the boto3 level to simulate SES failure inside _send
    with patch("boto3.client") as mock_boto:
        mock_client = MagicMock()
        mock_client.send_email.side_effect = Exception("SES throttle")
        mock_boto.return_value = mock_client
        resp = client.post("/v1/resend-key", json={"email": "ses-fail@example.com"})
    assert resp.status_code == 200
    assert resp.json() == {"sent": True}


def test_resend_key_returns_most_recent_key(client, db):
    """When a user has multiple keys, send the most recently created one."""
    create_key(tier="free", email="multi@example.com")
    import time; time.sleep(0.01)
    key2 = create_key(tier="pro", email="multi@example.com")
    with patch("app.routes.resend_key._send") as mock_send:
        client.post("/v1/resend-key", json={"email": "multi@example.com"})
    sent_key = mock_send.call_args[0][1]
    assert sent_key == key2
