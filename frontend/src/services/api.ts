import type { Task, TaskCreate, TaskUpdate, AuditLogList, Analytics } from "../types"

const API_URL: string = import.meta.env.VITE_API_URL || "http://localhost:8000"

export async function fetchWithAuth(
    endpoint: string,
    getToken: () => Promise<string | null>,
    options: RequestInit = {}
): Promise<any> {
    const token = await getToken()

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || "Request failed.")
    }

    if (response.status === 204) return null
    return response.json()
}

// ── Tasks ──
export async function getTasks(
    getToken: () => Promise<string | null>,
    params?: {
        status?: string
        priority?: string
        assigned_to?: string
        page?: number
        limit?: number
    }
): Promise<Task[]> {
    const qs = new URLSearchParams()
    if (params?.status)      qs.set("status",      params.status)
    if (params?.priority)    qs.set("priority",    params.priority)
    if (params?.assigned_to) qs.set("assigned_to", params.assigned_to)
    if (params?.page)        qs.set("page",        String(params.page))
    if (params?.limit)       qs.set("limit",       String(params.limit))
    const query = qs.toString() ? `?${qs}` : ""
    return fetchWithAuth(`/api/tasks${query}`, getToken)
}

export async function createTask(
    getToken: () => Promise<string | null>,
    task: TaskCreate
): Promise<Task> {
    return fetchWithAuth("/api/tasks", getToken, {
        method: "POST",
        body: JSON.stringify(task),
    })
}

export async function updateTask(
    getToken: () => Promise<string | null>,
    taskId: string,
    task: TaskUpdate
): Promise<Task> {
    return fetchWithAuth(`/api/tasks/${taskId}`, getToken, {
        method: "PUT",
        body: JSON.stringify(task),
    })
}

export async function deleteTask(
    getToken: () => Promise<string | null>,
    taskId: string
): Promise<null> {
    return fetchWithAuth(`/api/tasks/${taskId}`, getToken, { method: "DELETE" })
}

// ── Audit Logs ──
export async function getAuditLogs(
    getToken: () => Promise<string | null>,
    page = 1,
    limit = 50
): Promise<AuditLogList> {
    return fetchWithAuth(`/api/audit-logs?page=${page}&limit=${limit}`, getToken)
}

// ── Analytics ──
export async function getAnalytics(
    getToken: () => Promise<string | null>
): Promise<Analytics> {
    return fetchWithAuth("/api/analytics", getToken)
}

// ── Comments ──
export async function getComments(
    getToken: () => Promise<string | null>,
    taskId: string
) {
    return fetchWithAuth(`/api/tasks/${taskId}/comments`, getToken)
}

export async function createComment(
    getToken: () => Promise<string | null>,
    taskId: string,
    content: string
) {
    return fetchWithAuth(`/api/tasks/${taskId}/comments`, getToken, {
        method: "POST",
        body: JSON.stringify({ content }),
    })
}

export async function deleteComment(
    getToken: () => Promise<string | null>,
    taskId: string,
    commentId: string
) {
    return fetchWithAuth(`/api/tasks/${taskId}/comments/${commentId}`, getToken, {
        method: "DELETE",
    })
}
