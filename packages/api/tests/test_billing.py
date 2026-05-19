"""
Tests for the Stripe billing endpoints.

Stripe API calls are patched via unittest.mock so no real Stripe key is needed.
DynamoDB is mocked with moto as in test_auth.py.
"""
import json
import os
import hashlib
import hmac
import time
from unittest.mock import MagicMock, patch

import boto3
import pytest
from fastapi.testclient import TestClient
from moto import mock_aws

from app.main import app
from app.auth.dynamodb import create_table_if_not_exists, create_key

TABLE = "test-billing-table"
STRIPE_SECRET = "whsec_test_secret"
PRICE_ID = "price_test_pro"
STRIPE_SK = "sk_test_fake"


@pytest.fixture(autouse=True)
def env(monkeypatch):
    monkeypatch.setenv("DYNAMODB_TABLE", TABLE)
    monkeypatch.setenv("STRIPE_SECRET_KEY", STRIPE_SK)
    monkeypatch.setenv("STRIPE_PRO_PRICE_ID", PRICE_ID)
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", STRIPE_SECRET)
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "test")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "test")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db_table():
    with mock_aws():
        create_table_if_not_exists(TABLE)
        yield


# ── /v1/billing/checkout ─────────────────────────────────────────────────────

def test_checkout_returns_url(client, db_table):
    mock_session = MagicMock()
    mock_session.url = "https://checkout.stripe.com/pay/cs_test_abc"

    with patch("app.routes.billing._stripe_client") as mock_stripe:
        mock_client = MagicMock()
        mock_client.checkout.sessions.create.return_value = mock_session
        mock_stripe.return_value = mock_client

        resp = client.post(
            "/v1/billing/checkout",
            json={
                "api_key": "nb-testkey",
                "success_url": "https://fractkit.io/success",
                "cancel_url": "https://fractkit.io/cancel",
            },
        )

    assert resp.status_code == 200
    assert resp.json()["checkout_url"] == "https://checkout.stripe.com/pay/cs_test_abc"


def test_checkout_503_no_price_id(client, db_table, monkeypatch):
    monkeypatch.delenv("STRIPE_PRO_PRICE_ID")
    resp = client.post("/v1/billing/checkout", json={"api_key": "nb-x"})
    assert resp.status_code == 503


def test_checkout_503_no_stripe_key(client, db_table, monkeypatch):
    monkeypatch.delenv("STRIPE_SECRET_KEY")
    resp = client.post("/v1/billing/checkout", json={"api_key": "nb-x"})
    assert resp.status_code == 503


def test_checkout_passes_api_key_as_metadata(client, db_table):
    mock_session = MagicMock()
    mock_session.url = "https://checkout.stripe.com/pay/cs_test_meta"

    with patch("app.routes.billing._stripe_client") as mock_stripe:
        mock_client = MagicMock()
        mock_client.checkout.sessions.create.return_value = mock_session
        mock_stripe.return_value = mock_client

        client.post("/v1/billing/checkout", json={"api_key": "nb-mymeta"})

        call_kwargs = mock_client.checkout.sessions.create.call_args
        params = call_kwargs.kwargs.get("params") or call_kwargs.args[0]
        assert params["metadata"]["api_key"] == "nb-mymeta"


# ── /v1/billing/webhook ───────────────────────────────────────────────────────

def _build_stripe_event(event_type: str, obj: dict, secret: str) -> tuple[bytes, str]:
    """Build a Stripe-signed webhook payload."""
    ts = str(int(time.time()))
    data = {"type": event_type, "data": {"object": obj}}
    payload = json.dumps(data).encode()
    signed_payload = f"{ts}.{payload.decode()}"
    sig = hmac.new(secret.encode(), signed_payload.encode(), hashlib.sha256).hexdigest()
    sig_header = f"t={ts},v1={sig}"
    return payload, sig_header


def test_webhook_checkout_completed_upgrades_to_pro(client, db_table):
    api_key = create_key(tier="free")

    obj = {
        "metadata": {"api_key": api_key},
        "customer": "cus_test123",
    }
    payload, sig = _build_stripe_event("checkout.session.completed", obj, STRIPE_SECRET)

    with patch("stripe.Webhook.construct_event") as mock_verify:
        mock_verify.return_value = json.loads(payload)
        resp = client.post(
            "/v1/billing/webhook",
            content=payload,
            headers={"stripe-signature": sig, "content-type": "application/json"},
        )

    assert resp.status_code == 200
    assert resp.json() == {"received": True}

    ddb = boto3.resource("dynamodb", region_name="us-east-1")
    item = ddb.Table(TABLE).get_item(Key={"api_key": api_key}).get("Item", {})
    assert item["tier"] == "pro"
    assert item["stripe_customer_id"] == "cus_test123"


def test_webhook_subscription_deleted_downgrades_to_free(client, db_table):
    api_key = create_key(tier="free")

    ddb = boto3.resource("dynamodb", region_name="us-east-1")
    ddb.Table(TABLE).update_item(
        Key={"api_key": api_key},
        UpdateExpression="SET #t = :tier, stripe_customer_id = :cid",
        ExpressionAttributeNames={"#t": "tier"},
        ExpressionAttributeValues={":tier": "pro", ":cid": "cus_downgrade"},
    )

    obj = {"customer": "cus_downgrade"}
    payload, sig = _build_stripe_event("customer.subscription.deleted", obj, STRIPE_SECRET)

    with patch("stripe.Webhook.construct_event") as mock_verify:
        mock_verify.return_value = json.loads(payload)
        resp = client.post(
            "/v1/billing/webhook",
            content=payload,
            headers={"stripe-signature": sig, "content-type": "application/json"},
        )

    assert resp.status_code == 200

    item = ddb.Table(TABLE).get_item(Key={"api_key": api_key}).get("Item", {})
    assert item["tier"] == "free"


def test_webhook_invalid_signature_returns_400(client, db_table):
    payload = b'{"type":"checkout.session.completed","data":{"object":{}}}'

    with patch("stripe.Webhook.construct_event") as mock_verify:
        import stripe
        mock_verify.side_effect = stripe.SignatureVerificationError("bad sig", "hdr")

        resp = client.post(
            "/v1/billing/webhook",
            content=payload,
            headers={"stripe-signature": "t=0,v1=bad", "content-type": "application/json"},
        )

    assert resp.status_code == 400


def test_webhook_unknown_event_ignored(client, db_table):
    obj = {"id": "evt_unknown"}
    payload, sig = _build_stripe_event("payment_intent.created", obj, STRIPE_SECRET)

    with patch("stripe.Webhook.construct_event") as mock_verify:
        mock_verify.return_value = json.loads(payload)

        resp = client.post(
            "/v1/billing/webhook",
            content=payload,
            headers={"stripe-signature": sig, "content-type": "application/json"},
        )

    assert resp.status_code == 200
    assert resp.json() == {"received": True}
