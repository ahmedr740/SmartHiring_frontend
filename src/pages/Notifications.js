import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";
import api from "../api/axios";
import BrandMark from "../components/BrandMark";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { formatDateTime } from "../i18n/formatters";

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
        <div className="jh-page">
            <header className="border-b border-brand-100/80 bg-white/95 shadow-sm backdrop-blur-xl">
                <div className="jh-container flex min-h-20 items-center justify-between gap-4">
                    <BrandMark subtitle="Notification centre" />
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher compact />
                        <button type="button" onClick={() => navigate(homeForRole(user?.role))} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-bold text-brand-700 hover:bg-brand-50">
                            <ArrowLeft size={17} aria-hidden="true" /> <span className="hidden sm:inline">Back to dashboard</span><span className="sm:hidden">Back</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
                <div className="mb-8">
                    <p className="jh-eyebrow">Stay up to date</p>
                    <h1 className="jh-page-title">Notifications</h1>
                    <p className="jh-page-copy">Important activity across your applications, shifts, payments, and conversations.</p>
                </div>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-3">
                        {["ALL", "UNREAD"].map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => changeFilter(value)}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                                    filter === value
                                        ? "bg-brand-600 text-white"
                                        : "border border-brand-200 bg-white text-brand-700"
                                }`}
                            >
                                {value === "ALL" ? "All" : "Unread"}
                            </button>
                        ))}
                    </div>
                    <button type="button" onClick={markAllRead} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-800">
                        <CheckCheck size={17} aria-hidden="true" /> Mark all as read
                    </button>
                </div>

                {feedback && (
                    <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {feedback}
                    </div>
                )}

                <section className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-card">
                    {loading ? (
                        <p className="px-6 py-16 text-center text-gray-500">Loading notifications...</p>
                    ) : notifications.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Bell size={24} aria-hidden="true" /></span>
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
                            className={`block w-full border-b border-gray-100 px-6 py-5 text-left transition hover:bg-brand-50 ${
                                notification.read ? "bg-white" : "bg-brand-50/50"
                            }`}
                        >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        {!notification.read && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
                                        <h2 className="font-bold text-gray-900">{notification.title}</h2>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-600">{notification.message}</p>
                                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-brand-500">
                                        {notification.type.replaceAll("_", " ")}
                                    </p>
                                </div>
                                <time className="shrink-0 text-sm text-gray-400">
                                    {notification.createdAt ? formatDateTime(notification.createdAt) : ""}
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
