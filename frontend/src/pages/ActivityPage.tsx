import { useState, useEffect, useCallback } from "react"
import { useAuth, useOrganization, CreateOrganization } from "@clerk/clerk-react"
import { getAuditLogs } from "../services/api"
import type { AuditLog } from "../types"

const ACTION_CONFIG: Record<string, { icon: string; label: string; className: string }> = {
    "task.created": { icon: "✦", label: "created",  className: "action-created" },
    "task.updated": { icon: "✎", label: "updated",  className: "action-updated" },
    "task.deleted": { icon: "✕", label: "deleted",  className: "action-deleted" },
}

function timeAgo(dateStr: string): string {
    const utc = dateStr.endsWith("Z") ? dateStr : dateStr + "Z"
    const diff = Date.now() - new Date(utc).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return "just now"
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
}

function ActivityPage() {
    const { getToken } = useAuth()
    const { organization } = useOrganization()
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(async (p = 1) => {
        if (!organization) return
        setLoading(true)
        try {
            const data = await getAuditLogs(getToken, p, 50)
            setLogs(data.items)
            setTotal(data.total)
            setPage(p)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }, [organization?.id])

    useEffect(() => { load(1) }, [load])

    if (!organization) return (
        <div className="dashboard-container">
            <div className="no-org-container">
                <h1 className="no-org-title">Activity</h1>
                <p className="no-org-text">Create or join an organization to view activity.</p>
                <CreateOrganization afterCreateOrganizationUrl="/activity" />
            </div>
        </div>
    )

    return (
        <div className="activity-container">
            <div className="activity-header">
                <h1 className="activity-title">Activity Log</h1>
                <p className="activity-subtitle">{organization.name} · {total} events</p>
            </div>

            {loading && <div className="analytics-loading"><div className="spinner" />Loading…</div>}
            {error && <div className="card-error"><p className="text-error">{error}</p></div>}

            {!loading && logs.length === 0 && (
                <div className="activity-empty">
                    <div className="activity-empty-icon">📋</div>
                    <p>No activity yet. Create your first task to get started.</p>
                </div>
            )}

            <div className="activity-feed">
                {logs.map((log, i) => {
                    const cfg = ACTION_CONFIG[log.action] || { icon: "·", label: log.action, className: "" }
                    return (
                        <div key={log.id} className="activity-item" style={{ animationDelay: `${i * 30}ms` }}>
                            <div className={`activity-icon ${cfg.className}`}>{cfg.icon}</div>
                            <div className="activity-body">
                                <div className="activity-text">
                                    <span className="activity-user">{log.user_name || "Someone"}</span>
                                    {" "}{cfg.label} task{" "}
                                    {log.entity_title && (
                                        <span className="activity-task-name">"{log.entity_title}"</span>
                                    )}
                                </div>
                                {log.changes && Object.keys(log.changes).length > 0 && (
                                    <div className="activity-changes">
                                        {Object.entries(log.changes).map(([field, change]) => (
                                            <span key={field} className="activity-change">
                                                {field}: <span className="change-old">{change.from || "—"}</span>
                                                {" → "}
                                                <span className="change-new">{change.to}</span>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="activity-time">{timeAgo(log.created_at)}</div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {total > 50 && (
                <div className="activity-pagination">
                    <button className="btn btn-outline" disabled={page === 1} onClick={() => load(page - 1)}>
                        ← Prev
                    </button>
                    <span className="text-muted">Page {page} of {Math.ceil(total / 50)}</span>
                    <button className="btn btn-outline" disabled={page * 50 >= total} onClick={() => load(page + 1)}>
                        Next →
                    </button>
                </div>
            )}
        </div>
    )
}

export default ActivityPage
