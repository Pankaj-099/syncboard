import { useState, useEffect, useCallback } from "react"
import { useAuth, useOrganization, CreateOrganization } from "@clerk/clerk-react"
import { getTasks } from "../services/api"
import KanbanBoard from "../components/KanbanBoard"
import ErrorBoundary from "../components/ErrorBoundary"
import { SkeletonBoard } from "../components/Skeleton"
import { useWebSocket } from "../hooks/useWebSocket"
import type { Task, WSEvent } from "../types"

type Toast = { id: number; message: string; type: "info" | "success" | "warning" }
let toastId = 0

const PAGE_SIZE = 20

function DashboardPage() {
    const { getToken } = useAuth()
    const { organization, memberships } = useOrganization({ memberships: { infinite: true } })
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [toasts, setToasts] = useState<Toast[]>([])
    const [wsToken, setWsToken] = useState<string | null>(null)

    // ── Filters ──────────────────────────────────────────────
    const [search, setSearch] = useState("")
    const [filterPriority, setFilterPriority] = useState("")
    const [filterAssignee, setFilterAssignee] = useState("")

    // ── Pagination ───────────────────────────────────────────
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [totalLoaded, setTotalLoaded] = useState(0)

    const orgId = organization?.id
    const memberCount = memberships?.count ?? 0
    const members = (memberships?.data || []).map(m => ({
        id: m.publicUserData?.userId || "",
        name: [m.publicUserData?.firstName, m.publicUserData?.lastName]
            .filter(Boolean).join(" ") || m.publicUserData?.identifier || "Member",
    })).filter(m => m.id)

    useEffect(() => {
        if (orgId) getToken().then(setWsToken)
    }, [orgId])

    function addToast(message: string, type: Toast["type"] = "info") {
        const id = ++toastId
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
    }

    useWebSocket({
        orgId,
        token: wsToken,
        enabled: !!orgId && !!wsToken,
        onEvent: useCallback((event: WSEvent) => {
            if (event.type === "task.created") {
                const task = event.data.task as Task
                setTasks(prev => prev.find(t => t.id === task.id) ? prev : [task, ...prev])
                addToast(`${event.user_name} created "${task.title}"`, "success")
            } else if (event.type === "task.updated") {
                const task = event.data.task as Task
                setTasks(prev => prev.map(t => t.id === task.id ? task : t))
            } else if (event.type === "task.deleted") {
                const taskId = event.data.task_id as string
                const title = event.data.title as string
                setTasks(prev => prev.filter(t => t.id !== taskId))
                addToast(`${event.user_name} deleted "${title}"`, "warning")
            }
        }, []),
    })

    const loadTasks = useCallback(async (pageNum: number, replace: boolean) => {
        try {
            if (replace) setLoading(true)
            setError(null)

            const params: any = { page: pageNum, limit: PAGE_SIZE }
            if (filterPriority) params.priority = filterPriority
            if (filterAssignee) params.assigned_to = filterAssignee

            const data = await getTasks(getToken, params)

            setHasMore(data.length === PAGE_SIZE)
            setTotalLoaded(prev => replace ? data.length : prev + data.length)
            setTasks(prev => replace ? data : [...prev, ...data])
        } catch (err: any) {
            setError(err.message || "Unknown error")
        } finally {
            setLoading(false)
        }
    }, [getToken, filterPriority, filterAssignee])

    // Reset to page 1 when filters change
    useEffect(() => {
        if (!orgId) { setLoading(false); return }
        setPage(1)
        loadTasks(1, true)
    }, [orgId, filterPriority, filterAssignee])

    function handleLoadMore() {
        const next = page + 1
        setPage(next)
        loadTasks(next, false)
    }

    
    const visibleTasks = search.trim()
        ? tasks.filter(t =>
            t.title.toLowerCase().includes(search.toLowerCase())
        )
        : tasks

    const activeFilterCount = [filterPriority, filterAssignee].filter(Boolean).length

    function clearFilters() {
        setSearch("")
        setFilterPriority("")
        setFilterAssignee("")
    }

    if (!organization) return (
        <div className="dashboard-container">
            <div className="no-org-container">
                <h1 className="no-org-title">Welcome to TaskBoard</h1>
                <p className="no-org-text">Create or join an organization to start managing tasks.</p>
                <CreateOrganization afterCreateOrganizationUrl="/dashboard" />
            </div>
        </div>
    )

    return (
        <div className="dashboard-container">
            {/* Toasts */}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
                ))}
            </div>

            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">{organization.name}</h1>
                    <p className="org-members">{memberCount} member{memberCount !== 1 ? "s" : ""}</p>
                </div>
                <div className="ws-status">
                    <span className="ws-dot" title="Live updates active" />
                    Live
                </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className="filter-bar">
                {/* Search */}
                <div className="filter-search-wrapper">
                    <span className="filter-search-icon">⌕</span>
                    <input
                        className="filter-search"
                        type="text"
                        placeholder="Search tasks…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="filter-search-clear" onClick={() => setSearch("")}>×</button>
                    )}
                </div>

                {/* Priority filter */}
                <select
                    className="filter-select"
                    value={filterPriority}
                    onChange={e => setFilterPriority(e.target.value)}
                >
                    <option value="">All priorities</option>
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                </select>

                {/* Assignee filter */}
                {members.length > 0 && (
                    <select
                        className="filter-select"
                        value={filterAssignee}
                        onChange={e => setFilterAssignee(e.target.value)}
                    >
                        <option value="">All members</option>
                        {members.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                )}

                {/* Active filter count + clear */}
                {(activeFilterCount > 0 || search) && (
                    <button className="filter-clear-btn" onClick={clearFilters}>
                        Clear {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
                    </button>
                )}

                {/* Task count */}
                <span className="filter-count">
                    {search ? `${visibleTasks.length} of ${tasks.length}` : tasks.length} tasks
                </span>
            </div>

            {/* Board */}
            {loading ? (
                <SkeletonBoard />
            ) : error ? (
                <div className="card-error">
                    <p className="text-error text-error-title">Error loading tasks</p>
                    <p className="text-error text-error-message">{error}</p>
                    <button className="btn btn-outline" onClick={() => loadTasks(1, true)}>Retry</button>
                </div>
            ) : (
                <ErrorBoundary>
                    <KanbanBoard
                        tasks={visibleTasks}
                        setTasks={setTasks}
                        getToken={getToken}
                    />
                </ErrorBoundary>
            )}

            {/* ── Load More ── */}
            {!loading && !error && hasMore && !search && (
                <div className="pagination-bar">
                    <span className="pagination-info">
                        Showing {totalLoaded} tasks
                    </span>
                    <button
                        className="btn btn-outline pagination-btn"
                        onClick={handleLoadMore}
                    >
                        Load more
                    </button>
                </div>
            )}
        </div>
    )
}

export default DashboardPage
