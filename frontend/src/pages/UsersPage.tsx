import { useState, useEffect } from "react"
import { useAuth, useOrganization, CreateOrganization } from "@clerk/clerk-react"
import { fetchWithAuth } from "../services/api"
import type { OrgUser } from "../types"
import "../styles/pages/users.css"

const ROLE_CONFIG = {
    ADMIN:   { label: "Admin",   className: "user-role-admin" },
    ANALYST: { label: "Analyst", className: "user-role-analyst" },
    VIEWER:  { label: "Viewer",  className: "user-role-viewer" },
}

function UsersPage() {
    const { getToken } = useAuth()
    const { organization } = useOrganization()
    const [users, setUsers]       = useState<OrgUser[]>([])
    const [loading, setLoading]   = useState(true)
    const [error, setError]       = useState<string | null>(null)
    const [updating, setUpdating] = useState<string | null>(null)

    useEffect(() => {
        if (!organization) { setLoading(false); return }
        fetchWithAuth("/api/users", getToken)
            .then(setUsers)
            .catch(e => setError(e.message || "Failed to load team members"))
            .finally(() => setLoading(false))
    }, [organization?.id])

    async function toggleStatus(userId: string, isActive: boolean) {
        setUpdating(userId)
        setError(null)
        try {
            const updated = await fetchWithAuth(`/api/users/${userId}/status`, getToken, {
                method: "PATCH",
                body: JSON.stringify({ is_active: !isActive }),
            })
            setUsers(prev => prev.map(u => u.id === userId ? updated : u))
        } catch (e: any) {
            setError(e.message || "Failed to update status")
        } finally {
            setUpdating(null)
        }
    }

    async function changeRole(userId: string, role: string) {
        setUpdating(userId)
        setError(null)
        try {
            const updated = await fetchWithAuth(`/api/users/${userId}/role`, getToken, {
                method: "PATCH",
                body: JSON.stringify({ role }),
            })
            setUsers(prev => prev.map(u => u.id === userId ? updated : u))
        } catch (e: any) {
            setError(e.message || "Failed to update role")
        } finally {
            setUpdating(null)
        }
    }

    if (!organization) return (
        <div className="dashboard-container">
            <div className="no-org-container">
                <h1 className="no-org-title">Team</h1>
                <p className="no-org-text">Create or join an organization to manage your team.</p>
                <CreateOrganization afterCreateOrganizationUrl="/team" />
            </div>
        </div>
    )

    return (
        <div className="users-container">
            <div className="users-header">
                <div>
                    <h1 className="users-title">Team</h1>
                    <p className="users-subtitle">
                        {organization.name} · {users.length} member{users.length !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            {error && (
                <div className="card-error" style={{ marginBottom: "var(--sp-6)" }}>
                    <p className="text-error">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="users-skeleton">
                    {[1, 2, 3].map(i => <div key={i} className="user-row-skeleton" />)}
                </div>
            ) : users.length === 0 ? (
                <div className="users-empty">
                    <div className="users-empty-icon">👥</div>
                    <p>No team members found.</p>
                    <p className="users-empty-sub">
                        Members will appear here once they join your organization.
                    </p>
                </div>
            ) : (
                <div className="users-table">
                    <div className="users-table-header">
                        <span>Member</span>
                        <span>Role</span>
                        <span>Status</span>
                        <span>Actions</span>
                    </div>

                    {users.map(user => {
                        const roleKey = (user.role || "VIEWER").toUpperCase() as keyof typeof ROLE_CONFIG
                        const role    = ROLE_CONFIG[roleKey] || ROLE_CONFIG.VIEWER
                        const busy    = updating === user.id
                        const initials = (user.full_name || user.email || "?")
                            .split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)

                        return (
                            <div
                                key={user.id}
                                className={`user-row ${!user.is_active ? "user-row-inactive" : ""}`}
                            >
                                {/* Member info */}
                                <div className="user-info">
                                    <div className="user-avatar">{initials}</div>
                                    <div className="user-details">
                                        <span className="user-name">{user.full_name || "—"}</span>
                                        <span className="user-email">{user.email || user.id}</span>
                                    </div>
                                </div>

                                {/* Role badge */}
                                <div className="user-role-cell">
                                    <span className={`user-role-badge ${role.className}`}>
                                        {role.label}
                                    </span>
                                </div>

                                {/* Status badge */}
                                <div className="user-status-cell">
                                    <span className={`user-status-badge ${user.is_active ? "user-status-active" : "user-status-inactive"}`}>
                                        {user.is_active ? "Active" : "Inactive"}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="user-actions">
                                    <select
                                        className="user-role-select"
                                        value={roleKey}
                                        disabled={busy}
                                        onChange={e => changeRole(user.id, e.target.value)}
                                        title="Change role"
                                    >
                                        <option value="VIEWER">Viewer</option>
                                        <option value="ANALYST">Analyst</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>

                                    <button
                                        className={`btn btn-sm ${user.is_active ? "btn-outline" : "btn-primary"}`}
                                        onClick={() => toggleStatus(user.id, user.is_active)}
                                        disabled={busy}
                                        title={user.is_active ? "Deactivate user" : "Activate user"}
                                    >
                                        {busy
                                            ? <span className="btn-spinner btn-spinner-sm" />
                                            : user.is_active ? "Deactivate" : "Activate"
                                        }
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default UsersPage