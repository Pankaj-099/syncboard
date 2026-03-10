
import logging
from typing import Any, Optional
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.core.auth import AuthUser

logger = logging.getLogger(__name__)


def log_action(
    db: Session,
    user: AuthUser,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    entity_title: Optional[str] = None,
    changes: Optional[dict] = None,
):
    try:
        entry = AuditLog(
            org_id=user.org_id,
            user_id=user.user_id,
            user_name=getattr(user, "display_name", user.user_id),
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_title=entity_title,
            changes=changes,
        )
        db.add(entry)
        db.flush()  # write within existing transaction
    except Exception as e:
        logger.error(f"Failed to write audit log: {e}")


def diff_task(old_data: dict, new_data: dict) -> dict:
    changes = {}
    for key, new_val in new_data.items():
        old_val = old_data.get(key)
        if old_val != new_val and new_val is not None:
            changes[key] = {"from": str(old_val) if old_val else None, "to": str(new_val)}
    return changes
