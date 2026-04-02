from collections import defaultdict
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import require_view, AuthUser
from app.core.redis_client import cache_get, cache_set
from app.models.task import Task, TaskStatus, RecordType
from app.schema.analytics import (
    AnalyticsResponse, StatusCount, PriorityCount,
    MemberStat, FinancialSummary, CategoryTotal, MonthlyTrend,
)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _build_financial_summary(tasks: list) -> FinancialSummary:
    total_income = Decimal(0)
    total_expense = Decimal(0)
    category_totals: dict = defaultdict(Decimal)
    monthly: dict = defaultdict(lambda: {"income": Decimal(0), "expense": Decimal(0)})

    for t in tasks:
        if t.amount is None or t.record_type == RecordType.NEUTRAL:
            continue

        amount = Decimal(str(t.amount))
        month_key = t.created_at.strftime("%Y-%m") if t.created_at else "unknown"

        if t.record_type == RecordType.INCOME:
            total_income += amount
            monthly[month_key]["income"] += amount
        elif t.record_type == RecordType.EXPENSE:
            total_expense += amount
            monthly[month_key]["expense"] += amount

        if t.category:
            category_totals[t.category] += amount

    return FinancialSummary(
        total_income=total_income,
        total_expense=total_expense,
        net_balance=total_income - total_expense,
        by_category=[CategoryTotal(category=k, total=v) for k, v in category_totals.items()],
        monthly_trends=[
            MonthlyTrend(
                month=month,
                income=data["income"],
                expense=data["expense"],
                net=data["income"] - data["expense"],
            )
            for month, data in sorted(monthly.items())
        ],
    )


def _build_analytics(tasks: list, org_id: str) -> AnalyticsResponse:
    today = date.today()
    total = len(tasks)
    completed = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
    overdue = sum(
        1 for t in tasks
        if t.due_date and t.due_date < today and t.status != TaskStatus.COMPLETED
    )

    status_counts: dict = defaultdict(int)
    priority_counts: dict = defaultdict(int)
    member_stats: dict = {}

    for t in tasks:
        status_counts[t.status.value] += 1
        priority_counts[t.priority] += 1

        if t.assigned_to:
            uid = t.assigned_to
            if uid not in member_stats:
                member_stats[uid] = {"user_id": uid, "user_name": t.assigned_to_name or uid, "assigned": 0, "completed": 0}
            member_stats[uid]["assigned"] += 1
            if t.status == TaskStatus.COMPLETED:
                member_stats[uid]["completed"] += 1

    return AnalyticsResponse(
        total_tasks=total,
        completed_tasks=completed,
        overdue_tasks=overdue,
        completion_rate=round(completed / total * 100, 1) if total else 0.0,
        by_status=[StatusCount(status=k, count=v) for k, v in status_counts.items()],
        by_priority=[PriorityCount(priority=k, count=v) for k, v in priority_counts.items()],
        by_member=[MemberStat(**v) for v in member_stats.values()],
        financial=_build_financial_summary(tasks),
    )


@router.get("", response_model=AnalyticsResponse)
async def get_analytics(
    user: AuthUser = Depends(require_view),
    db: Session = Depends(get_db),
):
    cache_key = f"analytics:{user.org_id}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    tasks = db.query(Task).filter(
        Task.org_id == user.org_id,
        Task.is_deleted == False,
    ).all()

    result = _build_analytics(tasks, user.org_id)
    cache_set(cache_key, result.model_dump(mode="json"), ttl=60)
    return result