
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@clerk/clerk-react"
import { getComments, createComment, deleteComment } from "../services/api"
import type { Task, Comment, Priority } from "../types"

const PRIORITY_LABELS: Record<Priority, string> = {
    low: "Low", medium: "Medium", high: "High"
}
const STATUS_LABELS: Record<string, string> = {
    pending: "To Do", started: "In Progress", completed: "Done"
}

function timeAgo(dateStr: string): string {
    const utc  = dateStr.endsWith("Z") ? dateStr : dateStr + "Z"
    const diff = Date.now() - new Date(utc).getTime()
    const m    = Math.floor(diff / 60000)
    if (m < 1)   return "just now"
    if (m < 60)  return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24)  return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric"
    })
}

function isOverdue(due_date?: string | null, status?: string): boolean {
    if (!due_date || status === "completed") return false
    return new Date(due_date) < new Date(new Date().toDateString())
}

type Props = {
    task: Task
    currentUserId: string
    onEdit: () => void
    onClose: () => void
    canManage: boolean
}

function TaskDetailModal({ task, currentUserId, onEdit, onClose, canManage }: Props) {
    const { getToken } = useAuth()
    const [comments, setComments]     = useState<Comment[]>([])
    const [loading, setLoading]       = useState(true)
    const [posting, setPosting]       = useState(false)
    const [content, setContent]       = useState("")
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const overdue   = isOverdue(task.due_date, task.status)

    useEffect(() => {
        getComments(getToken, task.id)
            .then(data => setComments(data.items))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [task.id])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [comments])

    async function handlePost() {
        if (!content.trim() || posting) return
        setPosting(true)
        try {
            const comment = await createComment(getToken, task.id, content.trim())
            setComments(prev => [...prev, comment])
            setContent("")
        } catch (err) {
            console.error(err)
        } finally {
            setPosting(false)
        }
    }

    async function handleDelete(commentId: string) {
        setDeletingId(commentId)
        try {
            await deleteComment(getToken, task.id, commentId)
            setComments(prev => prev.filter(c => c.id !== commentId))
        } catch (err) {
            console.error(err)
        } finally {
            setDeletingId(null)
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost()
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-detail" onClick={e => e.stopPropagation()}>

                {/* ── Header ── */}
                <div className="modal-header">
                    <div className="detail-header-left">
                        <span className={`detail-status-badge detail-status-${task.status}`}>
                            {STATUS_LABELS[task.status]}
                        </span>
                        <span className={`task-card-priority priority-${task.priority}`}>
                            {PRIORITY_LABELS[task.priority]}
                        </span>
                    </div>
                    <div className="detail-header-right">
                        {canManage && (
                            <button className="btn btn-outline btn-sm" onClick={onEdit}>
                                ✎ Edit
                            </button>
                        )}
                        <button className="modal-close" onClick={onClose}>✕</button>
                    </div>
                </div>

                {/* ── Task Info ── */}
                <div className="detail-body">
                    <h2 className="detail-title">{task.title}</h2>

                    {task.description && (
                        <p className="detail-description">{task.description}</p>
                    )}

                    <div className="detail-meta">
                        {task.assigned_to_name && (
                            <div className="detail-meta-item">
                                <span className="detail-meta-label">Assignee</span>
                                <span className="detail-meta-value">
                                    <span className="assignee-avatar">
                                        {task.assigned_to_name.charAt(0).toUpperCase()}
                                    </span>
                                    {task.assigned_to_name}
                                </span>
                            </div>
                        )}
                        {task.due_date && (
                            <div className="detail-meta-item">
                                <span className="detail-meta-label">Due Date</span>
                                <span className={`detail-meta-value ${overdue ? "text-danger" : ""}`}>
                                    {overdue ? "⚠ " : ""}{formatDate(task.due_date)}
                                </span>
                            </div>
                        )}
                        <div className="detail-meta-item">
                            <span className="detail-meta-label">Created</span>
                            <span className="detail-meta-value">{timeAgo(task.created_at)}</span>
                        </div>
                    </div>

                    {/* ── Comments ── */}
                    <div className="comments-section">
                        <h3 className="comments-title">
                            💬 Comments {comments.length > 0 && <span className="comments-count">{comments.length}</span>}
                        </h3>

                        <div className="comments-feed">
                            {loading && (
                                <div className="comments-loading">
                                    <div className="spinner" /> Loading comments…
                                </div>
                            )}

                            {!loading && comments.length === 0 && (
                                <div className="comments-empty">
                                    No comments yet. Be the first to add one.
                                </div>
                            )}

                            {comments.map(comment => (
                                <div key={comment.id} className="comment-item">
                                    <div className="comment-avatar">
                                        {(comment.user_name || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <div className="comment-body">
                                        <div className="comment-header">
                                            <span className="comment-author">
                                                {comment.user_name || "Member"}
                                            </span>
                                            <span className="comment-time">
                                                {timeAgo(comment.created_at)}
                                            </span>
                                            {comment.user_id === currentUserId && (
                                                <button
                                                    className="comment-delete-btn"
                                                    onClick={() => handleDelete(comment.id)}
                                                    disabled={deletingId === comment.id}
                                                    title="Delete comment"
                                                >
                                                    {deletingId === comment.id
                                                        ? <span className="btn-spinner btn-spinner-sm" />
                                                        : "✕"
                                                    }
                                                </button>
                                            )}
                                        </div>
                                        <p className="comment-content">{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={bottomRef} />
                        </div>

                        {/* Comment input */}
                        <div className="comment-input-row">
                            <textarea
                                className="comment-input"
                                placeholder="Write a comment… (Ctrl+Enter to post)"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={2}
                                disabled={posting}
                            />
                            <button
                                className="btn btn-primary btn-loading-wrapper comment-post-btn"
                                onClick={handlePost}
                                disabled={posting || !content.trim()}
                            >
                                {posting ? <span className="btn-spinner" /> : "Post"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TaskDetailModal
