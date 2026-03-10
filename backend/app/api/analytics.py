from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.auth import require_view, AuthUser
from app.core.redis_client import cache_get, cache_set
from app.models.task import Task, TaskStatus
from app.schema.analytics import AnalyticsResponse, StatusCount, PriorityCount, MemberStat

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("", response_model=AnalyticsResponse)
async def get_analytics(
    user: AuthUser = Depends(require_view),
    db: Session = Depends(get_db),
):
    cache_key = f"analytics:{user.org_id}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    tasks = db.query(Task).filter(Task.org_id == user.org_id).all()

    today = date.today()
    total = len(tasks)
    completed = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
    overdue = sum(
        1 for t in tasks
        if t.due_date and t.due_date < today and t.status != TaskStatus.COMPLETED
    )
    completion_rate = round((completed / total * 100), 1) if total > 0 else 0.0

    # By status
    status_counts: dict = {}
    for t in tasks:
        status_counts[t.status.value] = status_counts.get(t.status.value, 0) + 1
    by_status = [StatusCount(status=k, count=v) for k, v in status_counts.items()]

    # By priority
    priority_counts: dict = {}
    for t in tasks:
        priority_counts[t.priority] = priority_counts.get(t.priority, 0) + 1
    by_priority = [PriorityCount(priority=k, count=v) for k, v in priority_counts.items()]

    # By member
    member_stats: dict = {}
    for t in tasks:
        if t.assigned_to:
            uid = t.assigned_to
            name = t.assigned_to_name or uid
            if uid not in member_stats:
                member_stats[uid] = {"user_id": uid, "user_name": name, "assigned": 0, "completed": 0}
            member_stats[uid]["assigned"] += 1
            if t.status == TaskStatus.COMPLETED:
                member_stats[uid]["completed"] += 1
    by_member = [MemberStat(**v) for v in member_stats.values()]

    result = AnalyticsResponse(
        total_tasks=total,
        completed_tasks=completed,
        overdue_tasks=overdue,
        completion_rate=completion_rate,
        by_status=by_status,
        by_priority=by_priority,
        by_member=by_member,
    )

    cache_set(cache_key, result.model_dump(), ttl=60)
    return result
