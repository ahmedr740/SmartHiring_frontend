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
    toggleNotificationPreference,
} from "../api/browserNotifications";
import {
    getSavedUser,
    getApiErrorMessage,
    isActiveWorkerSession,
    likedShiftIdsFromResponse,
    selectQualifiedWorkerMatches,
} from "./workerUtils";

function WorkerMatches() {
    const navigate = useNavigate();
    const [user] = useState(getSavedUser);
    const [profile, setProfile] = useState(null);
    const [shifts, setShifts] = useState([]);
    const [applications, setApplications] = useState([]);
    const [matches, setMatches] = useState({});
    const [likedShiftIds, setLikedShiftIds] = useState(new Set());
    const [search, setSearch] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [submittingShiftIds, setSubmittingShiftIds] = useState([]);
    const [togglingLikeIds, setTogglingLikeIds] = useState([]);
    const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission());
    const [notificationsEnabled, setNotificationsEnabled] = useState(() => getNotificationPreference(user?.id));

    useEffect(() => {
        if (!isActiveWorkerSession(user)) {
            localStorage.removeItem("user");
            navigate("/login");
            return;
        }

        const loadMatches = async () => {
            try {
                setIsLoading(true);
                const [profileResponse, shiftsResponse, applicationsResponse] = await Promise.all([
                    api.get("/users/me"),
                    api.get("/shifts"),
                    api.get("/applications"),
                ]);
                setProfile(profileResponse.data);
                setShifts(shiftsResponse.data);
                setApplications(applicationsResponse.data);

                const [matchesResult, likedJobsResult] = await Promise.allSettled([
                    api.get("/matches/worker/shifts"),
                    api.get("/liked-jobs"),
                ]);

                if (matchesResult.status === "fulfilled") {
                    setMatches(Object.fromEntries(matchesResult.value.data.map((match) => [match.targetId, match])));
                } else {
                    setFeedback(getApiErrorMessage(matchesResult.reason, "We couldn't load AI job matches right now."));
                }

                if (likedJobsResult.status === "fulfilled") {
                    setLikedShiftIds(likedShiftIdsFromResponse(likedJobsResult.value.data));
                }
            } catch (error) {
                console.error(error);
                setFeedback(getApiErrorMessage(error, "We couldn't load AI job matches right now."));
            } finally {
                setIsLoading(false);
            }
        };

        loadMatches();
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
                setLikedShiftIds((current) => {
                    const next = new Set(current);
                    next.delete(shiftId);
                    return next;
                });
            } else {
                await api.post(`/liked-jobs/${shiftId}`);
                setLikedShiftIds((current) => new Set([...current, shiftId]));
            }
        } catch (error) {
            console.error(error);
            setFeedback(error.response?.data?.message || "Unable to update liked jobs right now.");
        } finally {
            setTogglingLikeIds((current) => current.filter((currentShiftId) => currentShiftId !== shiftId));
        }
    };

    const handleToggleNotifications = async () => {
        const result = await toggleNotificationPreference(user?.id);
        setNotificationPermission(result.permission);
        setNotificationsEnabled(result.enabled);
    };

    const appliedShiftIds = new Set(applications.map((application) => application.shift?.id));
    const {
        shifts: displayedShifts,
        candidateCount,
        isFallbackActive,
    } = selectQualifiedWorkerMatches(shifts, matches, search);

    return (
        <div className="jh-page">
            <WorkerHeader
                userName={profile?.name || user?.name}
                notificationLabel={getNotificationButtonLabel(notificationPermission, notificationsEnabled)}
                notificationsEnabled={notificationsEnabled}
                onToggleNotifications={handleToggleNotifications}
            />

            <div className="jh-container py-8 sm:py-10 lg:py-12">
                <PageHeader
                    eyebrow="AI job match"
                    title="Jobs related to your profile"
                    description="Matches are ranked by your skills, location, rating, availability, and completed shifts. Scores are advisory, so review every shift before applying."
                    actions={(
                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search matched jobs"
                            className="w-full max-w-sm rounded-2xl border border-gray-200 px-4 py-3 shadow-sm focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                        />
                    )}
                />

                {isFallbackActive && (
                    <div className="mb-8 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        <span className="font-semibold">No shifts reached a 45% match.</span>{" "}
                        Showing your closest matches between 30% and 44% instead.
                    </div>
                )}

                {feedback && (
                    <div className="mb-8 max-w-3xl rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
                        {feedback}
                    </div>
                )}

                {isLoading ? (
                    <div className="rounded-2xl border border-brand-100 bg-white p-6 text-gray-600 shadow-sm">
                        Loading job matches...
                    </div>
                ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {displayedShifts.length > 0 ? (
                        displayedShifts.map((shift) => (
                            <div key={shift.id} className="flex flex-col">
                                <WorkerJobCard
                                    shift={shift}
                                    match={matches[shift.id]}
                                    hasApplied={appliedShiftIds.has(shift.id)}
                                    isSubmitting={submittingShiftIds.includes(shift.id)}
                                    isLiked={likedShiftIds.has(shift.id)}
                                    isTogglingLike={togglingLikeIds.includes(shift.id)}
                                    onApply={handleApply}
                                    onToggleLike={handleToggleLike}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-600 shadow-sm md:col-span-2 xl:col-span-3">
                            {candidateCount > 0 ? (
                                <>
                                    <p className="font-semibold text-ink">No shifts currently meet your 30% match minimum.</p>
                                    <p className="mt-1 text-sm">Add more profile details to improve your matches, or browse every open job.</p>
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        <button type="button" onClick={() => navigate("/worker-profile")} className="font-semibold text-brand-600 hover:text-brand-700">
                                            Update matching profile
                                        </button>
                                        <button type="button" onClick={() => navigate("/worker-home")} className="font-semibold text-brand-600 hover:text-brand-700">
                                            Browse all open jobs
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <p>
                                    {search
                                        ? "No matched jobs found for this search."
                                        : "No open jobs are available to rank yet. Add shifts with a manager account first."}
                                </p>
                            )}
                        </div>
                    )}
                </div>
                )}
            </div>

        </div>
    );
}

export default WorkerMatches;
