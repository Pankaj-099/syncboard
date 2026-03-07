
import { Routes, Route} from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn} from "@clerk/clerk-react";
import Layout from "./components/Layout.tsx";
import HomePage from "./pages/HomePage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import PricingPage from "./pages/PricingPage.tsx";
import SignUpPage from "./pages/SignUp.tsx";
import SignIn from "./pages/SignIn.tsx";
import React from "react";

function ProtectedRoute({children}:{ children: React.ReactNode }){
    return<>
        <SignedIn>
            {children}
        </SignedIn>
        <SignedOut>
            <RedirectToSignIn/>
        </SignedOut>
    </>
}


function App(){
    return <>
        <Routes>
            <Route path={"/"} element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path={"sign-in/*"} element={<SignIn />}/>
                <Route path={"sign-up/*"} element={<SignUpPage />}/>
                <Route path={"pricing"} element={<PricingPage />}/>
                <Route
                    path={"dashboard"}
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
            </Route>
        </Routes>
    </>
}

export default App;