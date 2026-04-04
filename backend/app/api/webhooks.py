import json
from fastapi import APIRouter, Request, HTTPException, status
from svix.webhooks import Webhook, WebhookVerificationError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.clerk import Clerk
from app.core.database import get_db
from app.models.user import User, UserRole

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

PRO_TIER_SLUG    = "pro_tier"
FREE_TIER_LIMIT  = settings.FREE_TIER_LIMIT
UNLIMITED_LIMIT  = 1000000


def set_org_member_limit(org_id: str, limit: int):
    Clerk.organizations.update(
        organization_id=org_id,
        max_allowed_memberships=limit
    )


def has_active_pro_plan(items: list) -> bool:
    return any(
        item.get("plan", {}).get("slug") == PRO_TIER_SLUG
        and item.get("status") == "active"
        for item in items
    )


def clerk_role_to_user_role(clerk_role: str) -> UserRole:
    """Map Clerk org role to our UserRole enum."""
    role_map = {
        "admin":  UserRole.ADMIN,
        "basic_member": UserRole.VIEWER,
        "analyst": UserRole.ANALYST,
    }
    return role_map.get(clerk_role, UserRole.VIEWER)


def sync_user(db: Session, user_id: str, org_id: str, email: str, full_name: str, role: str):
    """Create or update a user record from Clerk webhook data."""
    user = db.query(User).filter(User.id == user_id, User.org_id == org_id).first()
    if user:
        user.email     = email
        user.full_name = full_name
        user.role      = clerk_role_to_user_role(role)
        user.is_active = True
    else:
        user = User(
            id        = user_id,
            org_id    = org_id,
            email     = email,
            full_name = full_name,
            role      = clerk_role_to_user_role(role),
            is_active = True,
        )
        db.add(user)
    db.commit()


@router.post("/clerk")
async def clerk_webhook(request: Request):
    payload = await request.body()
    headers = dict(request.headers)

    if settings.CLERK_WEBHOOK_SECRET:
        try:
            wh    = Webhook(settings.CLERK_WEBHOOK_SECRET)
            event = wh.verify(payload, headers)
        except WebhookVerificationError:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid signature")
    else:
        event = json.loads(payload)

    event_type = event.get("type")
    data       = event.get("data", {})

    # ── Billing events ──
    if event_type in ["subscription.created", "subscription.updated"]:
        org_id = data.get("payer", {}).get("organization_id")
        if org_id:
            limit = (UNLIMITED_LIMIT if has_active_pro_plan(data.get("items", []))
                     else FREE_TIER_LIMIT)
            set_org_member_limit(org_id, limit)

    elif event_type in ["subscription.deleted", "subscription.cancelled"]:
        org_id = data.get("payer", {}).get("organization_id")
        if org_id:
            set_org_member_limit(org_id, FREE_TIER_LIMIT)

    # ── Org membership events — sync users ──
    elif event_type == "organizationMembership.created":
        db = next(get_db())
        try:
            user_id   = data.get("public_user_data", {}).get("user_id")
            org_id    = data.get("organization", {}).get("id")
            email     = data.get("public_user_data", {}).get("identifier", "")
            first     = data.get("public_user_data", {}).get("first_name", "") or ""
            last      = data.get("public_user_data", {}).get("last_name", "") or ""
            full_name = f"{first} {last}".strip()
            role      = data.get("role", "basic_member")
            if user_id and org_id:
                sync_user(db, user_id, org_id, email, full_name, role)
        finally:
            db.close()

    elif event_type == "organizationMembership.updated":
        db = next(get_db())
        try:
            user_id = data.get("public_user_data", {}).get("user_id")
            org_id  = data.get("organization", {}).get("id")
            role    = data.get("role", "basic_member")
            if user_id and org_id:
                user = db.query(User).filter(User.id == user_id, User.org_id == org_id).first()
                if user:
                    user.role = clerk_role_to_user_role(role)
                    db.commit()
        finally:
            db.close()

    elif event_type == "organizationMembership.deleted":
        db = next(get_db())
        try:
            user_id = data.get("public_user_data", {}).get("user_id")
            org_id  = data.get("organization", {}).get("id")
            if user_id and org_id:
                user = db.query(User).filter(User.id == user_id, User.org_id == org_id).first()
                if user:
                    user.is_active = False   # soft deactivate on membership removal
                    db.commit()
        finally:
            db.close()

    return {"received": True}
