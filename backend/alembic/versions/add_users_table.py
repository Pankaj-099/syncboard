"""add users table

Revision ID: add_users_table
Revises: 26c3e15bf360
Create Date: 2026-04-04

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision: str = 'add_users_table'
down_revision: Union[str, None] = '26c3e15bf360'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)

    if 'users' not in inspector.get_table_names():
        op.create_table(
            'users',
            sa.Column('id',         sa.String(),     nullable=False),
            sa.Column('org_id',     sa.String(),     nullable=False),
            sa.Column('email',      sa.String(),     nullable=True),
            sa.Column('full_name',  sa.String(255),  nullable=True),
            sa.Column('role',       sa.Enum('viewer', 'analyst', 'admin', name='userrole'), nullable=False),
            sa.Column('is_active',  sa.Boolean(),    nullable=False, server_default='true'),
            sa.Column('created_at', sa.DateTime(),   nullable=True),
            sa.Column('updated_at', sa.DateTime(),   nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_users_org_id', 'users', ['org_id'])


def downgrade() -> None:
    op.drop_index('ix_users_org_id', table_name='users')
    op.drop_table('users')
    op.execute("DROP TYPE IF EXISTS userrole")