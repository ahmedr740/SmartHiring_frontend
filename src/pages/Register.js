import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        skills: "",
        role: "WORKER",
        restaurantName: "",
        phone: "",
        location: "",
    });
    const [feedback, setFeedback] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            setFeedback("");
            await api.post("/auth/register", formData);

            if (formData.role === "MANAGER") {
                setFeedback("Manager account created. It will stay pending until an admin approves it.");
            } else {
                setFeedback("Registration successful. You can now log in.");
            }

            setTimeout(() => navigate("/login"), 1200);
        } catch (error) {
            console.error(error);
            setFeedback(error.response?.data?.message || "Registration failed");
        }
    };

    const isManager = formData.role === "MANAGER";

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-orange-50 via-white to-orange-100">

            {/* Left Branding Section */}
            <div className="hidden md:flex md:w-1/2 items-center justify-center p-16">
                <div>
                    <h1 className="text-5xl font-extrabold text-orange-600 mb-6">
                        Join Smart Hiring
                    </h1>
                    <p className="text-gray-600 text-lg max-w-md">
                        Whether you're a manager hiring staff or a worker
                        looking for flexible shifts, Smart Hiring connects
                        you instantly.
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

            {/* Right Form Section */}
            <div className="flex w-full md:w-1/2 items-center justify-center px-6">
                <div className="bg-white/70 backdrop-blur-md p-10 rounded-3xl shadow-2xl w-full max-w-md">

                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        Create Account
                    </h2>

                    <p className="text-gray-500 mb-8">
                        Get started in just a few seconds
                    </p>

                    {feedback && (
                        <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                            {feedback}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">

                        <div>
                            <label className="text-sm text-gray-600 block mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                placeholder="John Smith"
                                onChange={handleChange}
                                required
                                className="w-full p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600 block mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                onChange={handleChange}
                                required
                                className="w-full p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600 block mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Create a secure password"
                                onChange={handleChange}
                                required
                                className="w-full p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600 block mb-2">
                                Select Role
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                            >
                                <option value="WORKER">Worker</option>
                                <option value="MANAGER">Manager</option>
                            </select>
                        </div>

                        {isManager ? (
                            <>
                                <div>
                                    <label className="text-sm text-gray-600 block mb-2">
                                        Restaurant Name
                                    </label>
                                    <input
                                        type="text"
                                        name="restaurantName"
                                        placeholder="Sunset Bistro"
                                        value={formData.restaurantName}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-600 block mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="+1 555 234 5678"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-600 block mb-2">
                                        Restaurant Location
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        placeholder="Downtown, New York"
                                        value={formData.location}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    />
                                </div>
                            </>
                        ) : (
                            <div>
                                <label className="text-sm text-gray-600 block mb-2">
                                    Skills (Optional)
                                </label>
                                <input
                                    type="text"
                                    name="skills"
                                    placeholder="Cooking, Bartending, Serving"
                                    value={formData.skills}
                                    onChange={handleChange}
                                    className="w-full p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-orange-500 text-white p-4 rounded-xl hover:bg-orange-600 font-semibold transition shadow-lg"
                        >
                            Create Account
                        </button>
                    </form>

                    <p className="text-center text-gray-500 mt-6">
                        Already have an account?{" "}
                        <span
                            onClick={() => navigate("/login")}
                            className="text-orange-500 cursor-pointer font-semibold hover:underline"
                        >
                            Login
                        </span>
                    </p>

                </div>
            </div>
        </div>
    );
}

export default Register;
