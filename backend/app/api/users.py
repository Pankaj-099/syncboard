from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.auth import require_view, AuthUser
from app.models.user import User
from app.schema.user import UserResponse, UserStatusUpdate, UserRoleUpdate

router = APIRouter(prefix="/api/users", tags=["users"])


def get_user_or_404(db: Session, user_id: str, org_id: str) -> User:
    user = db.query(User).filter(
        User.id == user_id,
        User.org_id == org_id,
    ).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def require_admin(user: AuthUser = Depends(require_view)) -> AuthUser:
    """Only admins (users with all permissions) can manage other users."""
    if not (user.can_create and user.can_edit and user.can_delete):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin permission required")
    return user


@router.get("", response_model=List[UserResponse])
async def list_users(
    user: AuthUser = Depends(require_view),
    db: Session = Depends(get_db),
):
    """List all users in the organization."""
    return db.query(User).filter(User.org_id == user.org_id).order_by(User.created_at).all()


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    user: AuthUser = Depends(require_view),
    db: Session = Depends(get_db),
):
    """Get a specific user by ID."""
    return get_user_or_404(db, user_id, user.org_id)


@router.patch("/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: str,
    body: UserStatusUpdate,
    user: AuthUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Activate or deactivate a user. Admin only."""
    if user_id == user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own status"
        )
    member = get_user_or_404(db, user_id, user.org_id)
    member.is_active = body.is_active
    db.commit()
    db.refresh(member)
    return member


@router.patch("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: str,
    body: UserRoleUpdate,
    user: AuthUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update a user's role. Admin only."""
    if user_id == user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role"
        )
    member = get_user_or_404(db, user_id, user.org_id)
    member.role = body.role
    db.commit()
    db.refresh(member)
    return member
