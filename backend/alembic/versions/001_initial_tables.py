from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    existing_tables = inspector.get_table_names()

    if 'tasks' not in existing_tables:
        op.create_table(
            'tasks',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('title', sa.String(255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('status', sa.Enum('pending', 'started', 'completed', name='taskstatus'), nullable=False),
            sa.Column('org_id', sa.String(), nullable=False),
            sa.Column('created_by', sa.String(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_tasks_org_id', 'tasks', ['org_id'])


def downgrade() -> None:
    op.drop_index('ix_tasks_org_id', table_name='tasks')
    op.drop_table('tasks')
    op.execute("DROP TYPE IF EXISTS taskstatus")