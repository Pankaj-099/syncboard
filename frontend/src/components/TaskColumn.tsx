import TaskCard from "./TaskCard"
import type { Task, Status } from "../types"

const STATUS_LABELS: Record<Status, string> = {
    pending: "To Do",
    started: "In Progress",
    completed: "Done",
}

type TaskColumnProps = {
    status: Status
    tasks: Task[]
    onEdit?: (task: Task) => void
    onDelete?: (taskId: string) => void
}

function TaskColumn({ status, tasks, onEdit, onDelete }: TaskColumnProps) {
    return (
        <div className="kanban-column">
            <div className={`kanban-column-header kanban-column-header-${status}`}>
                <h3 className="kanban-column-title">{STATUS_LABELS[status]}</h3>
                <span className="kanban-column-count">{tasks.length}</span>
            </div>
            <div className="kanban-column-body">
                {tasks.map(task => (
                    <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
                ))}
                {tasks.length === 0 && (
                    <div className="kanban-empty">
                        <span>No tasks yet</span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default TaskColumn
