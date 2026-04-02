import { type JSX, useEffect, useState } from "react"
import { Outlet, Link, useLocation } from "react-router-dom"
import { SignedIn, SignedOut, UserButton, OrganizationSwitcher, useOrganization } from "@clerk/clerk-react"

function Layout(): JSX.Element {
    const { organization } = useOrganization()
    const location = useLocation()
    const [theme, setTheme] = useState<"light" | "dark">(() => {
        const saved = localStorage.getItem("tb-theme")
        if (saved === "dark" || saved === "light") return saved
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    })
    const [scrolled, setScrolled] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme)
        localStorage.setItem("tb-theme", theme)
    }, [theme])

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10)
        window.addEventListener("scroll", onScroll)
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    useEffect(() => { setMenuOpen(false) }, [location.pathname])

    const isActive = (path: string) => location.pathname === path ? "nav-link nav-link-active" : "nav-link"

    return (
        <div className="layout">
            <div className="bg-blob bg-blob-1" />
            <div className="bg-blob bg-blob-2" />

            <nav className={`nav ${scrolled ? "nav-scrolled" : ""}`}>
                <div className="nav-container">
                    <Link to="/" className="nav-logo">
                        <span className="nav-logo-dot" />
                        TaskBoard
                    </Link>

                    <button
                        className={`nav-hamburger ${menuOpen ? "open" : ""}`}
                        onClick={() => setMenuOpen(o => !o)}
                        aria-label="Toggle menu"
                        aria-expanded={menuOpen}
                    >
                        <span />
                        <span />
                        <span />
                    </button>

                    <div className={`nav-links ${menuOpen ? "open" : ""}`}>
                        <Link to="/pricing" className={isActive("/pricing")}>Pricing</Link>

                        <SignedOut>
                            <Link to="/sign-in" className="nav-link">Sign In</Link>
                            <Link to="/sign-up" className="btn btn-primary">Get Started</Link>
                        </SignedOut>

                        <SignedIn>
                            {organization && (
                                <>
                                    <Link to="/dashboard" className={isActive("/dashboard")}>Dashboard</Link>
                                    <Link to="/analytics" className={isActive("/analytics")}>Analytics</Link>
                                    <Link to="/activity"  className={isActive("/activity")}>Activity</Link>
                                </>
                            )}
                            <OrganizationSwitcher
                                hidePersonal
                                afterCreateOrganizationUrl="/dashboard"
                                afterSelectOrganizationUrl="/dashboard"
                                createOrganizationMode="modal"
                                appearance={{
                                    elements: {
                                        organizationSwitcherTrigger: {
                                            borderRadius: "var(--radius-lg)",
                                            padding: "6px 10px",
                                            border: "1px solid var(--border)",
                                            background: "var(--bg-card)",
                                        }
                                    }
                                }}
                            />
                            <UserButton appearance={{ elements: { avatarBox: { width: 34, height: 34 } } }} />
                        </SignedIn>

                        <button className="theme-toggle" onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
                            title="Toggle theme" aria-label="Toggle theme">
                            {theme === "light" ? "🌙" : "☀️"}
                        </button>
                    </div>
                </div>
            </nav>

            <main><Outlet /></main>
        </div>
    )
}

export default Layout
