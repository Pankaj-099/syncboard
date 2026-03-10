
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.auth import get_current_user, require_view, require_create, AuthUser
from app.core.websocket_manager import ws_manager, build_event
from app.models.comment import TaskComment
from app.models.task import Task
from app.schema.comment import CommentCreate, CommentResponse, CommentList

router = APIRouter(prefix="/api/tasks", tags=["comments"])


@router.get("/{task_id}/comments", response_model=CommentList)
async def get_comments(
    task_id: str,
    user: AuthUser = Depends(require_view),
    db: Session = Depends(get_db),
):
    # Verify task belongs to org
    task = db.query(Task).filter(Task.id == task_id, Task.org_id == user.org_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    comments = (
        db.query(TaskComment)
        .filter(TaskComment.task_id == task_id, TaskComment.org_id == user.org_id)
        .order_by(TaskComment.created_at.asc())
        .all()
    )

    return CommentList(
        items=[CommentResponse.model_validate(c) for c in comments],
        total=len(comments),
    )


@router.post("/{task_id}/comments", response_model=CommentResponse, status_code=201)
async def create_comment(
    task_id: str,
    data: CommentCreate,
    user: AuthUser = Depends(require_create),
    db: Session = Depends(get_db),
):
    if not data.content.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty")

    task = db.query(Task).filter(Task.id == task_id, Task.org_id == user.org_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    comment = TaskComment(
        task_id=task_id,
        org_id=user.org_id,
        user_id=user.user_id,
        user_name=user.display_name,
        content=data.content.strip(),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # Broadcast to org via WebSocket
    await ws_manager.broadcast_to_org(user.org_id, build_event(
        "comment.created",
        {
            "comment": CommentResponse.model_validate(comment).model_dump(),
            "task_id": task_id,
            "task_title": task.title,
        },
        user_name=user.display_name,
    ))

    return comment


@router.delete("/{task_id}/comments/{comment_id}", status_code=204)
async def delete_comment(
    task_id: str,
    comment_id: str,
    user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    comment = db.query(TaskComment).filter(
        TaskComment.id == comment_id,
        TaskComment.task_id == task_id,
        TaskComment.org_id == user.org_id,
    ).first()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Only the comment author can delete their comment
    if comment.user_id != user.user_id:
        raise HTTPException(status_code=403, detail="You can only delete your own comments")

    db.delete(comment)
    db.commit()
    return None
