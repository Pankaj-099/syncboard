"""
Pytest configuration and shared fixtures.
Uses SQLite test.db — reset between each test.
"""
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import ALL models before anything else so Base knows all tables
from app.models.task import Task, TaskStatus, TaskPriority  # noqa
from app.models.audit_log import AuditLog  # noqa
from app.models.comment import TaskComment  # noqa

from app.core.database import Base, get_db
from app.core.auth import get_current_user, require_view, require_create, require_edit, require_delete, AuthUser
from app.main import app

TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def make_mock_user(
    user_id: str = "user_test_123",
    org_id: str = "org_test_456",
    permissions: list = None,
    display_name: str = "Test User",
):
    if permissions is None:
        permissions = [
            "org:tasks:view",
            "org:tasks:create",
            "org:tasks:edit",
            "org:tasks:delete",
        ]
    return AuthUser(user_id=user_id, org_id=org_id, org_permissions=permissions, display_name=display_name)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    mock_user = make_mock_user()
    def allow(): return mock_user
    app.dependency_overrides[get_db]           = override_get_db
    app.dependency_overrides[get_current_user] = allow
    app.dependency_overrides[require_view]     = allow
    app.dependency_overrides[require_create]   = allow
    app.dependency_overrides[require_edit]     = allow
    app.dependency_overrides[require_delete]   = allow
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def viewer_client():
    """Client with only view permission — cannot create/edit/delete."""
    mock_user = make_mock_user(permissions=["org:tasks:view"])
    def allow():  return mock_user
    def forbid(): raise HTTPException(status_code=403, detail="permission required")
    app.dependency_overrides[get_db]           = override_get_db
    app.dependency_overrides[get_current_user] = allow
    app.dependency_overrides[require_view]     = allow
    app.dependency_overrides[require_create]   = forbid
    app.dependency_overrides[require_edit]     = forbid
    app.dependency_overrides[require_delete]   = forbid
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()