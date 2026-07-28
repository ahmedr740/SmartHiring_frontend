import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BellRing, Send } from "lucide-react";
import api from "../api/axios";
import BrandMark from "../components/BrandMark";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { formatDateTime } from "../i18n/formatters";
import {
    getNotificationButtonLabel,
    getNotificationPermission,
    getNotificationPreference,
    notifyOnce,
    toggleNotificationPreference,
} from "../api/browserNotifications";
import { getApiErrorMessage, getSavedUser } from "./workerUtils";

const buildWebSocketUrl = (shiftId, token) => {
    const url = new URL(process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api");
    url.pathname = "/ws/chat";
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.searchParams.set("shiftId", shiftId);
    url.searchParams.set("token", token);
    return url.toString();
};

function ShiftChat() {
    const { shiftId } = useParams();
    const navigate = useNavigate();
    const user = getSavedUser();
    const socketRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const [feedback, setFeedback] = useState("");
    const [permission, setPermission] = useState(getNotificationPermission());
    const [notificationsEnabled, setNotificationsEnabled] = useState(() => getNotificationPreference(user?.id));
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (!user?.token) {
            navigate("/login");
            return undefined;
        }

        const loadMessages = async () => {
            try {
                const response = await api.get(`/chats/shifts/${shiftId}/messages`);
                setMessages(response.data);
            } catch (error) {
                console.error(error);
                setFeedback(getApiErrorMessage(error, "We couldn't load this chat."));
            }
        };

        loadMessages();

        const socket = new WebSocket(buildWebSocketUrl(shiftId, user.token));
        socketRef.current = socket;
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setMessages((current) => current.some((existing) => existing.id === message.id) ? current : [...current, message]);
            if (message.sender?.id !== user.id) {
                notifyOnce(`chat-${message.id}`, "New JobHub chat message", message.message, notificationsEnabled);
            }
        };
        socket.onerror = () => setFeedback("Live chat connection is unavailable. Messages still save through the server.");

        return () => socket.close();
    }, [navigate, notificationsEnabled, shiftId, user?.id, user?.token]);

    const handleToggleNotifications = async () => {
        const result = await toggleNotificationPreference(user?.id);
        setPermission(result.permission);
        setNotificationsEnabled(result.enabled);
    };

    const handleSend = async (event) => {
        event.preventDefault();
        if (!draft.trim()) {
            return;
        }

        try {
            setFeedback("");
            setIsSending(true);
            const response = await api.post(`/chats/shifts/${shiftId}/messages`, { message: draft });
            setMessages((current) => current.some((message) => message.id === response.data.id) ? current : [...current, response.data]);
            setDraft("");
        } catch (error) {
            console.error(error);
            setFeedback(getApiErrorMessage(error, "We couldn't send that message."));
        } finally {
            setIsSending(false);
        }
    };

    const goBack = () => {
        navigate(user?.role === "MANAGER" ? "/manager-home" : "/worker-jobs");
    };

    return (
        <div className="jh-page">
            <header className="border-b border-brand-100/80 bg-white/95 shadow-sm backdrop-blur-xl">
                <div className="jh-container flex min-h-20 flex-wrap items-center justify-between gap-4">
                    <BrandMark subtitle="Shift conversation" />
                    <div className="flex flex-wrap gap-2">
                    <LanguageSwitcher compact />
                    <button
                        type="button"
                        onClick={handleToggleNotifications}
                        className="hidden min-h-11 items-center gap-2 rounded-xl border border-brand-200 px-4 py-2 text-sm font-bold text-brand-700 hover:bg-brand-50 sm:inline-flex"
                        aria-pressed={notificationsEnabled}
                    >
                        <BellRing size={16} aria-hidden="true" /> {getNotificationButtonLabel(permission, notificationsEnabled)}
                    </button>
                    <button
                        type="button"
                        onClick={goBack}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
                    >
                        <ArrowLeft size={17} aria-hidden="true" /> Back
                    </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-6 py-10">
                {feedback && (
                    <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
                        {feedback}
                    </div>
                )}

                <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card">
                    <div className="mb-5">
                        <h2 className="text-3xl font-bold text-gray-900">Accepted shift conversation</h2>
                        <p className="mt-2 text-gray-600">Messages are saved and shown live to the manager and accepted worker.</p>
                    </div>

                    <div className="max-h-[520px] space-y-4 overflow-y-auto rounded-3xl bg-gray-50 p-4">
                        {messages.length > 0 ? (
                            messages.map((message) => {
                                const isMine = message.sender?.id === user?.id;
                                return (
                                    <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[78%] rounded-3xl px-4 py-3 ${isMine ? "bg-brand-600 text-white" : "bg-white text-gray-800"}`}>
                                            <p className="text-xs font-semibold opacity-80">{message.sender?.name || "User"}</p>
                                            <p className="mt-1">{message.message}</p>
                                            <p className="mt-2 text-xs opacity-70">
                                                {message.createdAt ? formatDateTime(message.createdAt) : "Just now"}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-gray-600">No messages yet.</p>
                        )}
                    </div>

                    <form onSubmit={handleSend} className="mt-5 flex flex-col gap-3 md:flex-row">
                        <input
                            type="text"
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            placeholder="Type a message"
                            className="jh-field flex-1"
                            aria-label="Message"
                        />
                        <button
                            type="submit"
                            disabled={isSending || !draft.trim()}
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-bold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
                        >
                            <Send size={17} aria-hidden="true" /> {isSending ? "Sending…" : "Send"}
                        </button>
                    </form>
                </section>
            </main>
        </div>
    );
}

export default ShiftChat;
