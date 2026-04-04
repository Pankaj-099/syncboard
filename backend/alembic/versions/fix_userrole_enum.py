"""fix userrole enum to uppercase

Revision ID: fix_userrole_enum
Revises: add_users_table
Create Date: 2026-04-04

"""
from typing import Sequence, Union
from alembic import op

revision: str = 'fix_userrole_enum'
down_revision: Union[str, None] = 'add_users_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE varchar(50)")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("CREATE TYPE userrole AS ENUM ('VIEWER', 'ANALYST', 'ADMIN')")
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::userrole")


def downgrade() -> None:
    pass