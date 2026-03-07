import { useState, useEffect, useCallback } from "react"
import { useAuth, useOrganization, CreateOrganization } from "@clerk/clerk-react"
import { getTasks } from "../services/api"
import KanbanBoard from "../components/KanbanBoard"

type Status = "pending" | "started" | "completed"

type Task = {
    id: string
    title: string
    description?: string
    status: Status
}

function DashboardPage() {
    const { getToken } = useAuth()

    const { organization, memberships } = useOrganization({
        memberships: { infinite: true },
    })

    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const memberCount = memberships?.count ?? 0
    const orgId = organization?.id

    const loadTasks = useCallback(async (): Promise<void> => {
        try {
            setLoading(true)
            setError(null)

            const data: Task[] = await getTasks(getToken)

            setTasks(data)
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError("Unknown error")
            }
        } finally {
            setLoading(false)
        }
    }, [getToken])

    useEffect(() => {
        if (orgId) {
            loadTasks()
        } else {
            setLoading(false)
        }
    }, [orgId, loadTasks])

    if (!organization) {
        return (
            <div className="dashboard-container">
                <div className="no-org-container">
                    <h1 className="no-org-title">Welcome to TaskBoard</h1>

                    <p className="no-org-text">
                        Create or join an organization to start managing tasks with your team.
                    </p>

                    <CreateOrganization afterCreateOrganizationUrl="/dashboard" />
                </div>
            </div>
        )
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">{organization.name}</h1>

                    <p className="org-members">
                        {memberCount} member{memberCount !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            {loading ? (
                <p className="text-muted">Loading Tasks...</p>
            ) : error ? (
                <div className="card-error">
                    <p className="text-error text-error-title">Error loading tasks</p>
                    <p className="text-error text-error-message">{error}</p>
                </div>
            ) : (
                <KanbanBoard tasks={tasks} setTasks={setTasks} getToken={getToken} />
            )}
        </div>
    )
}

export default DashboardPage