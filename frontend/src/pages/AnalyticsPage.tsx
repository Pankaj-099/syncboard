import { useState, useEffect } from "react"
import { useAuth, useOrganization, CreateOrganization } from "@clerk/clerk-react"
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from "recharts"
import { getAnalytics } from "../services/api"
import { SkeletonAnalytics } from "../components/Skeleton"
import type { Analytics } from "../types"

const STATUS_COLORS: Record<string, string> = {
    pending:   "#C5D89D",
    started:   "#6ea8c9",
    completed: "#5a6b47",
}
const PRIORITY_COLORS: Record<string, string> = {
    low:    "#b8c99a",
    medium: "#9CAB84",
    high:   "#c0392b",
}

function StatCard({ label, value, sub, accent }: {
    label: string; value: string | number; sub?: string; accent?: boolean
}) {
    return (
        <div className={`stat-card ${accent ? "stat-card-accent" : ""}`}>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            {sub && <div className="stat-sub">{sub}</div>}
        </div>
    )
}

function AnalyticsPage() {
    const { getToken } = useAuth()
    const { organization } = useOrganization()
    const [data, setData] = useState<Analytics | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!organization) { setLoading(false); return }
        getAnalytics(getToken)
            .then(setData)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [organization?.id])

    if (!organization) return (
        <div className="dashboard-container">
            <div className="no-org-container">
                <h1 className="no-org-title">Analytics</h1>
                <p className="no-org-text">Create or join an organization to view analytics.</p>
                <CreateOrganization afterCreateOrganizationUrl="/analytics" />
            </div>
        </div>
    )

    if (loading) return <SkeletonAnalytics />

    if (error) return (
        <div className="analytics-container">
            <div className="card-error"><p className="text-error">{error}</p></div>
        </div>
    )

    if (!data) return null

    const statusData = data.by_status.map(s => ({
        name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
        value: s.count,
        key: s.status,
    }))

    const priorityData = data.by_priority.map(p => ({
        name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
        value: p.count,
        key: p.priority,
    }))

    const memberData = data.by_member.map(m => ({
        name: m.user_name.split(" ")[0],
        Assigned: m.assigned,
        Completed: m.completed,
    }))

    return (
        <div className="analytics-container">
            <div className="analytics-header">
                <h1 className="analytics-title">Analytics</h1>
                <p className="analytics-subtitle">{organization.name} · Task Overview</p>
            </div>

            {/* KPI row */}
            <div className="stat-grid">
                <StatCard label="Total Tasks"     value={data.total_tasks} />
                <StatCard label="Completed"       value={data.completed_tasks} accent />
                <StatCard label="Overdue"         value={data.overdue_tasks}
                          sub={data.overdue_tasks > 0 ? "needs attention" : "all on track"} />
                <StatCard label="Completion Rate" value={`${data.completion_rate}%`} />
            </div>

            <div className="analytics-grid">
                {/* Status Pie Chart */}
                <div className="analytics-card">
                    <h3 className="analytics-card-title">By Status</h3>
                    {statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%" cy="50%"
                                    innerRadius={55} outerRadius={80}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {statusData.map(entry => (
                                        <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || "#9CAB84"} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v) => [v, "tasks"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <p className="analytics-empty-text">No data yet</p>}
                </div>

                {/* Priority Bar Chart */}
                <div className="analytics-card">
                    <h3 className="analytics-card-title">By Priority</h3>
                    {priorityData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={priorityData} barSize={36}>
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(v) => [v, "tasks"]} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {priorityData.map(entry => (
                                        <Cell key={entry.key} fill={PRIORITY_COLORS[entry.key] || "#9CAB84"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="analytics-empty-text">No data yet</p>}
                </div>

                {/* Completion Rate Card */}
                <div className="analytics-card">
                    <h3 className="analytics-card-title">Completion</h3>
                    <div className="completion-ring-wrapper">
                        <svg width="140" height="140" viewBox="0 0 140 140">
                            <circle cx="70" cy="70" r="52"
                                    fill="none" stroke="var(--border)" strokeWidth="14" />
                            <circle cx="70" cy="70" r="52"
                                    fill="none" stroke="var(--accent)" strokeWidth="14"
                                    strokeDasharray={`${(data.completion_rate / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                                    strokeLinecap="round"
                                    transform="rotate(-90 70 70)"
                                    style={{ transition: "stroke-dasharray 1s ease" }}
                            />
                        </svg>
                        <div className="completion-ring-label">
                            <span className="donut-pct">{data.completion_rate}%</span>
                            <span className="donut-sub">done</span>
                        </div>
                    </div>
                </div>

                {/* Member performance */}
                {memberData.length > 0 && (
                    <div className="analytics-card analytics-card-wide">
                        <h3 className="analytics-card-title">Team Performance</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={memberData} barSize={28} barGap={4}>
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Assigned"  fill="#C5D89D" radius={[4,4,0,0]} />
                                <Bar dataKey="Completed" fill="#5a6b47" radius={[4,4,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AnalyticsPage
