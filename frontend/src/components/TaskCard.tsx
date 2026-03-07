import React from "react";

type Task = {
    id: string
    title: string
    description?: string
}

type TaskCardProps = {
    task: Task
    onEdit?: (task: Task) => void
    onDelete?: (taskId: string) => void
}

function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
    const canEdit: boolean = !!onEdit
    const canDelete: boolean = !!onDelete

    return (
        <div
            className={`task-card ${canEdit ? "task-card-clickable" : ""}`}
            onClick={canEdit ? () => onEdit!(task) : undefined}
        >
            <div className="task-card-header">
                <h4 className="task-card-title">{task.title}</h4>

                {canDelete && (
                    <button
                        className="task-card-btn task-card-btn-delete"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation()
                            onDelete!(task.id)
                        }}
                        title="Delete Task"
                    >
                        x
                    </button>
                )}
            </div>

            {task.description && (
                <p className="task-card-description">{task.description}</p>
            )}
        </div>
    )
}

export default TaskCard