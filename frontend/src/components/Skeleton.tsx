
export function SkeletonCard() {
    return (
        <div className="skeleton-card">
            <div className="skeleton-bar skeleton-bar-priority" />
            <div className="skeleton-inner">
                <div className="skeleton-line skeleton-line-title" />
                <div className="skeleton-line skeleton-line-desc" />
                <div className="skeleton-meta">
                    <div className="skeleton-pill" />
                    <div className="skeleton-pill skeleton-pill-sm" />
                </div>
            </div>
        </div>
    )
}

export function SkeletonColumn() {
    return (
        <div className="kanban-column">
            <div className="kanban-column-header skeleton-header">
                <div className="skeleton-line skeleton-line-header" />
                <div className="skeleton-badge" />
            </div>
            <div className="kanban-column-body">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        </div>
    )
}

export function SkeletonBoard() {
    return (
        <div className="kanban-wrapper">
            <div className="kanban-header">
                <div className="skeleton-line skeleton-line-title" style={{ width: 140 }} />
                <div className="skeleton-btn" />
            </div>
            <div className="kanban-board">
                <SkeletonColumn />
                <SkeletonColumn />
                <SkeletonColumn />
            </div>
        </div>
    )
}

export function SkeletonStatCard() {
    return (
        <div className="stat-card">
            <div className="skeleton-line skeleton-line-stat" />
            <div className="skeleton-line skeleton-line-label" />
        </div>
    )
}

export function SkeletonAnalytics() {
    return (
        <div className="analytics-container">
            <div className="analytics-header">
                <div className="skeleton-line skeleton-line-title" style={{ width: 180 }} />
                <div className="skeleton-line skeleton-line-label" style={{ width: 120 }} />
            </div>
            <div className="stat-grid">
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
            </div>
            <div className="analytics-grid">
                {[1,2,3].map(i => (
                    <div key={i} className="analytics-card">
                        <div className="skeleton-line skeleton-line-label" style={{ width: 80 }} />
                        <div className="skeleton-chart" />
                    </div>
                ))}
            </div>
        </div>
    )
}
