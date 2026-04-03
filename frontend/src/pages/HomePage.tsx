import { Link } from "react-router-dom";
import { SignedIn, SignedOut, useOrganization, CreateOrganization } from "@clerk/clerk-react";

function HomePage() {
    const { organization } = useOrganization();

    return (
        <div className="home-container">
            <span className="home-eyebrow">
                ✦ Collaborative task management
            </span>

            <h1 className="home-title">
                Team Work,<br />
                <span className="home-title-accent">Beautifully Organized</span>
            </h1>

            <p className="home-subtitle">
                Organize your team's work with elegant task boards.
                Create, assign, and track tasks effortlessly across your entire organization.
            </p>

            <SignedOut>
                <div className="home-buttons">
                    <Link to="/sign-up" className="btn btn-primary btn-lg">
                        Start for Free →
                    </Link>
                    <Link to="/sign-in" className="btn btn-outline btn-lg">
                        Sign In
                    </Link>
                </div>
            </SignedOut>

            <SignedIn>
                {organization ? (
                    <div className="home-buttons">
                        <Link to="/dashboard" className="btn btn-primary btn-lg">
                            Go to Dashboard →
                        </Link>
                    </div>
                ) : (
                    <div className="home-create-org">
                        <CreateOrganization afterCreateOrganizationUrl="/dashboard" />
                    </div>
                )}
            </SignedIn>

            <div className="home-features">
                <div className="home-feature-card">
                    <div className="home-feature-icon">📋</div>
                    <div className="home-feature-title">Kanban Boards</div>
                    <div className="home-feature-text">
                        Visualize your workflow across To Do, In Progress, and Done columns with intuitive drag-ready cards.
                    </div>
                </div>
                <div className="home-feature-card">
                    <div className="home-feature-icon">👥</div>
                    <div className="home-feature-title">Team Collaboration</div>
                    <div className="home-feature-text">
                        Invite your team, assign roles, and keep everyone aligned on what matters most.
                    </div>
                </div>
                <div className="home-feature-card">
                    <div className="home-feature-icon">⚡</div>
                    <div className="home-feature-title">Real-time Updates</div>
                    <div className="home-feature-text">
                        Changes sync instantly so your team always sees the latest status without refreshing.
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;