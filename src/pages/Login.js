import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            setError("");
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
                setError("We couldn't reach the backend server. Make sure the Spring Boot app is running on http://localhost:8080.");
                return;
            }

            setError(error.response?.data?.message || "Invalid email or password");
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
                            className="w-full bg-orange-500 text-white p-4 rounded-xl hover:bg-orange-600 font-semibold transition shadow-lg"
                        >
                            Login
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
