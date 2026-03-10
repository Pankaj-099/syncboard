
import uuid
from datetime import datetime, timezone

def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from app.core.database import Base


class TaskComment(Base):
    __tablename__ = "task_comments"

    id         = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id    = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    org_id     = Column(String, nullable=False, index=True)
    user_id    = Column(String, nullable=False)
    user_name  = Column(String(255), nullable=True)
    content    = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow)
