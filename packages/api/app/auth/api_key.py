import os
from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader
from app.auth.dynamodb import TABLE_NAME, get_key_item, check_and_increment

_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
_admin_header = APIKeyHeader(name="X-Admin-Key", auto_error=False)

ADMIN_API_KEY: str = os.getenv("ADMIN_API_KEY", "")


async def require_api_key(api_key: str = Security(_key_header)) -> str:
    """
    Validate X-API-Key header.

    When DYNAMODB_TABLE env var is set: full DynamoDB lookup + rate limiting.
    When not set (local dev / tests): accept any non-empty key.
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key. Pass your key in the X-API-Key header.",
        )

    # Local dev / test mode — no DynamoDB configured
    if not TABLE_NAME:
        return api_key

    # Production: look up key in DynamoDB
    item = get_key_item(api_key)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key.",
        )

    # Rate limiting: Free tier is capped at 100 req/day
    allowed = check_and_increment(api_key, item)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                "Daily request limit reached (100 req/day on Free tier). "
                "Upgrade to Pro for unlimited access: https://fractkit.io/#pricing"
            ),
        )

    return api_key


async def require_admin_key(admin_key: str = Security(_admin_header)) -> str:
    """Validate X-Admin-Key header for admin-only endpoints."""
    if not admin_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing admin key. Pass your key in the X-Admin-Key header.",
        )
    if ADMIN_API_KEY and admin_key != ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin key.",
        )
    return admin_key
