"""
DynamoDB client for noisebridge API key management.

Table schema (noisebridge-api-keys-{stage}):
  PK: api_key (String)
  Attributes:
    user_id         — owner identifier
    tier            — "free" | "pro" | "enterprise"
    created_at      — ISO datetime
    requests_today  — resets daily at midnight UTC
    requests_total  — cumulative, never resets
    last_request_at — ISO datetime of last request
    reset_date      — YYYY-MM-DD when requests_today was last reset

Rate limits:
  free:       100 req/day
  pro:        unlimited
  enterprise: unlimited
"""
import os
import uuid
from datetime import datetime, date, timezone
from typing import Optional, Dict

import boto3
from boto3.dynamodb.conditions import Key

TABLE_NAME: str = os.getenv("DYNAMODB_TABLE", "")
RATE_LIMITS: Dict[str, Optional[int]] = {
    "free": 100,
    "pro": None,
    "enterprise": None,
}


def _get_table():
    dynamodb = boto3.resource(
        "dynamodb",
        region_name=os.getenv("AWS_REGION", "us-east-1"),
    )
    return dynamodb.Table(os.getenv("DYNAMODB_TABLE", TABLE_NAME))


def get_key_item(api_key: str) -> Optional[Dict]:
    """Look up an API key in DynamoDB. Returns None if not found."""
    table = _get_table()
    resp = table.get_item(Key={"api_key": api_key})
    return resp.get("Item")


def check_and_increment(api_key: str, item: Dict) -> bool:
    """
    Check rate limit and atomically increment request counters.
    Returns True if request is allowed, False if rate-limited.
    """
    today = date.today().isoformat()
    table = _get_table()

    reset_date = item.get("reset_date", "")
    requests_today = int(item.get("requests_today", 0))

    # Reset daily counter if it's a new day
    if reset_date != today:
        requests_today = 0

    tier = item.get("tier", "free")
    limit = RATE_LIMITS.get(tier, 100)
    if limit is not None and requests_today >= limit:
        return False

    table.update_item(
        Key={"api_key": api_key},
        UpdateExpression=(
            "SET requests_today = :rt, "
            "requests_total = requests_total + :one, "
            "last_request_at = :now, "
            "reset_date = :today"
        ),
        ExpressionAttributeValues={
            ":rt": requests_today + 1,
            ":one": 1,
            ":now": datetime.now(timezone.utc).isoformat(),
            ":today": today,
        },
    )
    return True


def create_key(tier: str = "free", user_id: str = "", email: str = "") -> str:
    """Create a new API key, store in DynamoDB, and return the key string."""
    if tier not in RATE_LIMITS:
        raise ValueError(f"Invalid tier '{tier}'. Must be: {list(RATE_LIMITS)}")

    table = _get_table()
    api_key = f"nb-{uuid.uuid4().hex}"
    today = date.today().isoformat()

    table.put_item(Item={
        "api_key": api_key,
        "user_id": user_id or f"user-{uuid.uuid4().hex[:8]}",
        "email": email,
        "tier": tier,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "requests_today": 0,
        "requests_total": 0,
        "last_request_at": "",
        "reset_date": today,
    })
    return api_key


def update_key_tier(api_key: str, tier: str, stripe_customer_id: str = "") -> bool:
    """Update the tier (and optionally stripe_customer_id) of an existing key.
    Returns True if the item existed and was updated, False otherwise.
    """
    if tier not in RATE_LIMITS:
        raise ValueError(f"Invalid tier '{tier}'. Must be: {list(RATE_LIMITS)}")

    table = _get_table()
    resp = table.update_item(
        Key={"api_key": api_key},
        UpdateExpression="SET #t = :tier, stripe_customer_id = :cid",
        ExpressionAttributeNames={"#t": "tier"},
        ExpressionAttributeValues={":tier": tier, ":cid": stripe_customer_id},
        ConditionExpression="attribute_exists(api_key)",
        ReturnValues="UPDATED_NEW",
    )
    return bool(resp.get("Attributes"))


def get_key_by_email(email: str) -> Optional[Dict]:
    """Scan for the most recent API key registered with a given email."""
    table = _get_table()
    resp = table.scan(
        FilterExpression="email = :email",
        ExpressionAttributeValues={":email": email},
    )
    items = resp.get("Items", [])
    if not items:
        return None
    return max(items, key=lambda x: x.get("created_at", ""))


def get_key_by_stripe_customer(stripe_customer_id: str) -> Optional[Dict]:
    """Scan for an API key by Stripe customer ID (used in webhook handlers)."""
    table = _get_table()
    resp = table.scan(
        FilterExpression="stripe_customer_id = :cid",
        ExpressionAttributeValues={":cid": stripe_customer_id},
        Limit=1,
    )
    items = resp.get("Items", [])
    return items[0] if items else None


def create_table_if_not_exists(table_name: str, region: str = "us-east-1") -> None:
    """Create the DynamoDB table (used in tests and initial setup)."""
    dynamodb = boto3.resource("dynamodb", region_name=region)
    try:
        table = dynamodb.create_table(
            TableName=table_name,
            KeySchema=[{"AttributeName": "api_key", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "api_key", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )
        table.wait_until_exists()
    except dynamodb.meta.client.exceptions.ResourceInUseException:
        pass  # Table already exists
