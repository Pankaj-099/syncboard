import TaskCard from "./TaskCard";

type Status = "pending" | "started" | "completed";

type Task = {
    id: string
    title: string
    description?: string
    status: Status
}

const STATUS_LABELS: Record<Status, string> = {
    pending: "To Do",
    started: "In Progress",
    completed: "Done"
};

type TaskColumnProps = {
    status: Status
    tasks: Task[]
    onEdit?: (task: Task) => void
    onDelete?: (taskId: string) => void
};


function TaskColumn({ status, tasks, onEdit, onDelete }: TaskColumnProps) {

    // @ts-ignore
    return (
        <div className="kanban-column">
            <div className={`kanban-column-header kanban-column-header-${status}`}>
                <h3 className="kanban-column-title">{STATUS_LABELS[status]}</h3>
                <span className="kanban-column-count">{tasks.length}</span>
            </div>

            <div className="kanban-column-body">
                {tasks.map((task:Task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        </div>
    );
}

export default TaskColumn;