import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole, Mail, UserRoundCheck } from "lucide-react";
import api from "../api/axios";
import AuthShell from "../components/AuthShell";
import Button from "../components/ui/Button";

const quickAccessAccounts = [
    { label: "Worker", email: "worker@smarthiring.local" },
    { label: "Manager", email: "manager@smarthiring.local" },
    { label: "Admin", email: "admin@smarthiring.local" },
];
const showQuickAccess = process.env.REACT_APP_DEMO_MODE !== "false";

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get("session") === "expired"
            ? "Your session expired. Please log in again."
            : "";
    });

    const fillQuickAccessAccount = (accountEmail) => {
        setEmail(accountEmail);
        setPassword("StaffMatch2026!");
        setError("");
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            setError("");
            setIsLoggingIn(true);
            const response = await api.post("/auth/login", { email, password });

            const user = response.data;
            localStorage.setItem("user", JSON.stringify(user));

            if (user.role === "WORKER") {
                navigate("/worker-home");
            } else if (user.role === "MANAGER") {
                navigate("/manager-home");
            } else if (user.role === "ADMIN") {
                navigate("/admin-home");
            } else {
                setError("Unknown role");
            }

        } catch (error) {
            console.error(error);
            if (!error.response) {
                setError("We couldn't reach the backend service. Please wait a moment and try again.");
                return;
            }

            setError(error.response?.data?.message || "Invalid email or password");
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <AuthShell eyebrow="Welcome back" title="Log in to JobHub" description="Manage your shifts, applications, team, and earnings from one focused workspace.">
            {error && (
                <div role="alert" className="mb-5 rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm font-medium text-accent-800">
                    {error}
                </div>
            )}

            {showQuickAccess && (
                <div className="mb-6 rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
                    <div className="flex items-center gap-2 text-brand-800"><UserRoundCheck size={18} aria-hidden="true" /><p className="text-sm font-bold">Presentation accounts</p></div>
                    <p className="mt-1 text-xs text-gray-500">Choose a role to fill in the demo credentials.</p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                        {quickAccessAccounts.map((account) => (
                            <button key={account.email} type="button" onClick={() => fillQuickAccessAccount(account.email)} className="min-h-10 rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-bold text-brand-700 hover:bg-brand-100">
                                {account.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <form onSubmit={handleLogin} className="jh-panel space-y-5 p-6 sm:p-8">
                <div>
                    <label htmlFor="login-email" className="jh-label">Email address</label>
                    <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" />
                        <input id="login-email" type="email" autoComplete="email" placeholder="you@example.com" className="jh-field pl-11" value={email} onChange={(event) => setEmail(event.target.value)} required />
                    </div>
                </div>
                <div>
                    <label htmlFor="login-password" className="jh-label">Password</label>
                    <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" />
                        <input id="login-password" type="password" autoComplete="current-password" placeholder="Enter your password" className="jh-field pl-11" value={password} onChange={(event) => setPassword(event.target.value)} required />
                    </div>
                </div>
                <Button type="submit" size="lg" icon={ArrowRight} disabled={isLoggingIn} className="w-full">
                    {isLoggingIn ? "Logging in…" : "Log in securely"}
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
                New to JobHub?{" "}
                <button type="button" onClick={() => navigate("/register")} className="min-h-11 font-bold text-brand-700 hover:text-brand-800 hover:underline">Create an account</button>
            </p>
        </AuthShell>
    );
}

export default Login;
