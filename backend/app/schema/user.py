from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from app.models.user import UserRole


class UserResponse(BaseModel):
    id: str
    org_id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserRoleUpdate(BaseModel):
    role: UserRole
