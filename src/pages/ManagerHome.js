import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BellRing, LogOut, Plus, Store } from "lucide-react";
import api from "../api/axios";
import BrandMark from "../components/BrandMark";
import NotificationBell from "../components/NotificationBell";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { formatDateTime } from "../i18n/formatters";
import {
    getNotificationButtonLabel,
    getNotificationPermission,
    getNotificationPreference,
    notifyOnce,
    toggleNotificationPreference,
} from "../api/browserNotifications";
import {
    buildManagerReminders,
    emptyIssueDraft,
    getApiErrorMessage,
    issueStatusClasses,
    matchSourceLabel,
} from "./workerUtils";

const applicationStatusClasses = {
    PENDING: "bg-amber-100 text-amber-700",
    ACCEPTED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-rose-100 text-rose-700",
};

const shiftStatusClasses = {
    OPEN: "bg-brand-100 text-brand-700",
    FILLED: "bg-sky-100 text-sky-700",
    IN_PROGRESS: "bg-violet-100 text-violet-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-rose-100 text-rose-700",
};

const managerTabs = [
    { id: "posted", label: "Posted Shifts" },
    { id: "applications", label: "Applications" },
    { id: "active", label: "Active Shifts" },
    { id: "completed", label: "Completed Shifts" },
];

const emptyRatingDraft = { rating: "5", review: "" };
const getSavedUser = () => JSON.parse(localStorage.getItem("user") || "null");

const normalizeStatus = (status) => (status || "").trim().toUpperCase();

const createEmptyShiftDraft = () => ({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    pay: "",
    roleNeeded: "",
    location: "",
});

const buildShiftDraftFromShift = (shift) => ({
    title: shift.title || "",
    date: shift.date || "",
    startTime: shift.startTime || "",
    endTime: shift.endTime || "",
    pay: shift.pay ?? "",
    roleNeeded: shift.roleNeeded || "",
    location: shift.location || "",
});

