/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { WalletCards } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WorkerHeader from "../components/WorkerHeader";
import { formatDateTime as formatLocalizedDateTime } from "../i18n/formatters";
import PageHeader from "../components/ui/PageHeader";
import api from "../api/axios";
import {
    getNotificationButtonLabel,
    getNotificationPermission,
    getNotificationPreference,
    toggleNotificationPreference,
} from "../api/browserNotifications";
import { getApiErrorMessage, getSavedUser, isActiveWorkerSession } from "./workerUtils";

const formatMoney = (amount) => `$${Number(amount || 0).toFixed(2)}`;

const formatDateTime = (value) => value ? formatLocalizedDateTime(value, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
}) : "Pending";

function WorkerWallet() {
    const navigate = useNavigate();
    const [user] = useState(getSavedUser);
    const [profile, setProfile] = useState(null);
    const [wallet, setWallet] = useState(null);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission());
    const [notificationsEnabled, setNotificationsEnabled] = useState(() => getNotificationPreference(user?.id));

    useEffect(() => {
        if (!isActiveWorkerSession(user)) {
            localStorage.removeItem("user");
            navigate("/login");
            return;
        }

        const loadWallet = async () => {
            try {
                const [profileResponse, walletResponse] = await Promise.all([api.get("/users/me"), api.get("/wallet")]);
                setProfile(profileResponse.data);
                setWallet(walletResponse.data);
            } catch (error) {
                console.error(error);
                setFeedback(getApiErrorMessage(error, "We couldn't load your wallet right now."));
            }
        };
        loadWallet();
    }, [navigate, user]);

    const handleWithdraw = async () => {
        try {
            setFeedback("");
            setIsWithdrawing(true);
            const response = await api.post("/wallet/withdrawals", { amount: wallet?.availableBalance, methodLabel: "Bank transfer" });
            setWallet(response.data);
            setFeedback("Withdrawal request completed.");
        } catch (error) {
            console.error(error);
            setFeedback(getApiErrorMessage(error, "We couldn't complete the withdrawal right now."));
        } finally {
            setIsWithdrawing(false);
        }
    };

    const handleToggleNotifications = async () => {
        const result = await toggleNotificationPreference(user?.id);
        setNotificationPermission(result.permission);
        setNotificationsEnabled(result.enabled);
    };

    const availableBalance = Number(wallet?.availableBalance || 0);

    return (
        <div className="jh-page">
            <WorkerHeader userName={profile?.name || user?.name} notificationLabel={getNotificationButtonLabel(notificationPermission, notificationsEnabled)} notificationsEnabled={notificationsEnabled} onToggleNotifications={handleToggleNotifications} />
            <div className="jh-container py-8 sm:py-10 lg:py-12">
                <section className="max-w-5xl rounded-3xl border border-gray-100 bg-white p-6 shadow-card sm:p-8">
                    <PageHeader eyebrow="Wallet" title="Earnings wallet" description="Track paid shift earnings, previous withdrawals, and the salary available to transfer." actions={<div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700"><WalletCards size={28} aria-hidden="true" /></div>} />

                    {feedback && <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700" role="status">{feedback}</div>}

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5"><p className="text-sm font-medium text-brand-700">Available balance</p><p className="mt-3 text-3xl font-bold text-gray-900">{formatMoney(wallet?.availableBalance)}</p></div>
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5"><p className="text-sm font-medium text-emerald-700">Total earnings</p><p className="mt-3 text-3xl font-bold text-gray-900">{formatMoney(wallet?.totalEarnings)}</p></div>
                        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5"><p className="text-sm font-medium text-sky-700">Withdrawn</p><p className="mt-3 text-3xl font-bold text-gray-900">{formatMoney(wallet?.totalWithdrawn)}</p></div>
                    </div>

                    <button type="button" onClick={handleWithdraw} disabled={isWithdrawing || availableBalance <= 0} className="mt-6 rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300">
                        {isWithdrawing ? "Processing..." : "Withdraw available balance"}
                    </button>

                    <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100">
                        <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr] bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 md:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr]"><span>Transaction</span><span>Amount</span><span>Status</span><span className="hidden md:block">Date</span></div>
                        {wallet?.transactions?.length ? wallet.transactions.map((transaction) => (
                            <div key={`${transaction.type}-${transaction.id}`} className="grid grid-cols-[1.2fr_0.8fr_0.8fr] items-center gap-3 border-t border-gray-100 px-5 py-4 text-sm md:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr]">
                                <div><p className="font-semibold text-gray-900">{transaction.title}</p><p className="mt-1 text-xs text-gray-500">{transaction.type === "EARNING" ? "Shift earning" : transaction.methodLabel || "Withdrawal"}</p></div>
                                <span className={transaction.type === "EARNING" ? "font-semibold text-emerald-700" : "font-semibold text-gray-700"}>{transaction.type === "EARNING" ? "+" : "-"}{formatMoney(transaction.amount)}</span>
                                <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{transaction.status}</span>
                                <span className="hidden text-gray-500 md:block">{formatDateTime(transaction.completedAt || transaction.createdAt)}</span>
                            </div>
                        )) : <div className="border-t border-gray-100 px-5 py-8 text-sm text-gray-500">Paid shifts and withdrawals will appear here.</div>}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default WorkerWallet;
