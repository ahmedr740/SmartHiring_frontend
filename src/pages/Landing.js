import { useNavigate } from "react-router-dom";

function Landing() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">

            {/* Navbar */}
            <nav className="flex justify-between items-center px-8 md:px-20 py-6">
                <h1 className="text-2xl font-bold text-orange-600 tracking-wide">
                    Smart Hiring
                </h1>

                <div className="space-x-4">
                    <button
                        onClick={() => navigate("/login")}
                        className="text-orange-600 font-medium hover:text-orange-700 transition"
                    >
                        Login
                    </button>

                    <button
                        onClick={() => navigate("/register")}
                        className="bg-orange-500 text-white px-5 py-2 rounded-xl hover:bg-orange-600 transition shadow-md"
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="flex flex-col md:flex-row items-center justify-between px-8 md:px-20 py-20">

                {/* Left Side */}
                <div className="md:w-1/2 mb-12 md:mb-0">
                    <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                        On-Demand Restaurant <span className="text-orange-600">Staffing</span>
                    </h2>

                    <p className="text-lg text-gray-600 mb-8 max-w-lg">
                        Managers post shifts instantly. Workers apply in seconds.
                        Smart matching makes hiring faster, easier, and stress-free.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => navigate("/register")}
                            className="bg-orange-500 text-white px-8 py-3 rounded-xl shadow-lg hover:bg-orange-600 transition font-semibold"
                        >
                            Start Hiring
                        </button>

                        <button
                            onClick={() => navigate("/register")}
                            className="border border-orange-500 text-orange-600 px-8 py-3 rounded-xl hover:bg-orange-50 transition font-semibold"
                        >
                            Find Work
                        </button>
                    </div>
                </div>

                {/* Right Side Image */}
                <div className="md:w-1/2 flex justify-center">
                    <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-2xl p-8">
                        <img
                            src="https://img.icons8.com/dusk/400/restaurant.png"
                            alt="Restaurant illustration"
                            className="w-80 md:w-96"
                        />
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="px-8 md:px-20 py-20 bg-white">
                <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
                    Why Smart Hiring?
                </h3>

                <div className="grid md:grid-cols-3 gap-10 text-center">

                    <div className="p-6 rounded-2xl shadow-md hover:shadow-xl transition">
                        <h4 className="text-xl font-semibold text-orange-600 mb-4">
                            Instant Shift Posting
                        </h4>
                        <p className="text-gray-600">
                            Managers can create and publish shifts in seconds
                            with role, pay, and schedule details.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl shadow-md hover:shadow-xl transition">
                        <h4 className="text-xl font-semibold text-orange-600 mb-4">
                            Smart Worker Matching
                        </h4>
                        <p className="text-gray-600">
                            Workers find relevant shifts fast based on skills,
                            availability, and role preferences.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl shadow-md hover:shadow-xl transition">
                        <h4 className="text-xl font-semibold text-orange-600 mb-4">
                            Fast & Reliable Hiring
                        </h4>
                        <p className="text-gray-600">
                            Reduce last-minute staffing stress and keep your
                            restaurant running smoothly.
                        </p>
                    </div>

                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-orange-500 text-white text-center py-16 px-6">
                <h3 className="text-3xl font-bold mb-6">
                    Ready to simplify restaurant staffing?
                </h3>

                <button
                    onClick={() => navigate("/register")}
                    className="bg-white text-orange-600 px-8 py-3 rounded-xl font-semibold shadow-lg hover:bg-orange-100 transition"
                >
                    Join Smart Hiring Today
                </button>
            </div>

        </div>
    );
}

export default Landing;