const getWorkerMatchScore = (shift, worker) => {
    const skills = (worker?.skills || "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
    const roleNeedle = (shift.roleNeeded || shift.title || "").toLowerCase();
    const roleMatch = skills.some((skill) => roleNeedle.includes(skill) || skill.includes(roleNeedle));
    const locationMatch =
        worker?.location &&
        shift.location &&
        (worker.location.toLowerCase().includes(shift.location.toLowerCase()) ||
            shift.location.toLowerCase().includes(worker.location.toLowerCase()));
    const ratingScore = Math.min(((worker?.rating || 0) / 5) * 20, 20);
    const completionScore = Math.min((worker?.completedShiftsCount || 0) * 2, 10);

    return Math.round((roleMatch ? 45 : 10) + (locationMatch ? 25 : 5) + ratingScore + completionScore);
};

function ManagerHome() {
    const navigate = useNavigate();
    const user = getSavedUser();
    const userId = user?.id;
    const userRole = user?.role;
    const userStatus = user?.status;

    const [profile, setProfile] = useState(null);
    const [shifts, setShifts] = useState([]);
    const [applications, setApplications] = useState([]);
    const [issues, setIssues] = useState([]);
    const [activeTab, setActiveTab] = useState("posted");
    const [feedback, setFeedback] = useState("");
    const [busyKey, setBusyKey] = useState("");
    const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission());
    const [notificationsEnabled, setNotificationsEnabled] = useState(() => getNotificationPreference(userId));
    const [ratingDrafts, setRatingDrafts] = useState({});
    const [issueDrafts, setIssueDrafts] = useState({});
    const [submittingIssueId, setSubmittingIssueId] = useState(null);
    const [editingShiftId, setEditingShiftId] = useState(null);
    const [shiftDraft, setShiftDraft] = useState(createEmptyShiftDraft());
    const [applicantMatches, setApplicantMatches] = useState({});
    const [isLoadingMatches, setIsLoadingMatches] = useState(false);
    const [paymentShift, setPaymentShift] = useState(null);

    const openShiftCount = shifts.filter((shift) => normalizeStatus(shift.status) === "OPEN").length;
    const activeShiftCount = shifts.filter((shift) => ["FILLED", "IN_PROGRESS"].includes(normalizeStatus(shift.status))).length;
    const completedShiftCount = shifts.filter((shift) => normalizeStatus(shift.status) === "COMPLETED").length;
    const pendingApplicationCount = applications.filter((application) => normalizeStatus(application.status) === "PENDING").length;
    const reminders = buildManagerReminders(shifts, applications);

    const loadDashboardData = async () => {
        try {
            setIsLoadingMatches(true);
            const [profileResponse, shiftsResponse, applicationsResponse] = await Promise.all([
                api.get("/users/me"),
                api.get("/shifts"),
                api.get("/applications"),
            ]);
            setProfile(profileResponse.data);
            setShifts(shiftsResponse.data);
            setApplications(applicationsResponse.data);

            const issuesResult = await Promise.allSettled([api.get("/issues")]);
            if (issuesResult[0].status === "fulfilled") {
                setIssues(issuesResult[0].value.data);
            }

            const matchResults = await Promise.allSettled(
                shiftsResponse.data.map((shift) => api.get(`/matches/manager/shifts/${shift.id}/applicants`))
            );
            const nextMatches = {};
            matchResults.forEach((result) => {
                if (result.status === "fulfilled") {
                    result.value.data.forEach((match) => {
                        nextMatches[match.targetId] = match;
                    });
                }
            });
            setApplicantMatches(nextMatches);
        } catch (error) {
            console.error(error);
            setFeedback(getApiErrorMessage(error, "We couldn't load your dashboard right now. Please refresh and try again."));
        } finally {
            setIsLoadingMatches(false);
        }
    };

    useEffect(() => {
        if (!userId) {
            navigate("/login");
            return;
        }

        if (userRole !== "MANAGER" || userStatus !== "ACTIVE") {
            localStorage.removeItem("user");
            navigate("/login");
            return;
        }

        loadDashboardData();
    }, [navigate, userId, userRole, userStatus]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (notificationPermission === "granted" && notificationsEnabled && reminders.length > 0) {
            notifyOnce(`manager-reminder-${reminders.join("|")}`, "JobHub update", reminders[0], notificationsEnabled);
        }
    }, [notificationPermission, notificationsEnabled, reminders]);

    const runRefreshAction = async (key, action, successMessage) => {
        try {
            setFeedback("");
            setBusyKey(key);
            await action();
            await loadDashboardData();
            setFeedback(successMessage);
        } catch (error) {
            console.error(error);
            setFeedback(getApiErrorMessage(error, "We couldn't complete that action right now."));
        } finally {
            setBusyKey("");
        }
    };

    const handleUpdateStatus = async (applicationId, status) => {
        await runRefreshAction(
            `application-${applicationId}-${status}`,
            () => api.put(`/applications/${applicationId}/status`, { status }),
            `Application ${status.toLowerCase()} successfully.`
        );
        notifyOnce(
            `manager-application-${applicationId}-${status}`,
            "Application updated",
            `Application ${status.toLowerCase()} successfully.`,
            notificationsEnabled
        );
    };

    const handleShiftStatus = async (shiftId, status) => {
        await runRefreshAction(
            `shift-${shiftId}-${status}`,
            () => api.put(`/shifts/${shiftId}/status`, { status }),
            `Shift moved to ${status}.`
        );
        notifyOnce(
            `manager-shift-${shiftId}-${status}`,
            "Shift status updated",
            `Shift moved to ${status}.`,
            notificationsEnabled
        );
    };

    const handleStartPayment = async (shift) => {
        try {
            setFeedback("");
            setBusyKey(`shift-payment-start-${shift.id}`);
            const response = await api.post(`/payments/shifts/${shift.id}/start`);
            setPaymentShift({ ...shift, mockPayment: response.data });
        } catch (error) {
            console.error(error);
            setFeedback(getApiErrorMessage(error, "We couldn't start the payment."));
        } finally {
            setBusyKey("");
        }
    };

    const handleConfirmPayment = async () => {
        if (!paymentShift?.mockPayment?.id) {
            return;
        }

        await runRefreshAction(
            `payment-confirm-${paymentShift.mockPayment.id}`,
            () => api.post(`/payments/${paymentShift.mockPayment.id}/confirm`, {
                methodLabel: "Demo card ending 4242",
            }),
            "Payment completed and shift marked as paid."
        );
        notifyOnce(`manager-payment-${paymentShift.id}`, "Payment completed", `${paymentShift.title} is now paid.`, notificationsEnabled);
        setPaymentShift(null);
    };

    const handleDeleteShift = async (shiftId) => {
        await runRefreshAction(
            `shift-delete-${shiftId}`,
            () => api.delete(`/shifts/${shiftId}`),
            "Shift removed successfully."
        );
    };

    const handleStartEditingShift = (shift) => {
        setEditingShiftId(shift.id);
        setShiftDraft(buildShiftDraftFromShift(shift));
    };

    const handleShiftDraftChange = (field, value) => {
        setShiftDraft((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const handleSaveShiftEdit = async (shiftId) => {
        await runRefreshAction(
            `shift-edit-${shiftId}`,
            () => api.put(`/shifts/${shiftId}`, { ...shiftDraft, pay: Number(shiftDraft.pay) }),
            "Shift updated successfully."
        );
        setEditingShiftId(null);
    };

    const handleRatingDraftChange = (applicationId, field, value) => {
        setRatingDrafts((current) => ({
            ...current,
            [applicationId]: {
                ...(current[applicationId] || emptyRatingDraft),
                [field]: value,
            },
        }));
    };

    const handleSubmitWorkerRating = async (applicationId) => {
        const draft = ratingDrafts[applicationId] || emptyRatingDraft;

        await runRefreshAction(
            `rating-${applicationId}`,
            () =>
                api.put(`/applications/${applicationId}/rating`, {
                    rating: Number(draft.rating),
                    review: draft.review,
                }),
            "Worker rating saved."
        );
    };

    const handleIssueDraftChange = (shiftId, field, value) => {
        setIssueDrafts((current) => ({
            ...current,
            [shiftId]: {
                ...(current[shiftId] || emptyIssueDraft),
                [field]: value,
            },
        }));
    };

    const handleSubmitIssue = async (shift) => {
        const draft = issueDrafts[shift.id] || emptyIssueDraft;

        try {
            setFeedback("");
            setSubmittingIssueId(shift.id);
            const response = await api.post("/issues", {
                shiftId: shift.id,
                category: draft.category,
                description: draft.description,
            });
            setIssues((current) => [response.data, ...current]);
            setIssueDrafts((current) => ({
                ...current,
                [shift.id]: emptyIssueDraft,
            }));
            setFeedback("Issue report submitted for admin review.");
        } catch (error) {
            console.error(error);
            setFeedback(getApiErrorMessage(error, "We couldn't submit that issue report."));
        } finally {
            setSubmittingIssueId(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/login");
    };

    const handleToggleNotifications = async () => {
        const result = await toggleNotificationPreference(userId);
        setNotificationPermission(result.permission);
        setNotificationsEnabled(result.enabled);
    };

    const getApplicationsForShift = (shiftId) =>
        applications.filter((application) => application.shift?.id === shiftId);

    const getVisibleApplicationsForShift = (shiftId) =>
        getApplicationsForShift(shiftId).filter((application) => normalizeStatus(application.status) !== "REJECTED");

    const getAcceptedApplication = (shift) =>
        getApplicationsForShift(shift.id).find((application) => normalizeStatus(application.status) === "ACCEPTED");

    const getLifecycleActions = (shift) => {
        const status = normalizeStatus(shift.status);

        if (status === "FILLED") {
            return [
                { label: "Start shift", status: "IN_PROGRESS" },
                { label: "Cancel shift", status: "CANCELLED" },
            ];
        }

        if (status === "IN_PROGRESS") {
            return [{ label: "Complete shift", status: "COMPLETED" }];
        }

        if (status === "OPEN") {
            return [{ label: "Cancel shift", status: "CANCELLED" }];
        }

        return [];
    };

    const postedShifts = shifts.filter((shift) => ["OPEN", "CANCELLED"].includes(normalizeStatus(shift.status)));
    const applicationShifts = shifts.filter((shift) =>
        normalizeStatus(shift.status) === "OPEN" &&
        getVisibleApplicationsForShift(shift.id).length > 0
    );
    const activeShifts = shifts.filter((shift) => ["FILLED", "IN_PROGRESS"].includes(normalizeStatus(shift.status)));
    const completedShifts = shifts.filter((shift) => normalizeStatus(shift.status) === "COMPLETED");

    const renderShiftSummary = (shift) => (
        <div>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h4 className="text-2xl font-semibold text-gray-900">{shift.title}</h4>
                    <p className="mt-1 text-sm text-gray-500">{shift.roleNeeded} | {shift.location}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${shiftStatusClasses[shift.status] || "bg-gray-100 text-gray-700"}`}>
                    {shift.status}
                </span>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-gray-600 sm:grid-cols-3">
                <p>{shift.date}</p>
                <p>{shift.startTime} - {shift.endTime}</p>
                <p>${Number(shift.pay || 0).toFixed(2)}/hr</p>
            </div>
        </div>
    );

    const renderShiftEditForm = (shift) => (
        <div className="space-y-4 rounded-3xl border border-brand-100 bg-brand-50/60 p-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h4 className="text-2xl font-semibold text-gray-800">Edit Shift</h4>
                    <p className="mt-1 text-sm text-gray-500">Update the listing before the shift starts.</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${shiftStatusClasses[shift.status] || "bg-gray-100 text-gray-700"}`}>
                    {shift.status}
                </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {[
                    ["title", "text"],
                    ["date", "date"],
                    ["startTime", "time"],
                    ["endTime", "time"],
                    ["pay", "number"],
                    ["roleNeeded", "text"],
                    ["location", "text"],
                ].map(([field, type]) => (
                    <input
                        key={field}
                        type={type}
                        value={shiftDraft[field]}
                        onChange={(event) => handleShiftDraftChange(field, event.target.value)}
                        className="rounded-xl border border-brand-200 px-4 py-3 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    />
                ))}
            </div>
            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={() => handleSaveShiftEdit(shift.id)}
                    disabled={busyKey === `shift-edit-${shift.id}`}
                    className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
                >
                    {busyKey === `shift-edit-${shift.id}` ? "Saving..." : "Save changes"}
                </button>
                <button
                    type="button"
                    onClick={() => setEditingShiftId(null)}
                    className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                >
                    Cancel
                </button>
            </div>
        </div>
    );

    const renderIssuePanel = (shift) => (
        <div className="rounded-3xl border border-brand-100 bg-brand-50/50 p-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-gray-800">Issue reports</p>
                    <p className="text-xs text-gray-500">Submit or track admin help for this shift.</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700">
                    {issues.filter((issue) => issue.shift?.id === shift.id).length}
                </span>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-[160px_1fr]">
                <select
                    value={(issueDrafts[shift.id] || emptyIssueDraft).category}
                    onChange={(event) => handleIssueDraftChange(shift.id, "category", event.target.value)}
                    className="rounded-xl border border-brand-200 px-3 py-2"
                >
                    <option value="GENERAL">General</option>
                    <option value="PAYMENT">Payment</option>
                    <option value="NO_SHOW">No show</option>
                    <option value="SAFETY">Safety</option>
                    <option value="QUALITY">Quality</option>
                    <option value="OTHER">Other</option>
                </select>
                <input
                    type="text"
                    value={(issueDrafts[shift.id] || emptyIssueDraft).description}
                    onChange={(event) => handleIssueDraftChange(shift.id, "description", event.target.value)}
                    placeholder="Describe the issue for admin review"
                    className="rounded-xl border border-brand-200 px-3 py-2"
                />
            </div>
            <button
                type="button"
                onClick={() => handleSubmitIssue(shift)}
                disabled={submittingIssueId === shift.id}
                className="mt-3 rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-60"
            >
                {submittingIssueId === shift.id ? "Submitting..." : "Submit issue"}
            </button>
            {issues.filter((issue) => issue.shift?.id === shift.id).length > 0 && (
                <div className="mt-4 space-y-2">
                    {issues.filter((issue) => issue.shift?.id === shift.id).map((issue) => (
                        <div key={issue.id} className="rounded-2xl bg-white px-4 py-3 text-sm">
                            <div className="flex items-center justify-between gap-3">
                                <span className="font-medium text-gray-800">{issue.category || "GENERAL"}</span>
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${issueStatusClasses[issue.status] || "bg-gray-100 text-gray-700"}`}>
                                    {issue.status}
                                </span>
                            </div>
                            <p className="mt-2 text-gray-600">{issue.description}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderApplicantCard = (shift, application) => {
        const isBusy = busyKey.startsWith(`application-${application.id}-`);
        const match = applicantMatches[application.id];
        const matchScore = match?.aiScore ?? match?.fallbackScore ?? getWorkerMatchScore(shift, application.worker);
        const matchSource = matchSourceLabel(match?.source);

        return (
            <div key={application.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                        <p className="font-semibold text-gray-800">{application.worker?.name || "Applicant"}</p>
                        <p className="text-sm text-gray-500">{application.worker?.email}</p>
                        <p className="mt-1 text-xs text-gray-500">Skills: {application.worker?.skills || "No skills listed"}</p>
                        <p className="mt-1 text-xs text-gray-500">Location: {application.worker?.location || "No location listed"}</p>
                        <p className="mt-1 text-xs text-gray-500">
                            Rating {Number(application.worker?.rating || 0).toFixed(1)} | {application.worker?.completedShiftsCount || 0} completed | Match {matchScore}% ({matchSource})
                        </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${applicationStatusClasses[application.status] || "bg-gray-100 text-gray-700"}`}>
                        {application.status}
                    </span>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => handleUpdateStatus(application.id, "ACCEPTED")}
                        disabled={isBusy || application.status === "ACCEPTED" || shift.status !== "OPEN"}
                        className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                            isBusy || application.status === "ACCEPTED" || shift.status !== "OPEN"
                                ? "cursor-not-allowed bg-gray-200 text-gray-500"
                                : "bg-emerald-500 text-white hover:bg-emerald-600"
                        }`}
                    >
                        {busyKey === `application-${application.id}-ACCEPTED`
                            ? "Accepting..."
                            : application.status === "ACCEPTED" ? "Accepted" : "Accept"}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleUpdateStatus(application.id, "REJECTED")}
                        disabled={isBusy || application.status === "REJECTED"}
                        className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                            isBusy || application.status === "REJECTED"
                                ? "cursor-not-allowed bg-gray-200 text-gray-500"
                                : "bg-rose-500 text-white hover:bg-rose-600"
                        }`}
                    >
                        {busyKey === `application-${application.id}-REJECTED`
                            ? "Rejecting..."
                            : application.status === "REJECTED" ? "Rejected" : "Reject"}
                    </button>
                </div>
            </div>
        );
    };

    const renderAssignedWorker = (shift, acceptedApplication) => {
        if (!acceptedApplication) {
            return null;
        }

        const match = applicantMatches[acceptedApplication.id];
        const score = match?.aiScore ?? match?.fallbackScore ?? getWorkerMatchScore(shift, acceptedApplication.worker);

        return (
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-emerald-600">Assigned worker</p>
                <div className="mt-3 flex items-start justify-between gap-3">
                    <div>
                        <p className="font-semibold text-gray-900">{acceptedApplication.worker?.name}</p>
                        <p className="text-sm text-gray-500">{acceptedApplication.worker?.email}</p>
                        <p className="mt-1 text-sm text-gray-500">
                            Rating {Number(acceptedApplication.worker?.rating || 0).toFixed(1)} | {acceptedApplication.worker?.completedShiftsCount || 0} completed shifts
                        </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                        Match {score}% {matchSourceLabel(match?.source)}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => navigate(`/shift-chat/${shift.id}`)}
                    className="mt-4 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                    Open shift chat
                </button>
            </div>
        );
    };

    const renderRatingPanel = (acceptedApplication) => {
        if (!acceptedApplication) {
            return null;
        }

        if (acceptedApplication.workerRating != null) {
            return (
                <div className="rounded-2xl bg-white p-4">
                    <p className="text-sm font-semibold text-gray-800">You rated this worker {acceptedApplication.workerRating}/5</p>
                    <p className="mt-1 text-sm text-gray-500">{acceptedApplication.workerReview || "No written review added."}</p>
                </div>
            );
        }

        return (
            <div className="space-y-3 rounded-2xl bg-white p-4">
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700" htmlFor={`worker-rating-${acceptedApplication.id}`}>
                        Rate worker
                    </label>
                    <select
                        id={`worker-rating-${acceptedApplication.id}`}
                        value={(ratingDrafts[acceptedApplication.id] || emptyRatingDraft).rating}
                        onChange={(event) => handleRatingDraftChange(acceptedApplication.id, "rating", event.target.value)}
                        className="rounded-xl border border-brand-200 px-3 py-2"
                    >
                        {[5, 4, 3, 2, 1].map((value) => (
                            <option key={value} value={value}>{value}</option>
                        ))}
                    </select>
                </div>
                <textarea
                    value={(ratingDrafts[acceptedApplication.id] || emptyRatingDraft).review}
                    onChange={(event) => handleRatingDraftChange(acceptedApplication.id, "review", event.target.value)}
                    placeholder="Share how the worker performed"
                    className="min-h-[96px] w-full rounded-2xl border border-brand-200 px-4 py-3 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                />
                <button
                    type="button"
                    onClick={() => handleSubmitWorkerRating(acceptedApplication.id)}
                    disabled={busyKey === `rating-${acceptedApplication.id}`}
                    className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
                >
                    {busyKey === `rating-${acceptedApplication.id}` ? "Saving..." : "Submit rating"}
                </button>
            </div>
        );
    };

    const renderEmpty = (message) => (
        <div className="rounded-3xl bg-white p-8 text-gray-600 shadow-card">
            {message}
        </div>
    );

    const renderPostedSection = () => (
        <div className="grid gap-6 xl:grid-cols-2">
            {postedShifts.length > 0 ? postedShifts.map((shift) => (
                <article key={shift.id} className="space-y-5 rounded-3xl border border-gray-100 bg-white p-6 shadow-card">
                    {editingShiftId === shift.id ? renderShiftEditForm(shift) : renderShiftSummary(shift)}
                    {editingShiftId !== shift.id && shift.status === "OPEN" && (
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => handleStartEditingShift(shift)}
                                className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                            >
                                Edit shift
                            </button>
                            {getLifecycleActions(shift).map((action) => (
                                <button
                                    key={action.status}
                                    type="button"
                                    onClick={() => handleShiftStatus(shift.id, action.status)}
                                    disabled={busyKey === `shift-${shift.id}-${action.status}`}
                                    className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {busyKey === `shift-${shift.id}-${action.status}` ? "Working..." : action.label}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => handleDeleteShift(shift.id)}
                                disabled={busyKey === `shift-delete-${shift.id}`}
                                className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {busyKey === `shift-delete-${shift.id}` ? "Deleting..." : "Delete shift"}
                            </button>
                        </div>
                    )}
                </article>
            )) : renderEmpty("No posted shifts to show. Use Post New Shift to create one.")}
        </div>
    );

    const renderApplicationsSection = () => (
        <div className="grid gap-6 xl:grid-cols-2">
                {applicationShifts.length > 0 ? applicationShifts.map((shift) => {
                const shiftApplications = getVisibleApplicationsForShift(shift.id);
                return (
                    <article key={shift.id} className="space-y-5 rounded-3xl border border-gray-100 bg-white p-6 shadow-card">
                        {renderShiftSummary(shift)}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <h5 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Applicants</h5>
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                    {shiftApplications.length}
                                </span>
                            </div>
                            {shiftApplications.map((application) => renderApplicantCard(shift, application))}
                        </div>
                    </article>
                );
                }) : renderEmpty("Applications will appear here when workers apply for your shifts.")}
        </div>
    );

    const renderActiveSection = () => (
        <div className="grid gap-6 xl:grid-cols-2">
            {activeShifts.length > 0 ? activeShifts.map((shift) => {
                const acceptedApplication = getAcceptedApplication(shift);
                return (
                    <article key={shift.id} className="space-y-5 rounded-3xl border border-gray-100 bg-white p-6 shadow-card">
                        {renderShiftSummary(shift)}
                        {renderAssignedWorker(shift, acceptedApplication)}
                        <div className="flex flex-wrap gap-3">
                            {getLifecycleActions(shift).map((action) => (
                                <button
                                    key={action.status}
                                    type="button"
                                    onClick={() => handleShiftStatus(shift.id, action.status)}
                                    disabled={busyKey === `shift-${shift.id}-${action.status}`}
                                    className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {busyKey === `shift-${shift.id}-${action.status}` ? "Working..." : action.label}
                                </button>
                            ))}
                        </div>
                    </article>
                );
            }) : renderEmpty("No active shifts right now. Accepted shifts will appear here.")}
        </div>
    );

    const renderCompletedSection = () => (
        <div className="grid gap-6 xl:grid-cols-2">
            {completedShifts.length > 0 ? completedShifts.map((shift) => {
                const acceptedApplication = getAcceptedApplication(shift);
                return (
                    <article key={shift.id} className="space-y-5 rounded-3xl border border-gray-100 bg-white p-6 shadow-card">
                        {renderShiftSummary(shift)}
                        {renderAssignedWorker(shift, acceptedApplication)}
                        <div className="flex flex-wrap items-center gap-3">
                            {shift.paid ? (
                                <span className="rounded-xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">Paid</span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => handleStartPayment(shift)}
                                    disabled={busyKey === `shift-payment-start-${shift.id}`}
                                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
                                >
                                    {busyKey === `shift-payment-start-${shift.id}` ? "Opening..." : "Pay Worker"}
                                </button>
                            )}
                            <span className="text-sm text-gray-500">
                                Completed {shift.completedAt ? formatDateTime(shift.completedAt) : "recently"}
                            </span>
                        </div>
                        {renderRatingPanel(acceptedApplication)}
                        {renderIssuePanel(shift)}
                    </article>
                );
            }) : renderEmpty("Completed shifts will appear here after work is finished.")}
        </div>
    );

    const renderActiveTab = () => {
        if (activeTab === "applications") {
            return renderApplicationsSection();
        }

        if (activeTab === "active") {
            return renderActiveSection();
        }

        if (activeTab === "completed") {
            return renderCompletedSection();
        }

        return renderPostedSection();
    };

    return (
        <div className="jh-page">
            <header className="sticky top-0 z-30 border-b border-brand-100/80 bg-white/95 shadow-sm backdrop-blur-xl">
                <div className="jh-container flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
                    <BrandMark subtitle={`Manager · ${profile?.restaurantName || profile?.name || user?.name || "Workspace"}`} />
                    <div className="flex flex-wrap items-center gap-2">
                    <LanguageSwitcher compact />
                    <button
                        type="button"
                        onClick={() => navigate("/manager-post-shift")}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-card hover:bg-brand-700"
                    >
                        <Plus size={17} aria-hidden="true" /> Post shift
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/manager-profile")}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-bold text-brand-700 hover:bg-brand-50"
                    >
                        <Store size={17} aria-hidden="true" /> Profile
                    </button>
                    <NotificationBell />
                    <button
                        type="button"
                        onClick={handleToggleNotifications}
                        className={`hidden min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition lg:inline-flex ${
                            notificationsEnabled
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "border border-gray-200 text-gray-500 hover:bg-brand-50 hover:text-brand-700"
                        }`}
                        aria-pressed={notificationsEnabled}
                    >
                        <BellRing size={16} aria-hidden="true" /> {getNotificationButtonLabel(notificationPermission, notificationsEnabled)}
                    </button>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="grid h-11 w-11 place-items-center rounded-xl border border-gray-200 text-gray-500 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                        aria-label="Log out"
                    >
                        <LogOut size={18} aria-hidden="true" />
                    </button>
                    </div>
                </div>
            </header>

            <div className="space-y-10 jh-container py-8 sm:py-10 lg:py-12">
                <section>
                    <div className="grid gap-4 sm:grid-cols-4">
                        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card">
                            <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Open</p>
                            <p className="mt-3 text-4xl font-bold text-gray-900">{openShiftCount}</p>
                        </div>
                        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card">
                            <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Applications</p>
                            <p className="mt-3 text-4xl font-bold text-gray-900">{pendingApplicationCount}</p>
                        </div>
                        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card">
                            <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Active</p>
                            <p className="mt-3 text-4xl font-bold text-gray-900">{activeShiftCount}</p>
                        </div>
                        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card">
                            <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Completed</p>
                            <p className="mt-3 text-4xl font-bold text-gray-900">{completedShiftCount}</p>
                        </div>
                    </div>
                </section>

                {feedback && (
                    <div className="max-w-4xl rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
                        {feedback}
                    </div>
                )}

                {isLoadingMatches && (
                    <div className="max-w-4xl rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
                        Refreshing dashboard and applicant matches...
                    </div>
                )}

                {reminders.length > 0 && (
                    <div className="grid gap-3 rounded-3xl border border-brand-100 bg-white p-5 shadow-card md:grid-cols-3">
                        {reminders.map((reminder) => (
                            <div key={reminder} className="rounded-2xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
                                {reminder}
                            </div>
                        ))}
                    </div>
                )}

                <section>
                    <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <h3 className="text-3xl font-bold text-gray-900">Shift Management</h3>
                        <div className="flex flex-wrap gap-3">
                            {managerTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                                        activeTab === tab.id
                                            ? "bg-brand-600 text-white shadow-md"
                                            : "border border-brand-200 bg-white text-brand-600 hover:bg-brand-50"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {renderActiveTab()}
                </section>
            </div>

            {paymentShift && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-soft">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm uppercase tracking-[0.25em] text-brand-500">Payment Checkout</p>
                                <h3 className="mt-2 text-2xl font-bold text-gray-900">{paymentShift.title}</h3>
                                <p className="mt-2 text-sm text-gray-600">Mock payment simulation for this completed shift.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPaymentShift(null)}
                                className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                        <div className="mt-5 rounded-2xl bg-brand-50 p-4">
                            <p className="text-sm font-semibold text-gray-700">Amount</p>
                            <p className="mt-1 text-3xl font-bold text-gray-900">
                                ${Number(paymentShift.mockPayment?.amount || 0).toFixed(2)}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                Worker: {paymentShift.assignedWorker?.name || paymentShift.mockPayment?.worker?.name || "Assigned worker"}
                            </p>
                        </div>
                        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            Demo only—no money is transferred and no payment details are collected. The confirmation uses a fixed test card ending in 4242.
                        </div>
                        <button
                            type="button"
                            onClick={handleConfirmPayment}
                            disabled={busyKey === `payment-confirm-${paymentShift.mockPayment?.id}`}
                            className="mt-6 w-full rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
                        >
                            {busyKey === `payment-confirm-${paymentShift.mockPayment?.id}` ? "Processing payment..." : "Pay Worker"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManagerHome;
