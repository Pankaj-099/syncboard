export type Status     = "pending" | "started" | "completed"
export type Priority   = "low" | "medium" | "high"
export type RecordType = "income" | "expense" | "neutral"

export type Task = {
    id: string
    title: string
    description?: string | null
    status: Status
    priority: Priority
    org_id: string
    created_by: string
    assigned_to?: string | null
    assigned_to_name?: string | null
    due_date?: string | null
    created_at: string
    updated_at: string
    // Finance fields
    amount?: number | null
    record_type?: RecordType | null
    category?: string | null
    // Soft delete
    is_deleted?: boolean
    deleted_at?: string | null
}

export type TaskCreate = {
    title: string
    description?: string | null
    status?: Status
    priority?: Priority
    assigned_to?: string | null
    assigned_to_name?: string | null
    due_date?: string | null
    // Finance fields
    amount?: number | null
    record_type?: RecordType | null
    category?: string | null
}

export type TaskUpdate = Partial<TaskCreate>

export type Comment = {
    id: string
    task_id: string
    org_id: string
    user_id: string
    user_name?: string | null
    content: string
    created_at: string
}

export type CommentList = {
    items: Comment[]
    total: number
}

export type AuditLog = {
    id: string
    org_id: string
    user_id: string
    user_name?: string
    action: string
    entity_type: string
    entity_id?: string
    entity_title?: string
    changes?: Record<string, { from: string | null; to: string }> | null
    created_at: string
}

export type AuditLogList = {
    items: AuditLog[]
    total: number
    page: number
    limit: number
}

export type StatusCount   = { status: string; count: number }
export type PriorityCount = { priority: string; count: number }
export type MemberStat = {
    user_id: string
    user_name: string
    assigned: number
    completed: number
}

export type CategoryTotal = {
    category: string
    total: number
}

export type MonthlyTrend = {
    month: string
    income: number
    expense: number
    net: number
}

export type FinancialSummary = {
    total_income: number
    total_expense: number
    net_balance: number
    by_category: CategoryTotal[]
    monthly_trends: MonthlyTrend[]
}

export type Analytics = {
    total_tasks: number
    completed_tasks: number
    overdue_tasks: number
    completion_rate: number
    by_status: StatusCount[]
    by_priority: PriorityCount[]
    by_member: MemberStat[]
    financial: FinancialSummary
}

export type WSEvent = {
    type: "task.created" | "task.updated" | "task.deleted" | "comment.created" | "connected"
    data: Record<string, unknown>
    user_name?: string
    timestamp: string
}

export type OrgUser = {
    id: string
    org_id: string
    email?: string | null
    full_name?: string | null
    role: "viewer" | "analyst" | "admin"
    is_active: boolean
    created_at: string
    updated_at: string
}
