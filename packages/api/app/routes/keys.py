import os
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.auth.api_key import require_admin_key
from app.auth.dynamodb import create_key

router = APIRouter()


class CreateKeyRequest(BaseModel):
    tier: str = "free"
    user_id: Optional[str] = None


class CreateKeyResponse(BaseModel):
    api_key: str
    tier: str
    message: str


@router.post(
    "/v1/keys",
    response_model=CreateKeyResponse,
    tags=["admin"],
    summary="Create a new API key (admin only)",
)
async def create_api_key(
    body: CreateKeyRequest,
    _: str = Depends(require_admin_key),
) -> CreateKeyResponse:
    """
    Create a new noisebridge API key.

    Requires X-Admin-Key header. The returned key is shown only once —
    store it immediately.

    Tiers: free (100 req/day), pro (unlimited), enterprise (unlimited)
    """
    if not os.getenv("DYNAMODB_TABLE"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Key management not available in local dev mode (DYNAMODB_TABLE not set).",
        )

    try:
        api_key = create_key(tier=body.tier, user_id=body.user_id or "")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return CreateKeyResponse(
        api_key=api_key,
        tier=body.tier,
        message="Store this key securely — it will not be shown again.",
    )
