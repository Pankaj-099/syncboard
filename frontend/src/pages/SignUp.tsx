import { SignUp } from "@clerk/clerk-react"
import "../styles/auth.css"

const clerkAppearance = {
    variables: {
        colorPrimary: "#2d6a35",
        colorBackground: "#0d1a0f",
        colorInputBackground: "#111c13",
        colorInputText: "#e8f0e0",
        colorText: "#c5d89d",
        colorTextSecondary: "rgba(197, 216, 157, 0.55)",
        colorNeutral: "#2a3d2c",
        colorDanger: "#e07070",
        borderRadius: "10px",
        fontFamily: "'DM Mono', monospace",
        fontSize: "13px",
    },
    elements: {
        card: {
            background: "rgba(13, 26, 15, 0.85)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(92, 158, 100, 0.15)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(92,158,100,0.08), inset 0 1px 0 rgba(197,216,157,0.06)",
            padding: "2.5rem",
        },
        headerTitle: {
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.6rem",
            fontWeight: "300",
            color: "#e8f0e0",
            letterSpacing: "0.05em",
        },
        headerSubtitle: {
            color: "rgba(197, 216, 157, 0.45)",
            fontSize: "0.72rem",
            letterSpacing: "0.1em",
        },
        formFieldLabel: {
            color: "rgba(197, 216, 157, 0.6)",
            fontSize: "0.68rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
        },
        formFieldInput: {
            background: "rgba(10, 20, 12, 0.8)",
            border: "1px solid rgba(92, 158, 100, 0.2)",
            color: "#e8f0e0",
            fontSize: "13px",
        },
        formButtonPrimary: {
            background: "linear-gradient(135deg, #2d6a35, #1a4a22)",
            border: "1px solid rgba(92, 158, 100, 0.3)",
            fontSize: "0.72rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontFamily: "'DM Mono', monospace",
            boxShadow: "0 4px 20px rgba(45, 106, 53, 0.3)",
        },
        footerActionLink: {
            color: "#7ab87f",
            "&:hover": { color: "#c5d89d" },
        },
        dividerLine: { background: "rgba(92, 158, 100, 0.15)" },
        dividerText: { color: "rgba(197, 216, 157, 0.3)", fontSize: "0.65rem" },
        socialButtonsBlockButton: {
            background: "rgba(10, 20, 12, 0.6)",
            border: "1px solid rgba(92, 158, 100, 0.15)",
            color: "#c5d89d",
        },
        alertText: { color: "#e07070" },
        otpCodeFieldInput: {
            background: "rgba(10, 20, 12, 0.8)",
            border: "1px solid rgba(92, 158, 100, 0.2)",
            color: "#e8f0e0",
        },
    },
}

function SignUpPage() {
    return (
        <div className="auth-page">
            {/* Background */}
            <div className="auth-bg">
                <div className="auth-bg-gradient" />
                <div className="auth-bg-grid" />
                <div className="auth-orb auth-orb-1" />
                <div className="auth-orb auth-orb-2" />
                <div className="auth-orb auth-orb-3" />
                <div className="auth-scanlines" />
            </div>

            {/* Card */}
            <div className="auth-card">
                <div className="auth-brand">
                    <div className="auth-brand-logo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                    </div>
                    <div className="auth-brand-name">TaskBoard</div>
                    <div className="auth-brand-tagline">Team productivity, elevated</div>
                </div>

                <div className="auth-clerk-wrapper">
                    <SignUp
                        routing="path"
                        path="/sign-up"
                        signInUrl="/sign-in"
                        appearance={clerkAppearance}
                    />
                </div>

                <div className="auth-footer">Secure · Private · Encrypted</div>
            </div>
        </div>
    )
}

export default SignUpPage