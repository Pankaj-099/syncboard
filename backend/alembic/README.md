# Alembic Database Migrations

## Setup (first time only)
```bash
pip install alembic
```

## Common Commands

```bash
# Apply all pending migrations (run this after pulling new code)
alembic upgrade head

# Check current migration version
alembic current

# See migration history
alembic history

# Create a new migration after changing a model
alembic revision --autogenerate -m "describe your change here"

# Rollback one migration
alembic downgrade -1

# Rollback all migrations
alembic downgrade base
```

## Migration Files
- `001` — initial tasks table
- `002` — add priority, assigned_to, assigned_to_name, due_date to tasks
- `003` — add audit_logs table

## Important
- Never edit existing migration files after they have been run
- Always create a new migration file for schema changes
- Never use Base.metadata.create_all() in production — use alembic upgrade head instead
