from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.auth import require_view, require_delete, require_create, require_edit, AuthUser
from app.core.redis_client import cache_get, cache_set, cache_delete_pattern
from app.core.websocket_manager import ws_manager, build_event
from app.models.task import Task, TaskStatus, TaskPriority, RecordType
from app.schema.task import TaskCreate, TaskUpdate, TaskResponse
from app.services.audit_service import log_action, diff_task

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

CACHE_TTL = 30
CACHE_KEY = lambda org_id: f"tasks:{org_id}:list"
utcnow = lambda: datetime.now(timezone.utc).replace(tzinfo=None)


def get_task_or_404(db: Session, task_id: str, org_id: str) -> Task:
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.org_id == org_id,
        Task.is_deleted == False,
    ).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    user: AuthUser = Depends(require_view),
    db: Session = Depends(get_db),
    status_filter: Optional[TaskStatus] = Query(None, alias="status"),
    priority: Optional[TaskPriority] = Query(None),
    assigned_to: Optional[str] = Query(None),
    record_type: Optional[RecordType] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    is_unfiltered = not any([status_filter, priority, assigned_to, record_type, category, search]) and page == 1
    if is_unfiltered:
        cached = cache_get(CACHE_KEY(user.org_id))
        if cached:
            return cached

    query = db.query(Task).filter(Task.org_id == user.org_id, Task.is_deleted == False)

    filters = {
        Task.status: status_filter,
        Task.priority: priority,
        Task.assigned_to: assigned_to,
        Task.record_type: record_type,
        Task.category: category,
    }
    for column, value in filters.items():
        if value:
            query = query.filter(column == value)

    if search:
        query = query.filter(Task.title.ilike(f"%{search}%") | Task.description.ilike(f"%{search}%"))

    tasks = query.order_by(Task.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    result = [TaskResponse.model_validate(t) for t in tasks]

    if is_unfiltered:
        cache_set(CACHE_KEY(user.org_id), [r.model_dump(mode="json") for r in result], ttl=CACHE_TTL)

    return result


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    user: AuthUser = Depends(require_create),
    db: Session = Depends(get_db),
):
    task = Task(**task_data.model_dump(), org_id=user.org_id, created_by=user.user_id)
    db.add(task)
    log_action(db, user, "task.created", "task", entity_id=task.id, entity_title=task.title)
    db.commit()
    db.refresh(task)

    cache_delete_pattern(CACHE_KEY(user.org_id))
    await ws_manager.broadcast_to_org(user.org_id, build_event(
        "task.created", {"task": TaskResponse.model_validate(task).model_dump(mode="json")},
        user_name=user.display_name,
    ))
    return task


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    user: AuthUser = Depends(require_view),
    db: Session = Depends(get_db),
):
    return get_task_or_404(db, task_id, user.org_id)


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    user: AuthUser = Depends(require_edit),
    db: Session = Depends(get_db),
):
    task = get_task_or_404(db, task_id, user.org_id)

    old_data = TaskResponse.model_validate(task).model_dump(mode="json")
    for field, value in task_data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    changes = diff_task(old_data, TaskResponse.model_validate(task).model_dump(mode="json"))
    log_action(db, user, "task.updated", "task", entity_id=task.id, entity_title=task.title, changes=changes)
    db.commit()
    db.refresh(task)

    cache_delete_pattern(CACHE_KEY(user.org_id))
    await ws_manager.broadcast_to_org(user.org_id, build_event(
        "task.updated", {"task": TaskResponse.model_validate(task).model_dump(mode="json")},
        user_name=user.display_name,
    ))
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    user: AuthUser = Depends(require_delete),
    db: Session = Depends(get_db),
):
    task = get_task_or_404(db, task_id, user.org_id)
    task.is_deleted = True
    task.deleted_at = utcnow()

    log_action(db, user, "task.deleted", "task", entity_id=task.id, entity_title=task.title)
    db.commit()

    cache_delete_pattern(CACHE_KEY(user.org_id))
    await ws_manager.broadcast_to_org(user.org_id, build_event(
        "task.deleted", {"task_id": task.id, "title": task.title},
        user_name=user.display_name,
    ))