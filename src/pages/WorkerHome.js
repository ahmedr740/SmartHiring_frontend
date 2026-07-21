/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkerHeader from "../components/WorkerHeader";
import WorkerJobCard from "../components/WorkerJobCard";
import api from "../api/axios";
import {
    getNotificationButtonLabel,
    getNotificationPermission,
    getNotificationPreference,
    toggleNotificationPreference,
} from "../api/browserNotifications";
import {
    getSavedUser,
    isActiveWorkerSession,
    likedShiftIdsFromResponse,
    getApiErrorMessage,
    matchesShiftSearch,
    shiftStatusClasses,
    statusClasses,
} from "./workerUtils";

function WorkerHome() {
    const navigate = useNavigate();
    const [user] = useState(getSavedUser);
    const [profile, setProfile] = useState(null);
    const [shifts, setShifts] = useState([]);
    const [applications, setApplications] = useState([]);
    const [matchRecommendations, setMatchRecommendations] = useState({});
    const [likedShiftIds, setLikedShiftIds] = useState(new Set());
    const [submittingShiftIds, setSubmittingShiftIds] = useState([]);
    const [togglingLikeIds, setTogglingLikeIds] = useState([]);
    const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission());
    const [notificationsEnabled, setNotificationsEnabled] = useState(() => getNotificationPreference(user?.id));
    const [search, setSearch] = useState("");
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        if (!isActiveWorkerSession(user)) {
            localStorage.removeItem("user");
            navigate("/login");
            return;
        }

        const fetchDashboardData = async () => {
            try {
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
                    setMatchRecommendations(Object.fromEntries(matchesResult.value.data.map((match) => [match.targetId, match])));
                }

                if (likedJobsResult.status === "fulfilled") {
                    setLikedShiftIds(likedShiftIdsFromResponse(likedJobsResult.value.data));
                }
            } catch (error) {
                console.error(error);
                setFeedback(getApiErrorMessage(error, "We couldn't load shifts right now. Please refresh and try again."));
            }
        };

        fetchDashboardData();
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
                setFeedback("Job removed from liked jobs.");
            } else {
                await api.post(`/liked-jobs/${shiftId}`);
                setLikedShiftIds((current) => new Set([...current, shiftId]));
                setFeedback("Job saved to liked jobs.");
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
    const openShifts = shifts.filter((shift) => shift.status === "OPEN");
    const filteredShifts = openShifts
        .filter((shift) => matchesShiftSearch(shift, search))
        .sort((first, second) => {
            const firstMatch = matchRecommendations[first.id];
            const secondMatch = matchRecommendations[second.id];
            return (firstMatch?.rank || 999) - (secondMatch?.rank || 999);
        });

    const upcomingApplications = applications.filter((application) =>
        application.status === "ACCEPTED" && ["FILLED", "IN_PROGRESS"].includes(application.shift?.status)
    );
    const applicationHistory = applications.filter((application) =>
        ["PENDING", "REJECTED"].includes(application.status)
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
            <WorkerHeader
                userName={profile?.name || user?.name}
                notificationLabel={getNotificationButtonLabel(notificationPermission, notificationsEnabled)}
                notificationsEnabled={notificationsEnabled}
                onToggleNotifications={handleToggleNotifications}
            />

            <div className="px-8 py-12 md:px-20">
                <section className="mb-10">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                            <p className="text-sm uppercase tracking-[0.2em] text-orange-500">Rating</p>
                            <p className="mt-3 text-4xl font-bold text-gray-900">{Number(profile?.rating || 0).toFixed(1)}</p>
                            <p className="mt-2 text-sm text-gray-500">{profile?.ratingCount || 0} reviews</p>
                        </div>
                        <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                            <p className="text-sm uppercase tracking-[0.2em] text-orange-500">Completed</p>
                            <p className="mt-3 text-4xl font-bold text-gray-900">{profile?.completedShiftsCount || 0}</p>
                            <p className="mt-2 text-sm text-gray-500">finished shifts</p>
                        </div>
                        <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                            <p className="text-sm uppercase tracking-[0.2em] text-orange-500">Saved</p>
                            <p className="mt-3 text-4xl font-bold text-gray-900">{likedShiftIds.size}</p>
                            <p className="mt-2 text-sm text-gray-500">liked jobs</p>
                        </div>
                    </div>
                </section>

                {feedback && (
                    <div className="mb-8 max-w-3xl rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                        {feedback}
                    </div>
                )}

                <section className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
                    <div>
                        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900">Open Shifts</h3>
                                <p className="mt-2 text-gray-600">Search live openings and save interesting jobs for later.</p>
                            </div>

                            <input
                                type="text"
                                placeholder="Search title, role, location, or restaurant"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className="w-full max-w-sm rounded-2xl border border-gray-200 px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            {filteredShifts.length > 0 ? (
                                filteredShifts.map((shift) => (
                                    <WorkerJobCard
                                        key={shift.id}
                                        shift={shift}
                                        match={matchRecommendations[shift.id]}
                                        hasApplied={appliedShiftIds.has(shift.id)}
                                        isSubmitting={submittingShiftIds.includes(shift.id)}
                                        isLiked={likedShiftIds.has(shift.id)}
                                        isTogglingLike={togglingLikeIds.includes(shift.id)}
                                        onApply={handleApply}
                                        onToggleLike={handleToggleLike}
                                    />
                                ))
                            ) : (
                                <p className="text-gray-600">
                                    {search
                                        ? "No open shifts match your search right now."
                                        : "No open shifts are available yet. Log in as a manager to post one."}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <section className="rounded-[2rem] bg-white p-6 shadow-xl">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">Upcoming Work</h3>
                                    <p className="mt-1 text-sm text-gray-500">Accepted shifts that are staffed or in progress.</p>
                                </div>
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                    {upcomingApplications.length}
                                </span>
                            </div>

                            <div className="space-y-4">
                                {upcomingApplications.length > 0 ? (
                                    upcomingApplications.map((application) => (
                                        <div key={application.id} className="rounded-3xl border border-orange-100 bg-orange-50/50 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{application.shift?.title}</p>
                                                    <p className="text-sm text-gray-500">{application.shift?.manager?.restaurantName || application.shift?.manager?.name}</p>
                                                </div>
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${shiftStatusClasses[application.shift?.status] || "bg-gray-100 text-gray-700"}`}>
                                                    {application.shift?.status}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-sm text-gray-600">
                                                {application.shift?.date} | {application.shift?.startTime} - {application.shift?.endTime}
                                            </p>
                                            <p className="mt-1 text-sm text-gray-600">{application.shift?.location}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No accepted shifts yet.</p>
                                )}
                            </div>
                        </section>

                        <section className="rounded-[2rem] bg-white p-6 shadow-xl">
                            <div className="mb-4">
                                <h3 className="text-2xl font-bold text-gray-900">Application History</h3>
                                <p className="mt-1 text-sm text-gray-500">Pending and rejected applications.</p>
                            </div>
                            <div className="space-y-3">
                                {applicationHistory.length > 0 ? (
                                    applicationHistory.map((application) => (
                                        <div key={application.id} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 px-4 py-3">
                                            <div>
                                                <p className="font-medium text-gray-800">{application.shift?.title}</p>
                                                <p className="text-sm text-gray-500">{application.shift?.location}</p>
                                            </div>
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[application.status] || "bg-gray-100 text-gray-700"}`}>
                                                {application.status}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No pending or rejected applications right now.</p>
                                )}
                            </div>
                        </section>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default WorkerHome;
