import { useState, useEffect } from "react"
import React from "react"
import type { Task, Status, Priority, TaskCreate } from "../types"

type OrgMember = { id: string; name: string }

type TaskFormProps = {
    task: Task | null
    onSubmit: (data: TaskCreate) => Promise<void>
    onCancel: () => void
    members?: OrgMember[]
}

function TaskForm({ task, onSubmit, onCancel, members = [] }: TaskFormProps) {
    const [title, setTitle]               = useState("")
    const [description, setDescription]   = useState("")
    const [status, setStatus]             = useState<Status>("pending")
    const [priority, setPriority]         = useState<Priority>("medium")
    const [assignedTo, setAssignedTo]     = useState("")
    const [assignedToName, setAssignedToName] = useState("")
    const [dueDate, setDueDate]           = useState("")
    const [loading, setLoading]           = useState(false)

    const isEditing = !!task

    useEffect(() => {
        if (task) {
            setTitle(task.title)
            setDescription(task.description || "")
            setStatus(task.status)
            setPriority(task.priority)
            setAssignedTo(task.assigned_to || "")
            setAssignedToName(task.assigned_to_name || "")
            setDueDate(task.due_date || "")
        } else {
            setTitle(""); setDescription(""); setStatus("pending")
            setPriority("medium"); setAssignedTo(""); setAssignedToName(""); setDueDate("")
        }
    }, [task])

    function handleMemberSelect(e: React.ChangeEvent<HTMLSelectElement>) {
        const val = e.target.value
        setAssignedTo(val)
        const m = members.find(m => m.id === val)
        setAssignedToName(m?.name || val)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim() || loading) return
        setLoading(true)
        try {
            await onSubmit({
                title: title.trim(),
                description: description.trim() || null,
                status,
                priority,
                assigned_to: assignedTo || null,
                assigned_to_name: assignedToName || null,
                due_date: dueDate || null,
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEditing ? "Edit Task" : "New Task"}</h2>
                    <button className="modal-close" onClick={onCancel} aria-label="Close" disabled={loading}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="title">Title *</label>
                        <input id="title" type="text" className="form-input"
                               value={title} onChange={e => setTitle(e.target.value)}
                               placeholder="What needs to be done?" autoFocus disabled={loading} />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="description">Description</label>
                        <textarea id="description" className="form-textarea"
                                  value={description} onChange={e => setDescription(e.target.value)}
                                  placeholder="Add more details (optional)" disabled={loading} />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="status">Status</label>
                            <select id="status" className="form-select"
                                    value={status} onChange={e => setStatus(e.target.value as Status)} disabled={loading}>
                                <option value="pending">To Do</option>
                                <option value="started">In Progress</option>
                                <option value="completed">Done</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="priority">Priority</label>
                            <select id="priority" className="form-select"
                                    value={priority} onChange={e => setPriority(e.target.value as Priority)} disabled={loading}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="assignee">Assign To</label>
                            {members.length > 0 ? (
                                <select id="assignee" className="form-select"
                                        value={assignedTo} onChange={handleMemberSelect} disabled={loading}>
                                    <option value="">Unassigned</option>
                                    {members.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <input type="text" className="form-input"
                                       value={assignedToName}
                                       onChange={e => { setAssignedToName(e.target.value); setAssignedTo(e.target.value) }}
                                       placeholder="Member name" disabled={loading} />
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="due_date">Due Date</label>
                            <input id="due_date" type="date" className="form-input"
                                   value={dueDate} onChange={e => setDueDate(e.target.value)} disabled={loading} />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-outline"
                                onClick={onCancel} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary btn-loading-wrapper" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="btn-spinner" />
                                    {isEditing ? "Saving…" : "Creating…"}
                                </>
                            ) : (
                                isEditing ? "Save Changes" : "Create Task"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default TaskForm
