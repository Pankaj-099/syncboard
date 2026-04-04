# SyncBoard

> B2B SaaS Kanban application for team task management — built with FastAPI, React, PostgreSQL, Redis, and Clerk.

🔗 **Live Demo:** [taskboard-frontend.vercel.app](https://taskboard-frontend-puce.vercel.app) &nbsp;|&nbsp; 📖 **API Docs:** [taskboard-backend-ecxj.onrender.com/docs](https://taskboard-backend-ecxj.onrender.com/docs)

---

## Finance Dashboard Assignment — Mapping

> This project was originally built as a B2B SaaS Kanban task management system.
> The architecture, access control patterns, and API design directly satisfy the requirements
> of the Finance Data Processing and Access Control Backend assignment.
> Below is the explicit mapping between assignment requirements and this implementation.

---

### 1. User and Role Management

| Assignment Requirement | Implementation |
|---|---|
| Creating and managing users | Handled via Clerk — users are provisioned on signup and synced via webhooks |
| Assigning roles | Clerk organization roles mapped to `viewer`, `analyst`, `admin` |
| Managing user status (active/inactive) | `/api/users/{id}/status` — PATCH endpoint to activate or deactivate any member |
| Restricting actions based on roles | JWT claims verified server-side on every request — no client-side trust |

**Role mapping:**

| Role | Permissions | Maps To |
|---|---|---|
| `viewer` | Read-only access to records and dashboard | `view` permission in JWT |
| `analyst` | Read access + full analytics and audit log access | `view` permission + analytics endpoints |
| `admin` | Full CRUD on records and user management | `create`, `edit`, `delete`, `view` in JWT |

Access control is enforced via FastAPI dependency injection — every route declares its required permission using `Depends(require_view)`, `Depends(require_create)`, etc. The permission is extracted directly from the verified Clerk JWT, with no extra database lookup.

---

### 2. Financial Records Management

The `Task` model maps directly to a financial record:

| Financial Field | Task Field | Type |
|---|---|---|
| Amount | `amount` | `Numeric(12, 2)` — precision-safe decimal |
| Type (income / expense) | `record_type` | `RecordType` enum: `income`, `expense`, `neutral` |
| Category | `category` | `String(100)` — e.g. Salary, Rent, Marketing |
| Date | `due_date` / `created_at` | `Date` / `DateTime` |
| Notes / Description | `description` | `Text` |
| Status | `status` | `pending`, `started`, `completed` |

**Supported operations:**

| Operation | Endpoint |
|---|---|
| Create a record | `POST /api/tasks` |
| List records | `GET /api/tasks` |
| Update a record | `PUT /api/tasks/{id}` |
| Soft delete a record | `DELETE /api/tasks/{id}` — sets `is_deleted=true`, preserves data |
| Filter by type | `GET /api/tasks?record_type=income` |
| Filter by category | `GET /api/tasks?category=Salary` |
| Filter by date / assignee / priority | `GET /api/tasks?assigned_to=...&priority=high` |
| Search by title or description | `GET /api/tasks?search=keyword` |
| Paginate | `GET /api/tasks?page=1&limit=20` |

**Assumption:** A financial record is modeled as a task entry with `amount` and `record_type` fields. This is a direct structural equivalent — the domain label differs but the data model, validation, and access control are identical.

---

### 3. Dashboard Summary APIs

| Requirement | Endpoint | Response Field |
|---|---|---|
| Total income | `GET /api/analytics` | `financial.total_income` |
| Total expenses | `GET /api/analytics` | `financial.total_expense` |
| Net balance | `GET /api/analytics` | `financial.net_balance` |
| Category-wise totals | `GET /api/analytics` | `financial.by_category` |
| Monthly / weekly trends | `GET /api/analytics` | `financial.monthly_trends` |
| Recent activity | `GET /api/audit-logs` | Paginated activity feed |
| Completion rate, tasks by status | `GET /api/analytics` | `completion_rate`, `by_status` |
| Tasks by priority and team member | `GET /api/analytics` | `by_priority`, `by_member` |

Analytics are computed server-side as pure functions (`_build_analytics`, `_build_financial_summary`) and cached in Redis with a 60-second TTL. The cache is invalidated automatically on any record mutation.

---

### 4. Access Control

Access control is enforced at the backend level using verified JWT claims from Clerk. The flow is:

```
Request → JWT verification → extract org_id + permissions → route handler
```

No action is trusted from the client. If a `viewer` attempts to call `POST /api/tasks`, the `require_create` dependency rejects the request with `403 Forbidden` before any business logic runs.

Implementation pattern: FastAPI `Depends()` — clean, testable, and applied per-route without middleware coupling.

---

### 5. Validation and Error Handling

| Concern | Implementation |
|---|---|
| Request validation | Pydantic v2 schemas on all request bodies |
| Amount must be positive | `@field_validator` on `TaskCreate` and `TaskUpdate` |
| Invalid enum values | Pydantic rejects automatically with `422 Unprocessable Entity` |
| Resource not found | `404 Not Found` with descriptive message |
| Unauthorized access | `403 Forbidden` via permission dependency |
| Rate limiting | `slowapi` — 60 requests/minute per user (configurable) |
| Frontend crash recovery | React `ErrorBoundary` wraps all async views |

---

### 6. Data Persistence

| Concern | Implementation |
|---|---|
| Database | PostgreSQL with SQLAlchemy 2.0 ORM |
| Migrations | Alembic — versioned, reversible, no manual SQL |
| Soft delete | `is_deleted` + `deleted_at` columns — records are never hard deleted |
| Caching | Redis with 30s TTL on record lists, graceful fallback if unavailable |

---

### Optional Enhancements Included

| Enhancement | Status |
|---|---|
| Token-based authentication | ✅ Clerk JWT verified on every request |
| Pagination | ✅ 20 records per page, configurable up to 100 |
| Search support | ✅ Full-text search on title and description |
| Soft delete | ✅ `is_deleted` flag with `deleted_at` timestamp |
| Rate limiting | ✅ slowapi, configurable via environment variable |
| Unit / integration tests | ✅ 28 passing pytest tests with in-memory SQLite |
| API documentation | ✅ Auto-generated at `/docs` (Swagger UI) |
| Audit logs | ✅ Field-level diffs on every mutation with timestamps |
| Real-time updates | ✅ WebSockets scoped per `org_id` |
| CI pipeline | ✅ GitHub Actions runs tests on every push |
| User status management | ✅ Activate/deactivate users via `/api/users/{id}/status` |
| Team management UI | ✅ Full team page with role and status controls |
| Mobile responsive | ✅ Hamburger nav, stacked layouts, bottom-sheet modals |

---

### Assumptions Made

1. User provisioning is delegated to Clerk — the backend does not store passwords or manage sessions directly.
2. A financial record is modeled as a task entry with `amount` and `record_type` fields — structurally equivalent to the assignment's financial entry model.
3. Organization-level isolation is the multi-tenancy boundary — all records, analytics, and audit logs are scoped to `org_id`.
4. Redis is optional — the app falls back to direct DB reads if Redis is unavailable, with no change in behavior.
5. Soft delete is used throughout — no record is permanently removed, preserving audit trail integrity.
6. User sync is event-driven — users are created/updated/deactivated in the DB automatically via Clerk webhook events.

---

## Features

**Core**
- Drag and drop Kanban board with three columns — To Do, In Progress, Done
- Full CRUD for financial records with amount, type, category, priority, assignee, and due date
- Real-time live updates across all browser tabs via WebSockets
- Optimistic UI updates with automatic rollback on failure
- Comments on records with real-time updates

**Authentication & Authorization**
- Organization-based multi-tenancy powered by Clerk
- Granular role-based permissions — `view`, `create`, `edit`, `delete`
- JWT claims verified on every request — no client-side trust
- Clerk webhook integration for org membership sync

**Team Management**
- `/api/users` — list all org members with role and status
- `/api/users/{id}/status` — activate or deactivate a user (admin only)
- `/api/users/{id}/role` — change a user's role (admin only)
- Users automatically synced from Clerk via `organizationMembership` webhook events
- Team page on frontend with role badges, status badges, and inline controls

**Financial Records**
- Records support `amount`, `record_type` (income/expense/neutral), and `category`
- Amount validated as positive number via Pydantic field validator
- Filter records by type, category, priority, assignee, or free-text search

**Performance**
- Redis caching on record list with automatic cache invalidation
- Graceful Redis fallback — app works normally if Redis is unavailable
- Paginated record loading — 20 per page
- Search and server-side filtering by type, category, priority, assignee

**Observability**
- Structured audit logging with field-level diffs on every mutation
- Full activity feed with timestamps and change history
- Analytics dashboard — financial summary, completion rate, trends, category totals

**Code Quality**
- 28 passing tests with in-memory SQLite and dependency injection overrides
- Alembic database migrations — no manual SQL
- Rate limiting with slowapi
- React ErrorBoundary for graceful crash recovery
- Skeleton loaders on all async views
- Mobile responsive — hamburger nav, stacked layouts, bottom-sheet modals on mobile

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Styling | CSS with custom design system |
| Auth | Clerk (JWT + Organizations + Webhooks) |
| Drag & Drop | @dnd-kit/core |
| Charts | Recharts |
| Backend | FastAPI, Python 3.12 |
| Database | PostgreSQL + SQLAlchemy 2.0 |
| Migrations | Alembic |
| Cache | Redis |
| Real-time | WebSockets (native FastAPI) |
| Testing | pytest, httpx |
| Package Manager | uv (backend), npm (frontend) |

---

## Project Structure

```
taskboard/
|── .github/
|   |── workflows/
|       |── ci.yml
├── backend/
│   ├── app/
│   │   ├── api/              # Route handlers
│   │   │   ├── tasks.py      # CRUD + filtering + pagination + soft delete
│   │   │   ├── analytics.py  # Financial summary + aggregated stats
│   │   │   ├── audit_logs.py # Activity feed
│   │   │   ├── users.py      # User management — status + role updates
│   │   │   ├── websocket.py  # WS connection manager
│   │   │   └── webhooks.py   # Clerk org membership + billing webhooks
│   │   ├── core/
│   │   │   ├── auth.py       # Clerk JWT verification + RBAC
│   │   │   ├── config.py     # Environment settings
│   │   │   ├── database.py   # SQLAlchemy engine + session
│   │   │   ├── redis_client.py
│   │   │   └── websocket_manager.py
│   │   ├── models/           # SQLAlchemy ORM models
│   │   │   ├── task.py       # Task + RecordType + soft delete
│   │   │   ├── user.py       # User + UserRole + is_active
│   │   │   ├── audit_log.py
│   │   │   └── comment.py
│   │   ├── schema/           # Pydantic request/response schemas
│   │   └── services/
│   │       └── audit_service.py  # Field-level diff logging
│   ├── alembic/              # Database migrations
│   ├── tests/                # pytest suite (28 tests)
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── pyproject.toml
│
└── frontend/
    └── src/
        ├── components/
        │   ├── KanbanBoard.tsx   # Drag and drop board
        │   ├── TaskCard.tsx      # Card with amount, type, category, priority
        │   ├── TaskForm.tsx      # Create/edit modal with finance fields
        │   ├── Layout.tsx        # Nav with hamburger menu for mobile
        │   ├── Skeleton.tsx      # Loading skeletons
        │   └── ErrorBoundary.tsx
        ├── pages/
        │   ├── DashboardPage.tsx # Kanban + filters + pagination
        │   ├── AnalyticsPage.tsx # Financial summary + Recharts charts
        │   ├── ActivityPage.tsx  # Audit log feed
        │   └── UsersPage.tsx     # Team management — roles + status
        ├── hooks/
        │   └── useWebSocket.ts   # Auto-reconnecting WS hook
        └── services/
            └── api.ts            # Typed API client
```

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL
- Docker Desktop (for Redis)
- A [Clerk](https://clerk.com) account

---

### Backend Setup

**1. Clone and install dependencies**

```bash
cd taskboard_backend
uv sync
```

**2. Create your `.env` file**

```bash
cp .env.example .env
```

Fill in your values:

```env
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

DATABASE_URL=postgresql://user:password@localhost:5432/taskboard

FRONTEND_URL=http://localhost:5173

REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379

RATE_LIMIT_PER_MINUTE=60
```

**3. Start Redis**

```bash
docker run -d -p 6379:6379 --name taskboard-redis redis:alpine
```

**4. Run database migrations**

```bash
alembic upgrade head
```

**5. Start the backend**

```bash
uv run start.py
```

API runs at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

---

### Frontend Setup

**1. Install dependencies**

```bash
cd taskboard_frontend
npm install
```

**2. Create your `.env.local` file**

```env
VITE_API_URL=http://localhost:8000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

**3. Start the frontend**

```bash
npm run dev
```

App runs at `http://localhost:5173`

---

### Running Tests

```bash
cd taskboard_backend
uv run pytest tests/ -v
```

```
28 passed in 1.56s
```

---

## API Reference

Full interactive documentation is available at `http://localhost:8000/docs` when the backend is running.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | List records (filterable by type, category, search, paginated) |
| `POST` | `/api/tasks` | Create a record |
| `PUT` | `/api/tasks/{id}` | Update a record |
| `DELETE` | `/api/tasks/{id}` | Soft delete a record |
| `GET` | `/api/analytics` | Financial summary + org-level analytics |
| `GET` | `/api/audit-logs` | Paginated activity feed |
| `GET` | `/api/users` | List all org members |
| `PATCH` | `/api/users/{id}/status` | Activate or deactivate a user (admin only) |
| `PATCH` | `/api/users/{id}/role` | Update a user's role (admin only) |
| `WS` | `/ws/{org_id}` | WebSocket for live updates |
| `GET` | `/health` | Health check |
| `POST` | `/api/tasks/{id}/comments` | Comment on a record |

---

## Database Migrations

This project uses Alembic for all schema changes. Never modify the database manually.

```bash
# Apply all pending migrations
alembic upgrade head

# Check current version
alembic current

# Create a new migration after changing a model
alembic revision --autogenerate -m "describe your change"

# Rollback one migration
alembic downgrade -1
```

---

## Environment Variables

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `CLERK_SECRET_KEY` | ✅ | Clerk backend API key |
| `CLERK_PUBLISHABLE_KEY` | ✅ | Clerk frontend key |
| `CLERK_WEBHOOK_SECRET` | ✅ | For verifying Clerk webhooks |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `FRONTEND_URL` | ✅ | Allowed CORS origin |
| `REDIS_URL` | ❌ | Redis connection string |
| `REDIS_ENABLED` | ❌ | Enable Redis caching (default: false) |
| `RATE_LIMIT_PER_MINUTE` | ❌ | API rate limit (default: 60) |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Backend URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key |

---

## Architecture Decisions

**Why Clerk for auth?**
Clerk handles organization management, JWT issuance, and user provisioning out of the box. The backend verifies JWT claims on every request and extracts org permissions directly from the token — no extra DB lookup needed.

**Why Redis caching?**
Record lists are the most frequently read resource. Redis caches the unfiltered list per org with a 30-second TTL and invalidates on any mutation. The app falls back gracefully if Redis is unavailable.

**Why WebSockets per org?**
Broadcasts are scoped to `org_id` so users only receive events relevant to their organization. The connection manager maintains a registry of active connections per org and handles cleanup automatically.

**Why Alembic over create_all?**
`Base.metadata.create_all()` cannot handle schema changes on existing tables. Alembic provides versioned, reversible migrations that work safely in production.

**Why soft delete?**
Hard deletes destroy audit trail integrity. Soft delete preserves the full history of every record mutation, which is essential for a finance system where data lineage matters.

**Why event-driven user sync?**
Instead of polling Clerk's API for user data, the backend listens to `organizationMembership` webhook events. This keeps the DB in sync in real time with zero polling overhead.

**Why pure functions for analytics?**
`_build_analytics` and `_build_financial_summary` are stateless pure functions that take a list of records and return aggregated data. This makes them independently testable and easy to cache.

---

## Deployment

| Service | Provider |
|---------|----------|
| Frontend | Vercel |
| Backend | Render |
| Database | PostgreSQL |
| Redis | Upstash (serverless Redis — no Docker needed) |
| Auth | Clerk |
| CI/CD | GitHub Actions |
