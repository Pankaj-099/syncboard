
import React, { useState } from "react"
import { useOrganization } from "@clerk/clerk-react"
import TaskColumn from "./TaskColumn"
import { createTask, updateTask, deleteTask } from "../services/api"
import TaskForm from "./TaskForm"

type Status = "pending" | "started" | "completed"

type Task = {
    id: string
    title: string
    description?: string
    status: Status
}

type KanbanBoardProps = {
    tasks: Task[]
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>
    getToken: () => Promise<string | null>
}

const STATUSES: Status[] = ["pending", "started", "completed"]

function KanbanBoard({ tasks, setTasks, getToken }: KanbanBoardProps) {
    const { membership } = useOrganization()

    const [showForm, setShowForm] = useState<boolean>(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)

    const role = membership?.role
    const canManage = role === "org:admin" || role === "org:editor"

    function getTasksByStatus(status: Status): Task[] {
        return tasks.filter((task) => task.status === status)
    }

    function handleEdit(task: Task): void {
        setEditingTask(task)
        setShowForm(true)
    }

    async function handleDelete(taskId: string): Promise<void> {
        if (!confirm("Are you sure you want to delete this task?")) return

        const taskToDelete = tasks.find((t) => t.id === taskId)

        setTasks((prev) => prev.filter((t) => t.id !== taskId))

        try {
            await deleteTask(getToken, taskId)
        } catch (err) {
            if (taskToDelete) {
                setTasks((prev) => [...prev, taskToDelete])
            }
            console.error(err)
        }
    }

    async function handleSubmit(taskData: Partial<Task>): Promise<void> {
        if (editingTask) {
            const updatedTask = { ...editingTask, ...taskData }

            setTasks((prev) =>
                prev.map((t) => (t.id === editingTask.id ? updatedTask : t))
            )

            setShowForm(false)
            setEditingTask(null)

            try {
                await updateTask(getToken, editingTask.id, taskData)
            } catch (err) {
                setTasks((prev) =>
                    prev.map((t) => (t.id === editingTask.id ? editingTask : t))
                )
                console.error(err)
            }
        } else {
            try {
                const newTask = await createTask(getToken, taskData)
                setTasks((prev) => [...prev, newTask])
                setShowForm(false)
            } catch (err) {
                console.error(err)
            }
        }
    }

    function handleCancel(): void {
        setShowForm(false)
        setEditingTask(null)
    }

    function handleAddTask(): void {
        setEditingTask(null)
        setShowForm(true)
    }

    return (
        <div className="kanban-wrapper">
            <div className="kanban-header">
                <h2 className="kanban-title">Tasks</h2>

                {canManage && (
                    <button className="btn btn-primary" onClick={handleAddTask}>
                        + Add Task
                    </button>
                )}
            </div>

            <div className="kanban-board">
                {STATUSES.map((status) => (
                    <TaskColumn
                        key={status}
                        status={status}
                        tasks={getTasksByStatus(status)}
                        onEdit={canManage ? handleEdit : undefined}
                        onDelete={canManage ? handleDelete : undefined}
                    />
                ))}
            </div>

            {showForm && (
                <TaskForm
                    task={editingTask}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                />
            )}
        </div>
    )
}

export default KanbanBoard