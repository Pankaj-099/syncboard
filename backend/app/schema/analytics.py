from pydantic import BaseModel
from typing import List
from decimal import Decimal


class StatusCount(BaseModel):
    status: str
    count: int


class PriorityCount(BaseModel):
    priority: str
    count: int


class MemberStat(BaseModel):
    user_id: str
    user_name: str
    assigned: int
    completed: int


class CategoryTotal(BaseModel):
    category: str
    total: Decimal


class MonthlyTrend(BaseModel):
    month: str        # e.g. "2025-01"
    income: Decimal
    expense: Decimal
    net: Decimal


class FinancialSummary(BaseModel):
    total_income: Decimal
    total_expense: Decimal
    net_balance: Decimal
    by_category: List[CategoryTotal]
    monthly_trends: List[MonthlyTrend]


class AnalyticsResponse(BaseModel):
    total_tasks: int
    completed_tasks: int
    overdue_tasks: int
    completion_rate: float
    by_status: List[StatusCount]
    by_priority: List[PriorityCount]
    by_member: List[MemberStat]
    financial: FinancialSummary