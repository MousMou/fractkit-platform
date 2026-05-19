import os
import stripe
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel
from typing import Optional

from app.auth.dynamodb import update_key_tier, get_key_by_stripe_customer

router = APIRouter()


def _stripe_client() -> stripe.StripeClient:
    key = os.getenv("STRIPE_SECRET_KEY", "")
    if not key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Billing not available (STRIPE_SECRET_KEY not set).",
        )
    return stripe.StripeClient(key)


class CheckoutRequest(BaseModel):
    api_key: str
    success_url: str = "https://fractkit.io/billing/success"
    cancel_url: str = "https://fractkit.io/billing/cancel"


class CheckoutResponse(BaseModel):
    checkout_url: str


@router.post(
    "/v1/billing/checkout",
    response_model=CheckoutResponse,
    tags=["billing"],
    summary="Create a Stripe checkout session for Pro tier",
)
async def create_checkout(body: CheckoutRequest) -> CheckoutResponse:
    """
    Creates a Stripe Checkout session for the Pro subscription.
    The api_key is stored as metadata so the webhook can upgrade the tier.
    """
    price_id = os.getenv("STRIPE_PRO_PRICE_ID", "")
    if not price_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Billing not available (STRIPE_PRO_PRICE_ID not set).",
        )

    client = _stripe_client()
    session = client.checkout.sessions.create(
        params={
            "mode": "subscription",
            "line_items": [{"price": price_id, "quantity": 1}],
            "success_url": body.success_url + "?session_id={CHECKOUT_SESSION_ID}",
            "cancel_url": body.cancel_url,
            "metadata": {"api_key": body.api_key},
            "subscription_data": {"metadata": {"api_key": body.api_key}},
        }
    )
    return CheckoutResponse(checkout_url=session.url)


@router.post(
    "/v1/billing/webhook",
    tags=["billing"],
    summary="Stripe webhook receiver",
    status_code=status.HTTP_200_OK,
)
async def stripe_webhook(request: Request):
    """
    Handles Stripe webhook events:
    - checkout.session.completed  → upgrade api_key to pro
    - customer.subscription.deleted → downgrade api_key to free
    """
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    if webhook_secret:
        try:
            event = stripe.Webhook.construct_event(payload, sig, webhook_secret)
        except stripe.SignatureVerificationError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature.")
    else:
        import json
        event = json.loads(payload)

    etype = event.get("type", "")

    if etype == "checkout.session.completed":
        obj = event["data"]["object"]
        api_key = (obj.get("metadata") or {}).get("api_key", "")
        customer_id = obj.get("customer", "")
        if api_key and os.getenv("DYNAMODB_TABLE"):
            update_key_tier(api_key, "pro", stripe_customer_id=customer_id)

    elif etype == "customer.subscription.deleted":
        obj = event["data"]["object"]
        customer_id = obj.get("customer", "")
        if customer_id and os.getenv("DYNAMODB_TABLE"):
            item = get_key_by_stripe_customer(customer_id)
            if item:
                update_key_tier(item["api_key"], "free")

    return {"received": True}
