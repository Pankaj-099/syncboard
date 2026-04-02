import { useState, useEffect } from "react"
import { useAuth, useOrganization, CreateOrganization } from "@clerk/clerk-react"
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
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

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency", currency: "USD", minimumFractionDigits: 0,
    }).format(value)
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

    const fin = data.financial

    const statusData = data.by_status.map(s => ({
        name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
        value: s.count, key: s.status,
    }))

    const priorityData = data.by_priority.map(p => ({
        name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
        value: p.count, key: p.priority,
    }))

    const memberData = data.by_member.map(m => ({
        name: m.user_name.split(" ")[0],
        Assigned: m.assigned,
        Completed: m.completed,
    }))

    const trendData = fin.monthly_trends.map(t => ({
        month: t.month,
        Income: Number(t.income),
        Expense: Number(t.expense),
        Net: Number(t.net),
    }))

    const categoryData = fin.by_category.map(c => ({
        name: c.category,
        value: Number(c.total),
    }))

    return (
        <div className="analytics-container">
            <div className="analytics-header">
                <h1 className="analytics-title">Analytics</h1>
                <p className="analytics-subtitle">{organization.name} · Finance & Task Overview</p>
            </div>

            {/* ── Financial Summary ── */}
            <div className="stat-grid" style={{ marginBottom: "var(--sp-4)" }}>
                <StatCard
                    label="Total Income"
                    value={formatCurrency(Number(fin.total_income))}
                    accent
                />
                <StatCard
                    label="Total Expenses"
                    value={formatCurrency(Number(fin.total_expense))}
                />
                <StatCard
                    label="Net Balance"
                    value={formatCurrency(Number(fin.net_balance))}
                    sub={Number(fin.net_balance) >= 0 ? "positive" : "negative"}
                    accent={Number(fin.net_balance) >= 0}
                />
                <StatCard label="Completion Rate" value={`${data.completion_rate}%`} />
            </div>

            {/* ── Task KPIs ── */}
            <div className="stat-grid">
                <StatCard label="Total Records"  value={data.total_tasks} />
                <StatCard label="Completed"      value={data.completed_tasks} accent />
                <StatCard label="Overdue"        value={data.overdue_tasks}
                          sub={data.overdue_tasks > 0 ? "needs attention" : "all on track"} />
                <StatCard label="Active Records" value={data.total_tasks - data.completed_tasks} />
            </div>

            <div className="analytics-grid">

                {/* Monthly Trends */}
                {trendData.length > 0 && (
                    <div className="analytics-card analytics-card-wide">
                        <h3 className="analytics-card-title">Monthly Trends</h3>
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
                                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                                <Legend />
                                <Line type="monotone" dataKey="Income"  stroke="#5a6b47" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="Expense" stroke="#c0392b" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="Net"     stroke="#6ea8c9" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Category Breakdown */}
                {categoryData.length > 0 && (
                    <div className="analytics-card analytics-card-wide">
                        <h3 className="analytics-card-title">Category Breakdown</h3>
                        <div className="bar-chart">
                            {categoryData
                                .sort((a, b) => b.value - a.value)
                                .map(c => {
                                    const max = Math.max(...categoryData.map(x => x.value))
                                    return (
                                        <div key={c.name} className="bar-row">
                                            <span className="bar-label">{c.name}</span>
                                            <div className="bar-track">
                                                <div
                                                    className="bar-fill"
                                                    style={{ width: `${(c.value / max) * 100}%`, background: "var(--accent)" }}
                                                />
                                            </div>
                                            <span className="bar-count">{formatCurrency(c.value)}</span>
                                        </div>
                                    )
                                })}
                        </div>
                    </div>
                )}

                {/* Status Pie */}
                <div className="analytics-card">
                    <h3 className="analytics-card-title">By Status</h3>
                    {statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%"
                                     innerRadius={55} outerRadius={80}
                                     paddingAngle={3} dataKey="value">
                                    {statusData.map(entry => (
                                        <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || "#9CAB84"} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v) => [v, "records"]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <p className="analytics-empty-text">No data yet</p>}
                </div>

                {/* Priority Bar */}
                <div className="analytics-card">
                    <h3 className="analytics-card-title">By Priority</h3>
                    {priorityData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={priorityData} barSize={36}>
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(v) => [v, "records"]} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {priorityData.map(entry => (
                                        <Cell key={entry.key} fill={PRIORITY_COLORS[entry.key] || "#9CAB84"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="analytics-empty-text">No data yet</p>}
                </div>

                {/* Completion Ring */}
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

                {/* Team Performance */}
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
