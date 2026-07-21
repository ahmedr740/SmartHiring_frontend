import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const formatAge = (value) => {
    if (!value) return "";
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
    if (seconds < 60) return "now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
};

function NotificationBell() {
    const navigate = useNavigate();
    const wrapperRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const refresh = async () => {
        try {
            const [itemsResponse, countResponse] = await Promise.all([
                api.get("/notifications", { params: { limit: 5 } }),
                api.get("/notifications/unread-count"),
            ]);
            setNotifications(itemsResponse?.data || []);
            setUnreadCount(Number(countResponse?.data?.count || 0));
        } catch (error) {
            console.error("Unable to load notifications", error);
        }
    };

    useEffect(() => {
        refresh();
        const interval = window.setInterval(refresh, 30000);
        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        const closeOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", closeOutside);
        return () => document.removeEventListener("mousedown", closeOutside);
    }, []);

    const openNotification = async (notification) => {
        try {
            if (!notification.read) {
                await api.put(`/notifications/${notification.id}/read`);
                setUnreadCount((current) => Math.max(0, current - 1));
                setNotifications((current) =>
                    current.map((item) => item.id === notification.id ? { ...item, read: true } : item)
                );
            }
        } catch (error) {
            console.error("Unable to mark notification read", error);
        }
        setOpen(false);
        navigate(notification.actionUrl || "/notifications");
    };

    const toggle = async () => {
        const nextOpen = !open;
        setOpen(nextOpen);
        if (nextOpen) {
            setLoading(true);
            await refresh();
            setLoading(false);
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                type="button"
                onClick={toggle}
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                className="relative rounded-xl border border-orange-200 bg-white px-3 py-2 text-orange-700 transition hover:bg-orange-50"
            >
                <span aria-hidden="true" className="text-lg">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute -right-2 -top-2 min-w-[1.35rem] rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[11px] font-bold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                        <div>
                            <p className="font-bold text-gray-900">Notifications</p>
                            <p className="text-xs text-gray-500">{unreadCount} unread</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                navigate("/notifications");
                            }}
                            className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                        >
                            View all
                        </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <p className="px-5 py-8 text-center text-sm text-gray-500">Loading notifications...</p>
                        ) : notifications.length === 0 ? (
                            <p className="px-5 py-8 text-center text-sm text-gray-500">You are all caught up.</p>
                        ) : notifications.map((notification) => (
                            <button
                                key={notification.id}
                                type="button"
                                onClick={() => openNotification(notification)}
                                className={`block w-full border-b border-gray-50 px-5 py-4 text-left transition hover:bg-orange-50 ${
                                    notification.read ? "bg-white" : "bg-orange-50/60"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                                    <span className="shrink-0 text-xs text-gray-400">{formatAge(notification.createdAt)}</span>
                                </div>
                                <p className="mt-1 line-clamp-2 text-sm text-gray-600">{notification.message}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
