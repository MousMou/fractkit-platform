"""
POST /v1/register — Self-service API key registration.

No admin key required. User provides their email, receives a free-tier API key.
The key is shown only once — user must store it immediately.
"""
import os
import re
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, field_validator

from app.auth.dynamodb import create_key

router = APIRouter()

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class RegisterRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_RE.match(v):
            raise ValueError("Invalid email address.")
        if len(v) > 254:
            raise ValueError("Email address too long.")
        return v


class RegisterResponse(BaseModel):
    api_key: str
    tier: str
    daily_limit: int
    message: str


@router.post(
    "/v1/register",
    response_model=RegisterResponse,
    tags=["auth"],
    summary="Register a new free API key",
)
async def register(body: RegisterRequest) -> RegisterResponse:
    """
    Register with your email and receive a free noisebridge API key.

    - Tier: **free** — 100 requests / day
    - Upgrade to Pro via /v1/billing/checkout for unlimited requests
    - Your key is shown **only once** — copy it immediately.
    """
    if not os.getenv("DYNAMODB_TABLE"):
        # Local dev mode: return a deterministic demo key
        return RegisterResponse(
            api_key="nb-demo-key-local-dev",
            tier="free",
            daily_limit=100,
            message="[LOCAL DEV] DynamoDB not configured. Use this demo key for testing.",
        )

    try:
        api_key = create_key(tier="free", user_id=body.email, email=body.email)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create API key: {str(e)}",
        )

    return RegisterResponse(
        api_key=api_key,
        tier="free",
        daily_limit=100,
        message="Store this key securely — it will not be shown again.",
    )
