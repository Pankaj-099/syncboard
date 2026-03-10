
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('tasks', sa.Column('priority', sa.String(10), nullable=False, server_default='medium'))
    op.add_column('tasks', sa.Column('assigned_to', sa.String(), nullable=True))
    op.add_column('tasks', sa.Column('assigned_to_name', sa.String(255), nullable=True))
    op.add_column('tasks', sa.Column('due_date', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('tasks', 'due_date')
    op.drop_column('tasks', 'assigned_to_name')
    op.drop_column('tasks', 'assigned_to')
    op.drop_column('tasks', 'priority')
