# TaskBoard

> B2B SaaS Kanban application for team task management — built with FastAPI, React, PostgreSQL, Redis, and Clerk.

---

## Features

**Core**
- Drag and drop Kanban board with three columns — To Do, In Progress, Done
- Full CRUD for tasks with priority, assignee, and due date
- Real-time live updates across all browser tabs via WebSockets
- Optimistic UI updates with automatic rollback on failure
- Comments on tasks with real-time updates

**Authentication & Authorization**
- Organization-based multi-tenancy powered by Clerk
- Granular role-based permissions — `view`, `create`, `edit`, `delete`
- JWT claims verified on every request — no client-side trust
- Clerk webhook integration for org membership sync

**Performance**
- Redis caching on task list with automatic cache invalidation
- Graceful Redis fallback — app works normally if Redis is unavailable
- Paginated task loading — 20 tasks per page
- Client-side search with server-side priority and assignee filtering

**Observability**
- Structured audit logging with field-level diffs on every mutation
- Full activity feed with timestamps and change history
- Analytics dashboard — completion rate, tasks by status, priority, and team member

**Code Quality**
- 28 passing tests with in-memory SQLite and dependency injection overrides
- Alembic database migrations — no manual SQL
- Rate limiting with slowapi
- React ErrorBoundary for graceful crash recovery
- Skeleton loaders on all async views

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
├── taskboard_backend/
│   ├── app/
│   │   ├── api/              # Route handlers
│   │   │   ├── tasks.py      # CRUD + filtering + pagination
│   │   │   ├── analytics.py  # Aggregated stats
│   │   │   ├── audit_logs.py # Activity feed
│   │   │   ├── websocket.py  # WS connection manager
│   │   │   └── webhooks.py   # Clerk billing webhooks
│   │   ├── core/
│   │   │   ├── auth.py       # Clerk JWT verification + RBAC
│   │   │   ├── config.py     # Environment settings
│   │   │   ├── database.py   # SQLAlchemy engine + session
│   │   │   ├── redis_client.py
│   │   │   └── websocket_manager.py
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schema/           # Pydantic request/response schemas
│   │   └── services/
│   │       └── audit_service.py  # Field-level diff logging
│   ├── alembic/              # Database migrations
│   ├── tests/                # pytest suite (28 tests)
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── pyproject.toml
│
└── taskboard_frontend/
    └── src/
        ├── components/
        │   ├── KanbanBoard.tsx   # Drag and drop board
        │   ├── TaskCard.tsx      # Card with priority, assignee, due date
        │   ├── TaskForm.tsx      # Create/edit modal
        │   ├── Skeleton.tsx      # Loading skeletons
        │   └── ErrorBoundary.tsx
        ├── pages/
        │   ├── DashboardPage.tsx # Kanban + filters + pagination
        │   ├── AnalyticsPage.tsx # Recharts charts
        │   └── ActivityPage.tsx  # Audit log feed
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
| `GET` | `/api/tasks` | List tasks (filterable, paginated) |
| `POST` | `/api/tasks` | Create a task |
| `PUT` | `/api/tasks/{id}` | Update a task |
| `DELETE` | `/api/tasks/{id}` | Delete a task |
| `GET` | `/api/analytics` | Org-level task analytics |
| `GET` | `/api/audit-logs` | Paginated activity feed |
| `WS` | `/ws/{org_id}` | WebSocket for live updates |
| `GET` | `/health` | Health check |
| `POST`| `/api/tasks/{id}/comments` | Comment on Task |

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
Task lists are the most frequently read resource. Redis caches the unfiltered list per org with a 30-second TTL and invalidates on any mutation. The app falls back gracefully if Redis is unavailable.

**Why WebSockets per org?**
Broadcasts are scoped to `org_id` so users only receive events relevant to their organization. The connection manager maintains a registry of active connections per org and handles cleanup automatically.

**Why Alembic over create_all?**
`Base.metadata.create_all()` cannot handle schema changes on existing tables. Alembic provides versioned, reversible migrations that work safely in production.

---

## Deployment

| Service | Provider |
|---------|----------|
| Frontend | Vercel |
| Backend | Render |
| Database | PostgreSQL|
| Redis | Upstash (serverless Redis — no Docker needed) |
| Auth | Clerk |
