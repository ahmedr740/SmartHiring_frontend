import { useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

const navItems = [
    { to: "/worker-home", label: "Home" },
    { to: "/worker-matches", label: "AI Job Match" },
    { to: "/worker-jobs", label: "My Jobs" },
    { to: "/worker-profile", label: "Profile" },
];

function WorkerHeader({ userName, notificationLabel, notificationsEnabled, onToggleNotifications }) {
    const navigate = useNavigate();
    const currentPath = window.location.pathname;

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <div className="flex flex-col gap-4 bg-white px-6 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:px-20">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-orange-600">Smart Hiring</h1>
                <span className="text-sm font-medium text-gray-500">Welcome, {userName || "Worker"}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {navItems.map((item) => {
                    const isActive = currentPath === item.to;

                    return (
                    <button
                        key={item.to}
                        type="button"
                        onClick={() => navigate(item.to)}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                            isActive
                                ? "bg-orange-500 text-white shadow-md"
                                : "border border-orange-200 text-orange-600 hover:bg-orange-50"
                        }`}
                    >
                        {item.label}
                    </button>
                    );
                })}

                {onToggleNotifications && (
                    <button
                        type="button"
                        onClick={onToggleNotifications}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                            notificationsEnabled
                                ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
                                : "border border-orange-200 text-orange-700 hover:bg-orange-50"
                        }`}
                    >
                        {notificationLabel || "Notifications Off"}
                    </button>
                )}

                <NotificationBell />

                <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-xl border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-500 hover:text-white"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}

export default WorkerHeader;
