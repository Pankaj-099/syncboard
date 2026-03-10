import uuid
from datetime import datetime, timezone

def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)
from sqlalchemy import Column, String, Text, DateTime, JSON
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = Column(String, nullable=False, index=True)
    user_id = Column(String, nullable=False)
    user_name = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)   # e.g. "task.created"
    entity_type = Column(String(50), nullable=False)  # "task"
    entity_id = Column(String, nullable=True)
    entity_title = Column(String(255), nullable=True)
    changes = Column(JSON, nullable=True)          # {"field": [old, new]}
    created_at = Column(DateTime, default=utcnow, index=True)
