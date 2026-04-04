import uuid
from datetime import datetime, timezone

def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)

from sqlalchemy import Column, String, Boolean, DateTime, Enum
import enum
from app.core.database import Base


class UserRole(str, enum.Enum):
    VIEWER  = "viewer"
    ANALYST = "analyst"
    ADMIN   = "admin"


class User(Base):
    __tablename__ = "users"

    id         = Column(String, primary_key=True)           # Clerk user_id
    org_id     = Column(String, nullable=False, index=True)
    email      = Column(String, nullable=True)
    full_name  = Column(String(255), nullable=True)
    role       = Column(Enum(UserRole), nullable=False, default=UserRole.VIEWER)
    is_active  = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
