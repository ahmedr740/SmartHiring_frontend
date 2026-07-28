import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import api from "../api/axios";
import { formatRelativeTime } from "../i18n/formatters";

const formatAge = (value) => formatRelativeTime(value);

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
                aria-expanded={open}
                className="relative grid h-11 w-11 place-items-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
            >
                <Bell size={19} aria-hidden="true" />
                {unreadCount > 0 && (
                    <span className="absolute -right-2 -top-2 min-w-[1.35rem] rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[11px] font-bold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-soft">
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
                            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                        >
                            View all
                        </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <p className="px-5 py-8 text-center text-sm text-gray-500">Loading notifications...</p>
                        ) : notifications.length === 0 ? (
                            <div className="px-5 py-9 text-center text-sm text-gray-500"><CheckCheck className="mx-auto mb-3 text-brand-500" size={24} aria-hidden="true" />You are all caught up.</div>
                        ) : notifications.map((notification) => (
                            <button
                                key={notification.id}
                                type="button"
                                onClick={() => openNotification(notification)}
                                className={`block w-full border-b border-gray-50 px-5 py-4 text-left transition hover:bg-brand-50 ${
                                    notification.read ? "bg-white" : "bg-brand-50/60"
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
