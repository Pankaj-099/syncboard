import React, { useState } from "react"
import type { Task, Priority } from "../types"

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
    low:    { label: "Low",    className: "priority-low" },
    medium: { label: "Medium", className: "priority-medium" },
    high:   { label: "High",   className: "priority-high" },
}

type TaskCardProps = {
    task: Task
    onView?: (task: Task) => void
    onDelete?: (taskId: string) => Promise<void> | void
}

function isOverdue(due_date?: string | null, status?: string): boolean {
    if (!due_date || status === "completed") return false
    return new Date(due_date) < new Date(new Date().toDateString())
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function TaskCard({ task, onView, onDelete }: TaskCardProps) {
    const [deleting, setDeleting] = useState(false)
    const overdue  = isOverdue(task.due_date, task.status)
    const priority = PRIORITY_CONFIG[task.priority]

    async function handleDelete(e: React.MouseEvent) {
        e.stopPropagation()
        if (deleting) return
        setDeleting(true)
        try {
            await onDelete!(task.id)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div
            className={`task-card ${onView ? "task-card-clickable" : ""} ${overdue ? "task-card-overdue" : ""} ${deleting ? "task-card-deleting" : ""}`}
            onClick={onView && !deleting ? () => onView(task) : undefined}
        >
            <div className={`task-card-priority-bar ${priority.className}`} />

            <div className="task-card-inner">
                <div className="task-card-header">
                    <h4 className="task-card-title">{task.title}</h4>
                    {onDelete && (
                        <button
                            className={`task-card-btn task-card-btn-delete ${deleting ? "task-card-btn-deleting" : ""}`}
                            onClick={handleDelete}
                            disabled={deleting}
                            title="Delete Task"
                        >
                            {deleting ? <span className="btn-spinner btn-spinner-sm" /> : "✕"}
                        </button>
                    )}
                </div>

                {task.description && (
                    <p className="task-card-description">{task.description}</p>
                )}

                <div className="task-card-meta">
                    <span className={`task-card-priority ${priority.className}`}>
                        {priority.label}
                    </span>
                    {task.assigned_to_name && (
                        <span className="task-card-assignee" title={`Assigned to ${task.assigned_to_name}`}>
                            <span className="assignee-avatar">
                                {task.assigned_to_name.charAt(0).toUpperCase()}
                            </span>
                        </span>
                    )}
                    {task.due_date && (
                        <span className={`task-card-due ${overdue ? "task-card-due-overdue" : ""}`}>
                            {overdue ? "⚠ " : "📅 "}{formatDate(task.due_date)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

export default TaskCard
