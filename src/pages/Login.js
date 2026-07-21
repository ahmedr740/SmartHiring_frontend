import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

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
        <div className="min-h-screen flex bg-gradient-to-br from-orange-50 via-white to-orange-100">

            {/* Left Branding Section */}
            <div className="hidden md:flex md:w-1/2 items-center justify-center p-16">
                <div>
                    <h1 className="text-5xl font-extrabold text-orange-600 mb-6">
                        Smart Hiring
                    </h1>
                    <p className="text-gray-600 text-lg max-w-md">
                        Connect managers and restaurant staff instantly.
                        Post shifts. Apply fast. Hire smarter.
                    </p>

                    <div className="mt-10">
                        <img
                            src="https://img.icons8.com/dusk/400/restaurant.png"
                            alt="Restaurant"
                            className="w-80"
                        />
                    </div>
                </div>
            </div>

            {/* Right Login Card */}
            <div className="flex w-full md:w-1/2 items-center justify-center px-6">
                <div className="bg-white/70 backdrop-blur-md p-10 rounded-3xl shadow-2xl w-full max-w-md">

                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        Welcome Back 👋
                    </h2>

                    <p className="text-gray-500 mb-8">
                        Login to manage or find shifts
                    </p>

                    {error && (
                        <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                            {error}
                        </div>
                    )}

                    {showQuickAccess && (
                    <div className="mb-6 rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
                        <p className="text-sm font-semibold text-gray-800">Quick access accounts</p>
                        <p className="mt-1 text-xs text-gray-500">Use these accounts for presentation login.</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            {quickAccessAccounts.map((account) => (
                                <button
                                    key={account.email}
                                    type="button"
                                    onClick={() => fillQuickAccessAccount(account.email)}
                                    className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50"
                                >
                                    {account.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">

                        <div>
                            <label className="text-sm text-gray-600 block mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                className="w-full p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600 block mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                placeholder="Enter your password"
                                className="w-full p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full bg-orange-500 text-white p-4 rounded-xl hover:bg-orange-600 font-semibold transition shadow-lg disabled:cursor-not-allowed disabled:bg-orange-300"
                        >
                            {isLoggingIn ? "Logging in..." : "Login"}
                        </button>
                    </form>

                    <p className="text-center text-gray-500 mt-6">
                        Don't have an account?{" "}
                        <span
                            onClick={() => navigate("/register")}
                            className="text-orange-500 cursor-pointer font-semibold hover:underline"
                        >
                            Register
                        </span>
                    </p>

                </div>
            </div>
        </div>
    );
}

export default Login;
