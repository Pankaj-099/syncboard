from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, field_validator
from typing import Optional
from app.models.task import TaskStatus, TaskPriority, RecordType


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.MEDIUM
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    due_date: Optional[date] = None

    # Finance fields
    amount: Optional[Decimal] = None
    record_type: Optional[RecordType] = RecordType.NEUTRAL
    category: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError("Amount must be a positive number")
        return v


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    due_date: Optional[date] = None

    # Finance fields
    amount: Optional[Decimal] = None
    record_type: Optional[RecordType] = None
    category: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError("Amount must be a positive number")
        return v


class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: TaskPriority
    org_id: str
    created_by: str
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    due_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    # Finance fields
    amount: Optional[Decimal] = None
    record_type: Optional[RecordType] = None
    category: Optional[str] = None

    # Soft delete (expose deleted_at so audit log can show it)
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True