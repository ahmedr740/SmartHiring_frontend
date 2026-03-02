/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkerHeader from "../components/WorkerHeader";
import WorkerJobCard from "../components/WorkerJobCard";
import api from "../api/axios";
import {
    emptyRatingDraft,
    getSavedUser,
    isActiveWorkerSession,
    likedShiftIdsFromResponse,
    shiftStatusClasses,
    statusClasses,
} from "./workerUtils";

const tabs = [
    { id: "applied", label: "Applied Jobs" },
    { id: "history", label: "Job History" },
    { id: "liked", label: "Liked Jobs" },
];

function WorkerJobs() {
    const navigate = useNavigate();
    const [user] = useState(getSavedUser);
    const [profile, setProfile] = useState(null);
    const [applications, setApplications] = useState([]);
    const [likedJobs, setLikedJobs] = useState([]);
    const [likedShiftIds, setLikedShiftIds] = useState(new Set());
    const [activeTab, setActiveTab] = useState("applied");
    const [feedback, setFeedback] = useState("");
    const [submittingShiftIds, setSubmittingShiftIds] = useState([]);
    const [togglingLikeIds, setTogglingLikeIds] = useState([]);
    const [submittingRatingId, setSubmittingRatingId] = useState(null);
    const [ratingDrafts, setRatingDrafts] = useState({});

    const loadJobs = async () => {
        try {
            const [profileResponse, applicationsResponse, likedJobsResponse] = await Promise.all([
                api.get("/users/me"),
                api.get("/applications"),
                api.get("/liked-jobs"),
            ]);
            setProfile(profileResponse.data);
            setApplications(applicationsResponse.data);
            setLikedJobs(likedJobsResponse.data);
            setLikedShiftIds(likedShiftIdsFromResponse(likedJobsResponse.data));
        } catch (error) {
            console.error(error);
            setFeedback("We couldn't load your jobs right now.");
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
        } catch (error) {
            console.error(error);
            setFeedback(error.response?.data?.message || "We couldn't save that rating.");
        } finally {
            setSubmittingRatingId(null);
        }
    };

    const appliedShiftIds = new Set(applications.map((application) => application.shift?.id));
    const appliedApplications = applications.filter((application) => application.shift?.status !== "COMPLETED");
    const completedApplications = applications.filter((application) =>
        application.status === "ACCEPTED" && application.shift?.status === "COMPLETED"
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
            <WorkerHeader userName={profile?.name || user?.name} />

            <div className="px-8 py-12 md:px-20">
                <div className="mb-8">
                    <p className="text-sm uppercase tracking-[0.3em] text-orange-500">My Jobs</p>
                    <h2 className="mt-3 text-4xl font-bold text-gray-900">Applications, history, and saved jobs</h2>
                </div>

                <div className="mb-8 flex flex-wrap gap-3">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                                activeTab === tab.id
                                    ? "bg-orange-500 text-white shadow-md"
                                    : "border border-orange-200 bg-white text-orange-600 hover:bg-orange-50"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {feedback && (
                    <div className="mb-8 max-w-3xl rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                        {feedback}
                    </div>
                )}

                {activeTab === "applied" && (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {appliedApplications.length > 0 ? (
                            appliedApplications.map((application) => (
                                <div key={application.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg">
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
                                    <div key={application.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg">
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
                                                    className="rounded-xl border border-orange-200 px-3 py-2"
                                                >
                                                    {[5, 4, 3, 2, 1].map((value) => (
                                                        <option key={value} value={value}>{value}</option>
                                                    ))}
                                                </select>
                                                <textarea
                                                    value={draft.review}
                                                    onChange={(event) => handleRatingDraftChange(application.id, "review", event.target.value)}
                                                    placeholder="Share how the shift went"
                                                    className="min-h-[96px] w-full rounded-2xl border border-orange-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleSubmitRating(application.id)}
                                                    disabled={submittingRatingId === application.id}
                                                    className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
                                                >
                                                    {submittingRatingId === application.id ? "Saving..." : "Submit rating"}
                                                </button>
                                            </div>
                                        )}
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
                                    isLoadingMatches={false}
                                    onApply={handleApply}
                                    onToggleLike={handleToggleLike}
                                />
                            ))
                        ) : (
                            <p className="text-gray-600">Liked jobs will appear here when you save them.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default WorkerJobs;
