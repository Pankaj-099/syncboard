
import { Component, type ReactNode } from "react"

type Props = { children: ReactNode }
type State = { hasError: boolean; error: string }

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: "" }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error: error.message }
    }

    componentDidCatch(error: Error) {
        console.error("ErrorBoundary caught:", error)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <div className="error-boundary-inner">
                        <div className="error-boundary-icon">⚠</div>
                        <h2 className="error-boundary-title">Something went wrong</h2>
                        <p className="error-boundary-message">{this.state.error}</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => this.setState({ hasError: false, error: "" })}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}

export default ErrorBoundary
