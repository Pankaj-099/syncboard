"""add finance and soft delete fields

Revision ID: 26c3e15bf360
Revises: 004
Create Date: 2026-04-01 22:54:16.307625

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


revision: str = '26c3e15bf360'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    existing_indexes = [idx['name'] for idx in inspector.get_indexes('audit_logs')]

    if 'ix_audit_logs_org_date' in existing_indexes:
        op.drop_index('ix_audit_logs_org_date', table_name='audit_logs')

    existing_indexes_comments = [idx['name'] for idx in inspector.get_indexes('task_comments')]
    if 'ix_task_comments_created_at' in existing_indexes_comments:
        op.drop_index('ix_task_comments_created_at', table_name='task_comments')

    existing_columns = [col['name'] for col in inspector.get_columns('tasks')]

    if 'amount' not in existing_columns:
        op.add_column('tasks', sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=True))
    if 'record_type' not in existing_columns:
        op.add_column('tasks', sa.Column('record_type', sa.Enum('INCOME', 'EXPENSE', 'NEUTRAL', name='recordtype'), nullable=True))
    if 'category' not in existing_columns:
        op.add_column('tasks', sa.Column('category', sa.String(length=100), nullable=True))
    if 'is_deleted' not in existing_columns:
        op.add_column('tasks', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'))
    if 'deleted_at' not in existing_columns:
        op.add_column('tasks', sa.Column('deleted_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('tasks', 'deleted_at')
    op.drop_column('tasks', 'is_deleted')
    op.drop_column('tasks', 'category')
    op.drop_column('tasks', 'record_type')
    op.drop_column('tasks', 'amount')