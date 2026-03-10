from pydantic import BaseModel
from typing import List


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


class AnalyticsResponse(BaseModel):
    total_tasks: int
    completed_tasks: int
    overdue_tasks: int
    completion_rate: float
    by_status: List[StatusCount]
    by_priority: List[PriorityCount]
    by_member: List[MemberStat]
