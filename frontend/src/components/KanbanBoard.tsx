import React, { useState } from "react"
import { useAuth, useOrganization } from "@clerk/clerk-react"
import {
    DndContext, DragOverlay, PointerSensor,
    useSensor, useSensors, useDroppable,
    type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core"
import { useDraggable } from "@dnd-kit/core"
import TaskCard from "./TaskCard"
import TaskDetailModal from "./TaskDetailModal"
import { createTask, updateTask, deleteTask } from "../services/api"
import TaskForm from "./TaskForm"
import type { Task, Status, TaskCreate } from "../types"

const STATUS_LABELS: Record<Status, string> = {
    pending: "To Do", started: "In Progress", completed: "Done",
}
const STATUSES: Status[] = ["pending", "started", "completed"]

function DraggableCard({ task, onView, onDelete }: {
    task: Task
    onView?: (task: Task) => void
    onDelete?: (id: string) => Promise<void>
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: task.id, data: { task },
    })
    return (
        <div ref={setNodeRef} {...listeners} {...attributes}
             style={{ opacity: isDragging ? 0.3 : 1, cursor: "grab", touchAction: "none" }}>
            <TaskCard task={task} onView={onView} onDelete={onDelete} />
        </div>
    )
}

function DroppableColumn({ status, tasks, isOver, onView, onDelete }: {
    status: Status
    tasks: Task[]
    isOver: boolean
    onView?: (task: Task) => void
    onDelete?: (id: string) => Promise<void>
}) {
    const { setNodeRef } = useDroppable({ id: status })
    return (
        <div ref={setNodeRef} className="kanban-column"
             style={{ background: isOver ? "var(--accent-light)" : undefined, transition: "background 150ms ease" }}>
            <div className={`kanban-column-header kanban-column-header-${status}`}>
                <h3 className="kanban-column-title">{STATUS_LABELS[status]}</h3>
                <span className="kanban-column-count">{tasks.length}</span>
            </div>
            <div className="kanban-column-body" style={{ minHeight: 80 }}>
                {tasks.map(task => (
                    <DraggableCard key={task.id} task={task} onView={onView} onDelete={onDelete} />
                ))}
                {tasks.length === 0 && (
                    <div className="kanban-empty"><span>Drop tasks here</span></div>
                )}
            </div>
        </div>
    )
}

type KanbanBoardProps = {
    tasks: Task[]
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>
    getToken: () => Promise<string | null>
}

function KanbanBoard({ tasks, setTasks, getToken }: KanbanBoardProps) {
    const { userId } = useAuth()
    const { membership, memberships } = useOrganization({ memberships: { infinite: true } })
    const [showForm, setShowForm]         = useState(false)
    const [editingTask, setEditingTask]   = useState<Task | null>(null)
    const [viewingTask, setViewingTask]   = useState<Task | null>(null)
    const [activeTask, setActiveTask]     = useState<Task | null>(null)
    const [overColumn, setOverColumn]     = useState<Status | null>(null)

    const role      = membership?.role
    const canManage = role === "org:admin" || role === "org:editor"

    const members = (memberships?.data || []).map(m => ({
        id:   m.publicUserData?.userId || "",
        name: [m.publicUserData?.firstName, m.publicUserData?.lastName]
            .filter(Boolean).join(" ") || m.publicUserData?.identifier || "Member",
    })).filter(m => m.id)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    )

    function getTasksByStatus(status: Status) {
        return tasks.filter(t => t.status === status)
    }

    function handleDragStart(event: DragStartEvent) {
        const task = tasks.find(t => t.id === event.active.id)
        if (task) setActiveTask(task)
    }

    function handleDragOver(event: any) {
        const { over } = event
        if (over && STATUSES.includes(over.id as Status)) setOverColumn(over.id as Status)
        else setOverColumn(null)
    }

    async function handleDragEnd(event: DragEndEvent) {
        setActiveTask(null); setOverColumn(null)
        const { active, over } = event
        if (!over) return
        const taskId       = active.id as string
        const targetStatus = over.id as Status
        if (!STATUSES.includes(targetStatus)) return
        const task = tasks.find(t => t.id === taskId)
        if (!task || task.status === targetStatus) return

        const snapshot = [...tasks]
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t))
        try {
            await updateTask(getToken, taskId, { status: targetStatus })
        } catch {
            setTasks(snapshot)
        }
    }

    // Click card → open detail modal
    function handleView(task: Task) {
        setViewingTask(task)
    }

    // From detail modal → open edit form
    function handleEditFromDetail() {
        if (!viewingTask) return
        setEditingTask(viewingTask)
        setViewingTask(null)
        setShowForm(true)
    }

    async function handleDelete(taskId: string): Promise<void> {
        if (!confirm("Delete this task?")) return
        const snapshot = tasks.find(t => t.id === taskId)
        setTasks(prev => prev.filter(t => t.id !== taskId))
        try {
            await deleteTask(getToken, taskId)
        } catch {
            if (snapshot) setTasks(prev => [...prev, snapshot])
        }
    }

    async function handleSubmit(taskData: TaskCreate): Promise<void> {
        if (editingTask) {
            const updated = { ...editingTask, ...taskData }
            setTasks(prev => prev.map(t => t.id === editingTask.id ? updated : t))
            setShowForm(false); setEditingTask(null)
            try {
                await updateTask(getToken, editingTask.id, taskData)
            } catch {
                setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t))
            }
        } else {
            const newTask = await createTask(getToken, taskData)
            setTasks(prev => prev.find(t => t.id === newTask.id) ? prev : [newTask, ...prev])
            setShowForm(false)
        }
    }

    const overdueCount = tasks.filter(t =>
        t.due_date && t.status !== "completed" &&
        new Date(t.due_date) < new Date(new Date().toDateString())
    ).length

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart}
                    onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            <div className="kanban-wrapper">
                <div className="kanban-header">
                    <div className="kanban-header-left">
                        <h2 className="kanban-title">Tasks</h2>
                        <div className="kanban-stats">
                            <span className="kanban-stat">{tasks.length} total</span>
                            {overdueCount > 0 && (
                                <span className="kanban-stat kanban-stat-overdue">⚠ {overdueCount} overdue</span>
                            )}
                        </div>
                    </div>
                    {canManage && (
                        <button className="btn btn-primary"
                                onClick={() => { setEditingTask(null); setShowForm(true) }}>
                            + Add Task
                        </button>
                    )}
                </div>

                <div className="kanban-board">
                    {STATUSES.map(status => (
                        <DroppableColumn key={status} status={status}
                                         tasks={getTasksByStatus(status)}
                                         isOver={overColumn === status}
                                         onView={handleView}
                                         onDelete={canManage ? handleDelete : undefined}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeTask && (
                        <div style={{ transform: "rotate(2deg)", opacity: 0.9, pointerEvents: "none" }}>
                            <TaskCard task={activeTask} />
                        </div>
                    )}
                </DragOverlay>
            </div>

            {/* Task Detail Modal with Comments */}
            {viewingTask && (
                <TaskDetailModal
                    task={viewingTask}
                    currentUserId={userId || ""}
                    onEdit={handleEditFromDetail}
                    onClose={() => setViewingTask(null)}
                    canManage={canManage}
                />
            )}

            {/* Create / Edit Form */}
            {showForm && (
                <TaskForm task={editingTask} onSubmit={handleSubmit}
                          onCancel={() => { setShowForm(false); setEditingTask(null) }}
                          members={members} />
            )}
        </DndContext>
    )
}

export default KanbanBoard
