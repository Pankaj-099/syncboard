from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import require_view, AuthUser
from app.models.audit_log import AuditLog
from app.schema.audit_log import AuditLogList, AuditLogResponse

router = APIRouter(prefix="/api/audit-logs", tags=["audit-logs"])


@router.get("", response_model=AuditLogList)
async def list_audit_logs(
    user: AuthUser = Depends(require_view),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
):
    query = (
        db.query(AuditLog)
        .filter(AuditLog.org_id == user.org_id)
        .order_by(AuditLog.created_at.desc())
    )
    total = query.count()
    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()

    return AuditLogList(
        items=[AuditLogResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        limit=limit,
    )
