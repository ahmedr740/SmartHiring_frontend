/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
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
import { buildProfileDraft, getApiErrorMessage, getSavedUser, isActiveWorkerSession } from "./workerUtils";

const formatMoney = (amount) =>
    `$${Number(amount || 0).toFixed(2)}`;

const formatDateTime = (value) => {
    if (!value) {
        return "Pending";
    }

    return formatLocalizedDateTime(value, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

function WorkerProfile() {
    const navigate = useNavigate();
    const [user] = useState(getSavedUser);
    const [profile, setProfile] = useState(null);
    const [profileDraft, setProfileDraft] = useState(buildProfileDraft(null));
    const [wallet, setWallet] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission());
    const [notificationsEnabled, setNotificationsEnabled] = useState(() => getNotificationPreference(user?.id));
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        if (!isActiveWorkerSession(user)) {
            localStorage.removeItem("user");
            navigate("/login");
            return;
        }

        const loadProfile = async () => {
            try {
                const [profileResponse, walletResponse] = await Promise.all([
                    api.get("/users/me"),
                    api.get("/wallet"),
                ]);
                setProfile(profileResponse.data);
                setProfileDraft(buildProfileDraft(profileResponse.data));
                setWallet(walletResponse.data);
            } catch (error) {
                console.error(error);
                setFeedback(getApiErrorMessage(error, "We couldn't load your profile right now."));
            }
        };

        loadProfile();
    }, [navigate, user]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleProfileDraftChange = (field, value) => {
        setProfileDraft((current) => ({ ...current, [field]: value }));
    };

    const handleSaveProfile = async () => {
        try {
            setFeedback("");
            setIsSaving(true);
            const response = await api.put("/users/me", profileDraft);
            setProfile(response.data);
            setProfileDraft(buildProfileDraft(response.data));
            const savedUser = getSavedUser();
            if (savedUser) {
                localStorage.setItem("user", JSON.stringify({ ...savedUser, name: response.data.name }));
            }
            setFeedback("Profile updated successfully.");
        } catch (error) {
            console.error(error);
            setFeedback(error.response?.data?.message || "We couldn't update your profile.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleWithdraw = async () => {
        try {
            setFeedback("");
            setIsWithdrawing(true);
            const response = await api.post("/wallet/withdrawals", {
                amount: wallet?.availableBalance,
                methodLabel: "Bank transfer",
            });
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
            <WorkerHeader
                userName={profile?.name || user?.name}
                notificationLabel={getNotificationButtonLabel(notificationPermission, notificationsEnabled)}
                notificationsEnabled={notificationsEnabled}
                onToggleNotifications={handleToggleNotifications}
            />

            <div className="jh-container py-8 sm:py-10 lg:py-12">
                <section className="max-w-5xl rounded-3xl border border-gray-100 bg-white p-8 shadow-card">
                    <PageHeader eyebrow="Profile" title="Update matching profile" description="Keep your skills, location, and availability updated so job matches are more accurate." />

                    {feedback && (
                        <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
                            {feedback}
                        </div>
                    )}

                    <div className="grid gap-5 md:grid-cols-2">
                        <label><span className="jh-label">Full name</span><input type="text" value={profileDraft.name} onChange={(event) => handleProfileDraftChange("name", event.target.value)} placeholder="Your name" className="jh-field" /></label>
                        <label><span className="jh-label">Preferred location</span><input type="text" value={profileDraft.location} onChange={(event) => handleProfileDraftChange("location", event.target.value)} placeholder="Area or district" className="jh-field" /></label>
                        <label><span className="jh-label">Skills</span><textarea value={profileDraft.skills} onChange={(event) => handleProfileDraftChange("skills", event.target.value)} placeholder="Skills, separated by commas" className="jh-field min-h-[120px] resize-y" /></label>
                        <label><span className="jh-label">Availability</span><textarea value={profileDraft.availability} onChange={(event) => handleProfileDraftChange("availability", event.target.value)} placeholder="For example: weeknights after 6pm, Saturdays" className="jh-field min-h-[120px] resize-y" /></label>
                    </div>

                    <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="mt-6 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
                    >
                        {isSaving ? "Saving..." : "Save profile"}
                    </button>
                </section>

                <section className="mt-8 max-w-5xl rounded-3xl border border-gray-100 bg-white p-8 shadow-card">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <p className="text-sm uppercase tracking-[0.3em] text-brand-500">Wallet</p>
                            <h2 className="mt-3 text-4xl font-bold text-gray-900">Earnings wallet</h2>
                            <p className="mt-3 max-w-2xl text-gray-600">
                                Track paid shift earnings, previous withdrawals, and the balance available to transfer.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleWithdraw}
                            disabled={isWithdrawing || availableBalance <= 0}
                            className="rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                            {isWithdrawing ? "Processing..." : "Withdraw available balance"}
                        </button>
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
                            <p className="text-sm font-medium text-brand-700">Available balance</p>
                            <p className="mt-3 text-3xl font-bold text-gray-900">{formatMoney(wallet?.availableBalance)}</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                            <p className="text-sm font-medium text-emerald-700">Total earnings</p>
                            <p className="mt-3 text-3xl font-bold text-gray-900">{formatMoney(wallet?.totalEarnings)}</p>
                        </div>
                        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
                            <p className="text-sm font-medium text-sky-700">Withdrawn</p>
                            <p className="mt-3 text-3xl font-bold text-gray-900">{formatMoney(wallet?.totalWithdrawn)}</p>
                        </div>
                    </div>

                    <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100">
                        <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr] bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 md:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr]">
                            <span>Transaction</span>
                            <span>Amount</span>
                            <span>Status</span>
                            <span className="hidden md:block">Date</span>
                        </div>

                        {wallet?.transactions?.length ? (
                            wallet.transactions.map((transaction) => (
                                <div
                                    key={`${transaction.type}-${transaction.id}`}
                                    className="grid grid-cols-[1.2fr_0.8fr_0.8fr] items-center gap-3 border-t border-gray-100 px-5 py-4 text-sm md:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr]"
                                >
                                    <div>
                                        <p className="font-semibold text-gray-900">{transaction.title}</p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {transaction.type === "EARNING" ? "Shift earning" : transaction.methodLabel || "Withdrawal"}
                                        </p>
                                    </div>
                                    <span className={transaction.type === "EARNING" ? "font-semibold text-emerald-700" : "font-semibold text-gray-700"}>
                                        {transaction.type === "EARNING" ? "+" : "-"}{formatMoney(transaction.amount)}
                                    </span>
                                    <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                        {transaction.status}
                                    </span>
                                    <span className="hidden text-gray-500 md:block">{formatDateTime(transaction.completedAt || transaction.createdAt)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="border-t border-gray-100 px-5 py-8 text-sm text-gray-500">
                                Paid shifts and withdrawals will appear here.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default WorkerProfile;
