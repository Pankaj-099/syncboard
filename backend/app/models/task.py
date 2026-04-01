import uuid
from datetime import datetime, timezone

def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)

from sqlalchemy import Column, String, Text, DateTime, Enum, Date, Numeric, Boolean
import enum
from app.core.database import Base


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    STARTED = "started"
    COMPLETED = "completed"


class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class RecordType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"
    NEUTRAL = "neutral"  # for tasks that aren't financial


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(TaskStatus), nullable=False, default=TaskStatus.PENDING)
    priority = Column(String(10), nullable=False, default="medium")
    org_id = Column(String, nullable=False, index=True)
    created_by = Column(String, nullable=False)
    assigned_to = Column(String, nullable=True)
    assigned_to_name = Column(String(255), nullable=True)
    due_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # --- Finance fields ---
    amount = Column(Numeric(12, 2), nullable=True)           # e.g. 1500.00
    record_type = Column(Enum(RecordType), nullable=True, default=RecordType.NEUTRAL)
    category = Column(String(100), nullable=True)            # e.g. "Salary", "Rent"

    # --- Soft delete ---
    is_deleted = Column(Boolean, nullable=False, default=False)
    deleted_at = Column(DateTime, nullable=True)