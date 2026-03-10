
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List


class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: str
    task_id: str
    org_id: str
    user_id: str
    user_name: Optional[str] = None
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class CommentList(BaseModel):
    items: List[CommentResponse]
    total: int
