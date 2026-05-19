"""
Auth + rate limiting tests using moto to mock DynamoDB.
These tests exercise the full DynamoDB code path (DYNAMODB_TABLE is set).
"""
import os
import pytest
import boto3
from moto import mock_aws
from fastapi.testclient import TestClient

TABLE = "noisebridge-api-keys-test"
REGION = "us-east-1"
ADMIN_KEY = "admin-secret-key"


def _make_table(dynamodb):
    return dynamodb.create_table(
        TableName=TABLE,
        KeySchema=[{"AttributeName": "api_key", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "api_key", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
    )


@pytest.fixture
def dynamo_env(monkeypatch):
    """Set env vars and provide a mocked DynamoDB table."""
    monkeypatch.setenv("DYNAMODB_TABLE", TABLE)
    monkeypatch.setenv("AWS_DEFAULT_REGION", REGION)
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("ADMIN_API_KEY", ADMIN_KEY)


@pytest.fixture
def dynamo_client(dynamo_env):
    """Mocked DynamoDB resource with table created."""
    with mock_aws():
        dynamodb = boto3.resource("dynamodb", region_name=REGION)
        _make_table(dynamodb)
        yield dynamodb


@pytest.fixture
def api_client(dynamo_client):
    """TestClient with mocked DynamoDB active."""
    # Re-import app inside mock_aws context so modules pick up env vars
    from importlib import reload
    import app.auth.dynamodb as ddb_mod
    import app.auth.api_key as auth_mod
    reload(ddb_mod)
    reload(auth_mod)
    from app.main import app
    return TestClient(app)


def _insert_key(dynamodb, api_key: str, tier: str = "free", requests_today: int = 0):
    from datetime import date
    table = dynamodb.Table(TABLE)
    table.put_item(Item={
        "api_key": api_key,
        "user_id": "test-user",
        "tier": tier,
        "created_at": "2026-05-19T00:00:00+00:00",
        "requests_today": requests_today,
        "requests_total": requests_today,
        "last_request_at": "",
        "reset_date": date.today().isoformat(),
    })


IQM_BELL = {"counts": {"00": 122, "01": 3, "10": 3, "11": 128}, "n": 2, "device": "iqm_garnet"}


# ── Auth: missing / invalid key ────────────────────────────────────────────────

def test_missing_key_returns_401(api_client):
    r = api_client.post("/v1/correct", json=IQM_BELL)
    assert r.status_code == 401

def test_invalid_key_returns_401(dynamo_client, api_client):
    r = api_client.post("/v1/correct", json=IQM_BELL, headers={"X-API-Key": "nonexistent-key"})
    assert r.status_code == 401
    assert "Invalid API key" in r.json()["detail"]


# ── Auth: valid key ────────────────────────────────────────────────────────────

def test_valid_free_key_accepted(dynamo_client, api_client):
    _insert_key(dynamo_client, "nb-validkey123", tier="free")
    r = api_client.post("/v1/correct", json=IQM_BELL, headers={"X-API-Key": "nb-validkey123"})
    assert r.status_code == 200

def test_valid_pro_key_accepted(dynamo_client, api_client):
    _insert_key(dynamo_client, "nb-prokey456", tier="pro")
    r = api_client.post("/v1/correct", json=IQM_BELL, headers={"X-API-Key": "nb-prokey456"})
    assert r.status_code == 200


# ── Rate limiting ──────────────────────────────────────────────────────────────

def test_free_tier_rate_limit_at_100(dynamo_client, api_client):
    """Free key with 100 requests today → 429."""
    _insert_key(dynamo_client, "nb-limited", tier="free", requests_today=100)
    r = api_client.post("/v1/correct", json=IQM_BELL, headers={"X-API-Key": "nb-limited"})
    assert r.status_code == 429
    assert "Daily request limit" in r.json()["detail"]

def test_free_tier_at_99_is_still_allowed(dynamo_client, api_client):
    """Free key with 99 requests today → still allowed (100th request)."""
    _insert_key(dynamo_client, "nb-almost", tier="free", requests_today=99)
    r = api_client.post("/v1/correct", json=IQM_BELL, headers={"X-API-Key": "nb-almost"})
    assert r.status_code == 200

def test_pro_tier_no_rate_limit(dynamo_client, api_client):
    """Pro key with 1000 requests today → still allowed."""
    _insert_key(dynamo_client, "nb-pro-heavy", tier="pro", requests_today=1000)
    r = api_client.post("/v1/correct", json=IQM_BELL, headers={"X-API-Key": "nb-pro-heavy"})
    assert r.status_code == 200

def test_requests_today_incremented(dynamo_client, api_client):
    """Successful request increments requests_today in DynamoDB."""
    _insert_key(dynamo_client, "nb-increment", tier="free", requests_today=5)
    api_client.post("/v1/correct", json=IQM_BELL, headers={"X-API-Key": "nb-increment"})
    item = dynamo_client.Table(TABLE).get_item(Key={"api_key": "nb-increment"})["Item"]
    assert int(item["requests_today"]) == 6
    assert int(item["requests_total"]) == 6


# ── DynamoDB module: create_key ────────────────────────────────────────────────

def test_create_key_stores_in_dynamodb(dynamo_client):
    from app.auth.dynamodb import create_key
    key = create_key(tier="free", user_id="test-user-001")
    assert key.startswith("nb-")
    item = dynamo_client.Table(TABLE).get_item(Key={"api_key": key})["Item"]
    assert item["tier"] == "free"
    assert item["user_id"] == "test-user-001"
    assert int(item["requests_today"]) == 0

def test_create_key_invalid_tier(dynamo_client):
    from app.auth.dynamodb import create_key
    with pytest.raises(ValueError, match="Invalid tier"):
        create_key(tier="enterprise_plus")


# ── Admin endpoint POST /v1/keys ───────────────────────────────────────────────

def test_create_key_endpoint_requires_admin_header(dynamo_client, api_client):
    r = api_client.post("/v1/keys", json={"tier": "free"})
    assert r.status_code == 401

def test_create_key_endpoint_wrong_admin_key(dynamo_client, api_client):
    r = api_client.post("/v1/keys", json={"tier": "free"}, headers={"X-Admin-Key": "wrong"})
    assert r.status_code == 403

def test_create_key_endpoint_success(dynamo_client, api_client):
    r = api_client.post(
        "/v1/keys",
        json={"tier": "pro", "user_id": "new-user-001"},
        headers={"X-Admin-Key": ADMIN_KEY},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["api_key"].startswith("nb-")
    assert data["tier"] == "pro"
    assert "Store this key" in data["message"]

def test_create_key_invalid_tier_returns_400(dynamo_client, api_client):
    r = api_client.post(
        "/v1/keys",
        json={"tier": "diamond"},
        headers={"X-Admin-Key": ADMIN_KEY},
    )
    assert r.status_code == 400
