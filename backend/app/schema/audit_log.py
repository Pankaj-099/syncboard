from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Any


class AuditLogResponse(BaseModel):
    id: str
    org_id: str
    user_id: str
    user_name: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    entity_title: Optional[str] = None
    changes: Optional[Any] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogList(BaseModel):
    items: list[AuditLogResponse]
    total: int
    page: int
    limit: int
