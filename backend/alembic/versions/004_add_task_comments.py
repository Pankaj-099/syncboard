

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'task_comments',
        sa.Column('id',         sa.String(),      nullable=False),
        sa.Column('task_id',    sa.String(),      nullable=False),
        sa.Column('org_id',     sa.String(),      nullable=False),
        sa.Column('user_id',    sa.String(),      nullable=False),
        sa.Column('user_name',  sa.String(255),   nullable=True),
        sa.Column('content',    sa.Text(),        nullable=False),
        sa.Column('created_at', sa.DateTime(),    nullable=True),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_task_comments_task_id', 'task_comments', ['task_id'])
    op.create_index('ix_task_comments_org_id',  'task_comments', ['org_id'])


def downgrade() -> None:
    op.drop_index('ix_task_comments_org_id',  table_name='task_comments')
    op.drop_index('ix_task_comments_task_id', table_name='task_comments')
    op.drop_table('task_comments')
