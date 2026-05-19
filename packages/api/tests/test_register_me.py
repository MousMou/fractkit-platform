"""
Tests for POST /v1/register and GET /v1/me endpoints.
"""
import pytest
import boto3
from moto import mock_aws
from fastapi.testclient import TestClient

from app.main import app
from app.auth.dynamodb import create_table_if_not_exists, create_key

TABLE = "test-register-me-table"
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


# ── /v1/register ─────────────────────────────────────────────────────────────

def test_register_returns_free_key(client, db):
    resp = client.post("/v1/register", json={"email": "test@example.com"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["api_key"].startswith("nb-")
    assert data["tier"] == "free"
    assert data["daily_limit"] == 100


def test_register_invalid_email(client, db):
    resp = client.post("/v1/register", json={"email": "notanemail"})
    assert resp.status_code == 422


def test_register_empty_email(client, db):
    resp = client.post("/v1/register", json={"email": ""})
    assert resp.status_code == 422


def test_register_local_dev_no_dynamo(client, monkeypatch):
    monkeypatch.delenv("DYNAMODB_TABLE")
    resp = client.post("/v1/register", json={"email": "dev@example.com"})
    assert resp.status_code == 200
    assert resp.json()["api_key"] == "nb-demo-key-local-dev"


def test_register_key_stored_in_dynamodb(client, db):
    resp = client.post("/v1/register", json={"email": "store@example.com"})
    assert resp.status_code == 200
    api_key = resp.json()["api_key"]

    ddb = boto3.resource("dynamodb", region_name=REGION)
    item = ddb.Table(TABLE).get_item(Key={"api_key": api_key}).get("Item", {})
    assert item["email"] == "store@example.com"
    assert item["tier"] == "free"


# ── /v1/me ───────────────────────────────────────────────────────────────────

def test_me_returns_key_info(client, db):
    api_key = create_key(tier="free", email="me@example.com")
    resp = client.get("/v1/me", headers={"X-API-Key": api_key})
    assert resp.status_code == 200
    data = resp.json()
    assert "key_prefix" in data
    assert data["tier"] == "free"
    assert data["daily_limit"] == 100
    assert data["requests_today"] == 0


def test_me_pro_tier_unlimited(client, db):
    api_key = create_key(tier="pro")
    resp = client.get("/v1/me", headers={"X-API-Key": api_key})
    assert resp.status_code == 200
    assert resp.json()["daily_limit"] is None


def test_me_missing_key_returns_401(client, db):
    resp = client.get("/v1/me")
    assert resp.status_code == 422  # missing required header


def test_me_invalid_key_returns_401(client, db):
    resp = client.get("/v1/me", headers={"X-API-Key": "nb-invalid-key"})
    assert resp.status_code == 401


def test_me_key_prefix_masks_key(client, db):
    api_key = create_key(tier="free")
    resp = client.get("/v1/me", headers={"X-API-Key": api_key})
    prefix = resp.json()["key_prefix"]
    assert "****" in prefix
    assert api_key not in prefix
