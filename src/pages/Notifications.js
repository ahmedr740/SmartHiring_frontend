import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const getSavedUser = () => JSON.parse(localStorage.getItem("user") || "null");

const homeForRole = (role) => {
    if (role === "ADMIN") return "/admin-home";
    if (role === "MANAGER") return "/manager-home";
    return "/worker-home";
};

function Notifications() {
    const navigate = useNavigate();
    const [user] = useState(getSavedUser);
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState("");

    const loadNotifications = async (nextFilter = filter) => {
        try {
            setLoading(true);
            setFeedback("");
            const response = await api.get("/notifications", {
                params: { limit: 100, unreadOnly: nextFilter === "UNREAD" },
            });
            setNotifications(response.data || []);
        } catch (error) {
            console.error(error);
            setFeedback("We couldn't load your notifications right now.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user?.token) {
            navigate("/login");
            return;
        }
        loadNotifications("ALL");
    }, [navigate, user?.token]); // eslint-disable-line react-hooks/exhaustive-deps

    const changeFilter = (nextFilter) => {
        setFilter(nextFilter);
        loadNotifications(nextFilter);
    };

    const openNotification = async (notification) => {
        try {
            if (!notification.read) {
                await api.put(`/notifications/${notification.id}/read`);
            }
        } catch (error) {
            console.error(error);
        }
        navigate(notification.actionUrl || homeForRole(user?.role));
    };

    const markAllRead = async () => {
        try {
            await api.put("/notifications/read-all");
            setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
            if (filter === "UNREAD") setNotifications([]);
        } catch (error) {
            console.error(error);
            setFeedback("Unable to mark notifications as read.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
            <header className="flex flex-col gap-4 bg-white px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between md:px-20">
                <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-orange-500">HubPin</p>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">Notifications</h1>
                </div>
                <button
                    type="button"
                    onClick={() => navigate(homeForRole(user?.role))}
                    className="rounded-xl border border-orange-300 px-5 py-3 font-semibold text-orange-600 hover:bg-orange-50"
                >
                    Back to dashboard
                </button>
            </header>

            <main className="mx-auto max-w-5xl px-6 py-10">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-3">
                        {["ALL", "UNREAD"].map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => changeFilter(value)}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                                    filter === value
                                        ? "bg-orange-500 text-white"
                                        : "border border-orange-200 bg-white text-orange-700"
                                }`}
                            >
                                {value === "ALL" ? "All" : "Unread"}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={markAllRead}
                        className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                    >
                        Mark all as read
                    </button>
                </div>

                {feedback && (
                    <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {feedback}
                    </div>
                )}

                <section className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-xl">
                    {loading ? (
                        <p className="px-6 py-16 text-center text-gray-500">Loading notifications...</p>
                    ) : notifications.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <p className="text-4xl">🔔</p>
                            <h2 className="mt-4 text-xl font-bold text-gray-900">No notifications here</h2>
                            <p className="mt-2 text-gray-500">
                                {filter === "UNREAD" ? "You have read everything." : "New hiring updates will appear here."}
                            </p>
                        </div>
                    ) : notifications.map((notification) => (
                        <button
                            key={notification.id}
                            type="button"
                            onClick={() => openNotification(notification)}
                            className={`block w-full border-b border-gray-100 px-6 py-5 text-left transition hover:bg-orange-50 ${
                                notification.read ? "bg-white" : "bg-orange-50/50"
                            }`}
                        >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        {!notification.read && <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />}
                                        <h2 className="font-bold text-gray-900">{notification.title}</h2>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-600">{notification.message}</p>
                                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-orange-500">
                                        {notification.type.replaceAll("_", " ")}
                                    </p>
                                </div>
                                <time className="shrink-0 text-sm text-gray-400">
                                    {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ""}
                                </time>
                            </div>
                        </button>
                    ))}
                </section>
            </main>
        </div>
    );
}

export default Notifications;
