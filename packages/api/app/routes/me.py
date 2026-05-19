"""
GET /v1/me — Return metadata for the authenticated API key.

Does NOT increment request counters (read-only operation).
"""
from datetime import date
from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from app.auth.dynamodb import get_key_item, RATE_LIMITS

router = APIRouter()


class MeResponse(BaseModel):
    key_prefix: str          # e.g. "nb-a1b2c3..." → "nb-a1b2c3**"
    tier: str
    daily_limit: Optional[int]   # None = unlimited
    requests_today: int
    requests_total: int
    last_request_at: Optional[str]
    created_at: Optional[str]
    email: Optional[str]


@router.get(
    "/v1/me",
    response_model=MeResponse,
    tags=["auth"],
    summary="Get current API key usage and tier info",
)
async def me(x_api_key: str = Header(..., alias="X-API-Key")) -> MeResponse:
    """
    Returns tier, daily usage, and metadata for the authenticated key.
    Does **not** count against your daily limit.
    """
    item = get_key_item(x_api_key)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key.",
        )

    tier = item.get("tier", "free")
    today = date.today().isoformat()
    reset_date = item.get("reset_date", "")
    requests_today = int(item.get("requests_today", 0))

    # If day has rolled over, show 0 (counter resets on next actual request)
    if reset_date != today:
        requests_today = 0

    # Mask the key: show first 10 chars + "****"
    key_prefix = x_api_key[:14] + "****" if len(x_api_key) > 14 else x_api_key[:6] + "****"

    return MeResponse(
        key_prefix=key_prefix,
        tier=tier,
        daily_limit=RATE_LIMITS.get(tier, 100),
        requests_today=requests_today,
        requests_total=int(item.get("requests_total", 0)),
        last_request_at=item.get("last_request_at") or None,
        created_at=item.get("created_at") or None,
        email=item.get("email") or None,
    )
