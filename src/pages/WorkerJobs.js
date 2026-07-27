/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkerHeader from "../components/WorkerHeader";
import WorkerJobCard from "../components/WorkerJobCard";
import PageHeader from "../components/ui/PageHeader";
import api from "../api/axios";
import {
    getNotificationButtonLabel,
    getNotificationPermission,
    getNotificationPreference,
    notifyOnce,
    toggleNotificationPreference,
} from "../api/browserNotifications";
import {
    buildWorkerReminders,
    emptyIssueDraft,
    emptyRatingDraft,
    getApiErrorMessage,
    getSavedUser,
    issueStatusClasses,
    isActiveWorkerSession,
    likedShiftIdsFromResponse,
    shiftStatusClasses,
    statusClasses,
} from "./workerUtils";

const tabs = [
    { id: "applied", label: "Applied Jobs" },
    { id: "history", label: "Job History" },
    { id: "liked", label: "Liked Jobs" },
    { id: "issues", label: "Issue Reports" },
];

function WorkerJobs() {
    const navigate = useNavigate();
    const [user] = useState(getSavedUser);
    const [profile, setProfile] = useState(null);
    const [applications, setApplications] = useState([]);
    const [likedJobs, setLikedJobs] = useState([]);
    const [issues, setIssues] = useState([]);
    const [likedShiftIds, setLikedShiftIds] = useState(new Set());
    const [activeTab, setActiveTab] = useState("applied");
    const [feedback, setFeedback] = useState("");
    const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission());
    const [notificationsEnabled, setNotificationsEnabled] = useState(() => getNotificationPreference(user?.id));
    const [submittingShiftIds, setSubmittingShiftIds] = useState([]);
    const [togglingLikeIds, setTogglingLikeIds] = useState([]);
    const [submittingRatingId, setSubmittingRatingId] = useState(null);
    const [ratingDrafts, setRatingDrafts] = useState({});
    const [submittingIssueId, setSubmittingIssueId] = useState(null);
    const [issueDrafts, setIssueDrafts] = useState({});
    const reminders = buildWorkerReminders(applications);

    const loadJobs = async () => {
        try {
            const [profileResponse, applicationsResponse, likedJobsResponse, issuesResponse] = await Promise.all([
                api.get("/users/me"),
                api.get("/applications"),
                api.get("/liked-jobs"),
                api.get("/issues"),
            ]);
            setProfile(profileResponse.data);
            setApplications(applicationsResponse.data);
            setLikedJobs(likedJobsResponse.data);
            setIssues(issuesResponse.data);
            setLikedShiftIds(likedShiftIdsFromResponse(likedJobsResponse.data));
        } catch (error) {
            console.error(error);
            setFeedback(getApiErrorMessage(error, "We couldn't load your jobs right now."));
        }
    };

    useEffect(() => {
        if (!isActiveWorkerSession(user)) {
            localStorage.removeItem("user");
            navigate("/login");
            return;
        }

        loadJobs();
    }, [navigate, user]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (notificationPermission === "granted" && notificationsEnabled && reminders.length > 0) {
            notifyOnce(`worker-reminder-${reminders.join("|")}`, "JobHub update", reminders[0], notificationsEnabled);
        }
    }, [notificationPermission, notificationsEnabled, reminders]);

    useEffect(() => {
        if (notificationPermission === "granted" && notificationsEnabled && issues.length > 0) {
            const latestIssue = issues[0];
            notifyOnce(
                `worker-issue-${latestIssue.id}-${latestIssue.status}`,
                "Issue report update",
                `${latestIssue.shift?.title || "Your issue"} is ${latestIssue.status?.toLowerCase()}.`,
                notificationsEnabled
            );
        }
    }, [issues, notificationPermission, notificationsEnabled]);

    const handleApply = async (shiftId) => {
        try {
            setFeedback("");
            setSubmittingShiftIds((current) => [...current, shiftId]);
            const response = await api.post("/applications", { shiftId });
            setApplications((current) => [...current, response.data]);
            setFeedback("Application submitted successfully.");
        } catch (error) {
            console.error(error);
            setFeedback(error.response?.data?.message || "Unable to apply for this shift right now.");
        } finally {
            setSubmittingShiftIds((current) => current.filter((currentShiftId) => currentShiftId !== shiftId));
        }
    };

    const handleToggleLike = async (shiftId, isLiked) => {
        try {
            setFeedback("");
            setTogglingLikeIds((current) => [...current, shiftId]);
            if (isLiked) {
                await api.delete(`/liked-jobs/${shiftId}`);
                setLikedJobs((current) => current.filter((likedJob) => likedJob.shift?.id !== shiftId));
                setLikedShiftIds((current) => {
                    const next = new Set(current);
                    next.delete(shiftId);
                    return next;
                });
            } else {
                const response = await api.post(`/liked-jobs/${shiftId}`);
                setLikedJobs((current) => [response.data, ...current]);
                setLikedShiftIds((current) => new Set([...current, shiftId]));
            }
        } catch (error) {
            console.error(error);
            setFeedback(error.response?.data?.message || "Unable to update liked jobs right now.");
        } finally {
            setTogglingLikeIds((current) => current.filter((currentShiftId) => currentShiftId !== shiftId));
        }
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

    const handleSubmitRating = async (applicationId) => {
        const draft = ratingDrafts[applicationId] || emptyRatingDraft;

        try {
            setFeedback("");
            setSubmittingRatingId(applicationId);
            const response = await api.put(`/applications/${applicationId}/rating`, {
                rating: Number(draft.rating),
                review: draft.review,
            });

            setApplications((current) =>
                current.map((application) => application.id === applicationId ? response.data : application)
            );
            setFeedback("Thanks. Your manager rating has been saved.");
            notifyOnce(`worker-rating-${applicationId}`, "Rating submitted", "Your manager rating has been saved.", notificationsEnabled);
        } catch (error) {
            console.error(error);
            setFeedback(error.response?.data?.message || "We couldn't save that rating.");
        } finally {
            setSubmittingRatingId(null);
        }
    };

    const handleToggleNotifications = async () => {
        const result = await toggleNotificationPreference(user?.id);
        setNotificationPermission(result.permission);
        setNotificationsEnabled(result.enabled);
    };

    const handleIssueDraftChange = (applicationId, field, value) => {
        setIssueDrafts((current) => ({
            ...current,
            [applicationId]: {
                ...(current[applicationId] || emptyIssueDraft),
                [field]: value,
            },
        }));
    };

    const handleSubmitIssue = async (application) => {
        const draft = issueDrafts[application.id] || emptyIssueDraft;

        try {
            setFeedback("");
            setSubmittingIssueId(application.id);
            const response = await api.post("/issues", {
                applicationId: application.id,
                category: draft.category,
                description: draft.description,
            });
            setIssues((current) => [response.data, ...current]);
            setIssueDrafts((current) => ({
                ...current,
                [application.id]: emptyIssueDraft,
            }));
            setFeedback("Issue report submitted for admin review.");
        } catch (error) {
            console.error(error);
            setFeedback(getApiErrorMessage(error, "We couldn't submit that issue report."));
        } finally {
            setSubmittingIssueId(null);
        }
    };

    const appliedShiftIds = new Set(applications.map((application) => application.shift?.id));
    const appliedApplications = applications.filter((application) => application.shift?.status !== "COMPLETED");
    const completedApplications = applications.filter((application) =>
        application.status === "ACCEPTED" && application.shift?.status === "COMPLETED"
    );

    return (
        <div className="jh-page">
            <WorkerHeader
                userName={profile?.name || user?.name}
                notificationLabel={getNotificationButtonLabel(notificationPermission, notificationsEnabled)}
                notificationsEnabled={notificationsEnabled}
                onToggleNotifications={handleToggleNotifications}
            />

            <div className="jh-container py-8 sm:py-10 lg:py-12">
                <PageHeader eyebrow="My jobs" title="Applications, history, and saved jobs" description="Follow every application from first click to completed shift, feedback, and payment." />

                <div className="mb-8 flex flex-wrap gap-3">
                    {tabs.map((tab) => (
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

                {feedback && (
                    <div className="mb-8 max-w-3xl rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
                        {feedback}
                    </div>
                )}

                {activeTab === "applied" && (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {appliedApplications.length > 0 ? (
                            appliedApplications.map((application) => (
                                <div key={application.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-card">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-lg font-semibold text-gray-900">{application.shift?.title}</p>
                                            <p className="text-sm text-gray-500">{application.shift?.manager?.restaurantName || application.shift?.manager?.name}</p>
                                            <p className="mt-2 text-sm text-gray-600">
                                                {application.shift?.date} | {application.shift?.startTime} - {application.shift?.endTime}
                                            </p>
                                            <p className="mt-1 text-sm text-gray-600">{application.shift?.location}</p>
                                        </div>
                                        <div className="space-y-2 text-right">
                                            <span className={`block rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[application.status] || "bg-gray-100 text-gray-700"}`}>
                                                {application.status}
                                            </span>
                                            <span className={`block rounded-full px-3 py-1 text-xs font-semibold ${shiftStatusClasses[application.shift?.status] || "bg-gray-100 text-gray-700"}`}>
                                                {application.shift?.status}
                                            </span>
                                        </div>
                                    </div>
                                    {application.status === "ACCEPTED" && (
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/shift-chat/${application.shift?.id}`)}
                                            className="mt-4 rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                                        >
                                            Open shift chat
                                        </button>
                                    )}
                                    <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                                        <p className="text-sm font-semibold text-gray-800">Report an issue</p>
                                        <div className="mt-3 grid gap-3 md:grid-cols-[180px_1fr]">
                                            <select
                                                value={(issueDrafts[application.id] || emptyIssueDraft).category}
                                                onChange={(event) => handleIssueDraftChange(application.id, "category", event.target.value)}
                                                className="rounded-xl border border-brand-200 px-3 py-2"
                                            >
                                                <option value="GENERAL">General</option>
                                                <option value="PAYMENT">Payment</option>
                                                <option value="NO_SHOW">No show</option>
                                                <option value="SAFETY">Safety</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                            <input
                                                type="text"
                                                value={(issueDrafts[application.id] || emptyIssueDraft).description}
                                                onChange={(event) => handleIssueDraftChange(application.id, "description", event.target.value)}
                                                placeholder="Describe the problem for admin review"
                                                className="rounded-xl border border-brand-200 px-3 py-2"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleSubmitIssue(application)}
                                            disabled={submittingIssueId === application.id}
                                            className="mt-3 rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-60"
                                        >
                                            {submittingIssueId === application.id ? "Submitting..." : "Submit issue"}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-600">You have not applied for any current jobs yet.</p>
                        )}
                    </div>
                )}

                {activeTab === "history" && (
                    <div className="grid gap-5 lg:grid-cols-2">
                        {completedApplications.length > 0 ? (
                            completedApplications.map((application) => {
                                const draft = ratingDrafts[application.id] || emptyRatingDraft;
                                const alreadyRated = application.managerRating != null;

                                return (
                                    <div key={application.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-card">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-lg font-semibold text-gray-900">{application.shift?.title}</p>
                                                <p className="text-sm text-gray-500">{application.shift?.manager?.restaurantName || application.shift?.manager?.name}</p>
                                            </div>
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${application.shift?.paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                                {application.shift?.paid ? "Paid" : "Awaiting payment"}
                                            </span>
                                        </div>

                                        <p className="mt-3 text-sm text-gray-600">
                                            Completed {application.shift?.completedAt ? new Date(application.shift.completedAt).toLocaleString() : "recently"}
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() => navigate(`/shift-chat/${application.shift?.id}`)}
                                            className="mt-4 rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                                        >
                                            Open shift chat
                                        </button>

                                        {alreadyRated ? (
                                            <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                                                <p className="text-sm font-semibold text-gray-800">Your rating: {application.managerRating}/5</p>
                                                <p className="mt-1 text-sm text-gray-500">{application.managerReview || "No written review added."}</p>
                                            </div>
                                        ) : (
                                            <div className="mt-4 space-y-3 rounded-2xl bg-gray-50 p-4">
                                                <select
                                                    value={draft.rating}
                                                    onChange={(event) => handleRatingDraftChange(application.id, "rating", event.target.value)}
                                                    className="rounded-xl border border-brand-200 px-3 py-2"
                                                >
                                                    {[5, 4, 3, 2, 1].map((value) => (
                                                        <option key={value} value={value}>{value}</option>
                                                    ))}
                                                </select>
                                                <textarea
                                                    value={draft.review}
                                                    onChange={(event) => handleRatingDraftChange(application.id, "review", event.target.value)}
                                                    placeholder="Share how the shift went"
                                                    className="min-h-[96px] w-full rounded-2xl border border-brand-200 px-4 py-3 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleSubmitRating(application.id)}
                                                    disabled={submittingRatingId === application.id}
                                                    className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
                                                >
                                                    {submittingRatingId === application.id ? "Saving..." : "Submit rating"}
                                                </button>
                                            </div>
                                        )}
                                        <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                                            <p className="text-sm font-semibold text-gray-800">Need admin help?</p>
                                            <input
                                                type="text"
                                                value={(issueDrafts[application.id] || emptyIssueDraft).description}
                                                onChange={(event) => handleIssueDraftChange(application.id, "description", event.target.value)}
                                                placeholder="Describe a payment, safety, or shift issue"
                                                className="mt-3 w-full rounded-xl border border-brand-200 px-3 py-2"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleSubmitIssue(application)}
                                                disabled={submittingIssueId === application.id}
                                                className="mt-3 rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-60"
                                            >
                                                {submittingIssueId === application.id ? "Submitting..." : "Submit issue"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-gray-600">No completed jobs yet.</p>
                        )}
                    </div>
                )}

                {activeTab === "liked" && (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {likedJobs.length > 0 ? (
                            likedJobs.map((likedJob) => (
                                <WorkerJobCard
                                    key={likedJob.id}
                                    shift={likedJob.shift}
                                    match={null}
                                    hasApplied={appliedShiftIds.has(likedJob.shift?.id)}
                                    isSubmitting={submittingShiftIds.includes(likedJob.shift?.id)}
                                    isLiked={likedShiftIds.has(likedJob.shift?.id)}
                                    isTogglingLike={togglingLikeIds.includes(likedJob.shift?.id)}
                                    onApply={handleApply}
                                    onToggleLike={handleToggleLike}
                                />
                            ))
                        ) : (
                            <p className="text-gray-600">Liked jobs will appear here when you save them.</p>
                        )}
                    </div>
                )}

                {activeTab === "issues" && (
                    <div className="grid gap-5 lg:grid-cols-2">
                        {issues.length > 0 ? (
                            issues.map((issue) => (
                                <div key={issue.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-card">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-lg font-semibold text-gray-900">{issue.shift?.title || "Reported issue"}</p>
                                            <p className="text-sm text-gray-500">{issue.category || "GENERAL"}</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${issueStatusClasses[issue.status] || "bg-gray-100 text-gray-700"}`}>
                                            {issue.status}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm text-gray-600">{issue.description}</p>
                                    <p className="mt-3 text-xs text-gray-400">
                                        Submitted {issue.createdAt ? new Date(issue.createdAt).toLocaleString() : "recently"}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-600">Issue reports you submit will appear here.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default WorkerJobs;
