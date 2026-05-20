"""
POST /v1/resend-key — Email the user's API key given their registered email.

Always returns {"sent": true} regardless of whether the email exists,
to prevent email enumeration attacks.
"""
import logging
import os

from fastapi import APIRouter
from pydantic import BaseModel, EmailStr

from app.auth.dynamodb import get_key_by_email

log = logging.getLogger(__name__)
router = APIRouter()

_FROM = os.getenv("SES_FROM_EMAIL", "noreply@fractkit.io")
_SUBJECT = "Your noisebridge API key"


class ResendRequest(BaseModel):
    email: EmailStr


@router.post("/v1/resend-key", status_code=200)
def resend_key(body: ResendRequest):
    item = get_key_by_email(body.email)

    if item:
        _send(body.email, item["api_key"], item.get("tier", "free"))
    else:
        log.info("resend-key: no key found for %s", body.email)

    return {"sent": True}


def _send(to: str, api_key: str, tier: str) -> None:
    """Send the API key via AWS SES. Logs and swallows errors so the
    endpoint always returns 200 (no enumeration)."""
    try:
        import boto3
        client = boto3.client("ses", region_name=os.getenv("AWS_REGION", "us-east-1"))
        client.send_email(
            Source=_FROM,
            Destination={"ToAddresses": [to]},
            Message={
                "Subject": {"Data": _SUBJECT},
                "Body": {
                    "Text": {
                        "Data": (
                            f"Hi,\n\n"
                            f"Here is your noisebridge API key:\n\n"
                            f"  {api_key}\n\n"
                            f"Tier: {tier}\n\n"
                            f"Use it with:\n"
                            f"  fractkit config set-key {api_key}\n"
                            f"  # or header: X-API-Key: {api_key}\n\n"
                            f"Dashboard: https://fractkit.io/dashboard\n\n"
                            f"— the fractkit team"
                        )
                    },
                    "Html": {
                        "Data": (
                            f"<p>Hi,</p>"
                            f"<p>Here is your <strong>noisebridge API key</strong>:</p>"
                            f"<pre style='background:#0d0d1a;color:#a78bfa;padding:16px;"
                            f"border-radius:8px;font-size:14px'>{api_key}</pre>"
                            f"<p>Tier: <strong>{tier}</strong></p>"
                            f"<p>Use it with:<br>"
                            f"<code>fractkit config set-key {api_key}</code></p>"
                            f"<p><a href='https://fractkit.io/dashboard'>Open your dashboard →</a></p>"
                            f"<hr><p style='color:#666;font-size:12px'>"
                            f"If you didn't request this, you can ignore this email.</p>"
                        )
                    },
                },
            },
        )
        log.info("resend-key: sent to %s", to)
    except Exception as exc:
        log.error("resend-key: SES send failed for %s: %s", to, exc)
