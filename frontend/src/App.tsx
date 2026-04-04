import { Routes, Route } from "react-router-dom"
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react"
import Layout from "./components/Layout"
import HomePage from "./pages/HomePage"
import DashboardPage from "./pages/DashboardPage"
import PricingPage from "./pages/PricingPage"
import AnalyticsPage from "./pages/AnalyticsPage"
import ActivityPage from "./pages/ActivityPage"
import UsersPage from "./pages/UsersPage"
import SignUpPage from "./pages/SignUp"
import SignInPage from "./pages/SignIn"
import ErrorBoundary from "./components/ErrorBoundary"
import React from "react"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    return (
        <>
            <SignedIn>{children}</SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
        </>
    )
}

function App() {
    return (
        <ErrorBoundary>
            <Routes>
                {/* Auth pages — NO layout/navbar */}
                <Route path="sign-in/*" element={<SignInPage />} />
                <Route path="sign-up/*" element={<SignUpPage />} />

                {/* App pages — with layout/navbar */}
                <Route path="/" element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="pricing"   element={<PricingPage />} />
                    <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                    <Route path="analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
                    <Route path="activity"  element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
                    <Route path="team"      element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
                </Route>
            </Routes>
        </ErrorBoundary>
    )
}

export default App
