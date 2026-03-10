from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.auth import get_current_user, require_view, require_delete, require_create, require_edit, AuthUser
from app.core.redis_client import cache_get, cache_set, cache_delete_pattern
from app.core.websocket_manager import ws_manager, build_event
from app.models.task import Task, TaskStatus, TaskPriority
from app.schema.task import TaskCreate, TaskUpdate, TaskResponse
from app.services.audit_service import log_action, diff_task

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

CACHE_TTL = 30  # seconds


def _task_cache_key(org_id: str) -> str:
    return f"tasks:{org_id}:list"


@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    user: AuthUser = Depends(require_view),
    db: Session = Depends(get_db),
    status_filter: Optional[TaskStatus] = Query(None, alias="status"),
    priority: Optional[TaskPriority] = Query(None),
    assigned_to: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=200),
):
    # Try cache only for unfiltered full list
    if not status_filter and not priority and not assigned_to and page == 1:
        cached = cache_get(_task_cache_key(user.org_id))
        if cached:
            return cached

    query = db.query(Task).filter(Task.org_id == user.org_id)

    if status_filter:
        query = query.filter(Task.status == status_filter)
    if priority:
        query = query.filter(Task.priority == priority)
    if assigned_to:
        query = query.filter(Task.assigned_to == assigned_to)

    query = query.order_by(Task.created_at.desc())
    offset = (page - 1) * limit
    tasks = query.offset(offset).limit(limit).all()

    result = [TaskResponse.model_validate(t) for t in tasks]
    serialized = [r.model_dump() for r in result]

    if not status_filter and not priority and not assigned_to and page == 1:
        cache_set(_task_cache_key(user.org_id), serialized, ttl=CACHE_TTL)

    return result


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    user: AuthUser = Depends(require_create),
    db: Session = Depends(get_db),
):
    task = Task(
        title=task_data.title,
        description=task_data.description,
        status=task_data.status,
        priority=task_data.priority,
        org_id=user.org_id,
        created_by=user.user_id,
        assigned_to=task_data.assigned_to,
        assigned_to_name=task_data.assigned_to_name,
        due_date=task_data.due_date,
    )
    db.add(task)

    log_action(db, user, "task.created", "task",
               entity_id=task.id, entity_title=task.title)

    db.commit()
    db.refresh(task)

    cache_delete_pattern(_task_cache_key(user.org_id))

    await ws_manager.broadcast_to_org(user.org_id, build_event(
        "task.created",
        {"task": TaskResponse.model_validate(task).model_dump()},
        user_name=user.display_name,
    ))

    return task


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    user: AuthUser = Depends(require_view),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.org_id == user.org_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    user: AuthUser = Depends(require_edit),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.org_id == user.org_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    old_data = {
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "assigned_to": task.assigned_to,
        "due_date": str(task.due_date) if task.due_date else None,
    }

    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
    if task_data.status is not None:
        task.status = task_data.status
    if task_data.priority is not None:
        task.priority = task_data.priority
    if task_data.assigned_to is not None:
        task.assigned_to = task_data.assigned_to
    if task_data.assigned_to_name is not None:
        task.assigned_to_name = task_data.assigned_to_name
    if task_data.due_date is not None:
        task.due_date = task_data.due_date

    new_data = {
        "title": task.title,
        "description": task.description,
        "status": str(task.status),
        "priority": str(task.priority),
        "assigned_to": task.assigned_to,
        "due_date": str(task.due_date) if task.due_date else None,
    }
    changes = diff_task(old_data, new_data)

    log_action(db, user, "task.updated", "task",
               entity_id=task.id, entity_title=task.title, changes=changes)

    db.commit()
    db.refresh(task)

    cache_delete_pattern(_task_cache_key(user.org_id))

    await ws_manager.broadcast_to_org(user.org_id, build_event(
        "task.updated",
        {"task": TaskResponse.model_validate(task).model_dump()},
        user_name=user.display_name,
    ))

    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    user: AuthUser = Depends(require_delete),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.org_id == user.org_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    task_title = task.title
    log_action(db, user, "task.deleted", "task",
               entity_id=task_id, entity_title=task_title)

    db.delete(task)
    db.commit()

    cache_delete_pattern(_task_cache_key(user.org_id))

    await ws_manager.broadcast_to_org(user.org_id, build_event(
        "task.deleted",
        {"task_id": task_id, "title": task_title},
        user_name=user.display_name,
    ))

    return None
