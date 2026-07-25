/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkerHeader from "../components/WorkerHeader";
import WorkerJobCard from "../components/WorkerJobCard";
import ShiftSearchAgent from "../components/ShiftSearchAgent";
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
    matchesShiftSearch,
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
    const [agentMatches, setAgentMatches] = useState([]);
    const [agentInterpretation, setAgentInterpretation] = useState("");
    const [agentError, setAgentError] = useState("");
    const [isAgentSearching, setIsAgentSearching] = useState(false);
    const [isAgentSearchActive, setIsAgentSearchActive] = useState(false);

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

    const handleAgentSearch = async (query) => {
        try {
            setAgentError("");
            setIsAgentSearching(true);
            const response = await api.post("/matches/worker/shifts/search", { query });
            setAgentMatches(response.data.matches || []);
            setAgentInterpretation(response.data.interpretation || "");
            setIsAgentSearchActive(true);
        } catch (error) {
            console.error(error);
            setAgentError(getApiErrorMessage(error, "We couldn't search shifts right now. Please try again."));
        } finally {
            setIsAgentSearching(false);
        }
    };

    const handleAgentClear = () => {
        setAgentMatches([]);
        setAgentInterpretation("");
        setAgentError("");
        setIsAgentSearchActive(false);
    };

    const appliedShiftIds = new Set(applications.map((application) => application.shift?.id));
    const matchedShifts = shifts
        .filter((shift) => shift.status === "OPEN")
        .filter((shift) => matchesShiftSearch(shift, search))
        .sort((first, second) => {
            const firstMatch = matches[first.id];
            const secondMatch = matches[second.id];
            return (firstMatch?.rank || 999) - (secondMatch?.rank || 999);
        });

    const agentReasonByShiftId = Object.fromEntries(
        agentMatches.map((agentMatch) => [agentMatch.shiftId, agentMatch.reason])
    );
    const displayedShifts = isAgentSearchActive
        ? agentMatches
            .map((agentMatch) => shifts.find((shift) => shift.id === agentMatch.shiftId && shift.status === "OPEN"))
            .filter(Boolean)
        : matchedShifts;

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
            <WorkerHeader
                userName={profile?.name || user?.name}
                notificationLabel={getNotificationButtonLabel(notificationPermission, notificationsEnabled)}
                notificationsEnabled={notificationsEnabled}
                onToggleNotifications={handleToggleNotifications}
            />

            <div className="px-8 py-12 md:px-20">
                <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-orange-500">AI Job Match</p>
                        <h2 className="mt-3 text-4xl font-bold text-gray-900">Jobs related to your profile</h2>
                        <p className="mt-3 max-w-2xl text-gray-600">
                            Matches are ranked by your skills, location, rating, availability, and completed shifts.
                        </p>
                        <p className="mt-2 max-w-2xl text-sm text-gray-500">
                            AI scores are advisory. Review the full shift details and make your own decision before applying.
                        </p>
                    </div>
                    {!isAgentSearchActive && (
                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search matched jobs"
                            className="w-full max-w-sm rounded-2xl border border-gray-200 px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    )}
                </div>

                {isAgentSearchActive && (
                    <div className="mb-8 max-w-3xl rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                        <span className="font-semibold">Showing AI search results.</span>{" "}
                        {agentInterpretation || "Here's what matched your description."}{" "}
                        <button type="button" onClick={handleAgentClear} className="font-semibold underline">
                            Clear
                        </button>
                    </div>
                )}

                {feedback && (
                    <div className="mb-8 max-w-3xl rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                        {feedback}
                    </div>
                )}

                {isLoading ? (
                    <div className="rounded-2xl border border-orange-100 bg-white p-6 text-gray-600 shadow-sm">
                        Loading job matches...
                    </div>
                ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {displayedShifts.length > 0 ? (
                        displayedShifts.map((shift) => (
                            <div key={shift.id} className="flex flex-col gap-2">
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
                                {isAgentSearchActive && agentReasonByShiftId[shift.id] && (
                                    <p className="px-2 text-xs text-gray-500">
                                        AI: {agentReasonByShiftId[shift.id]}
                                    </p>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-600">
                            {isAgentSearchActive
                                ? "No open shifts matched that description. Try broadening it, or clear the search."
                                : search
                                ? "No matched jobs found for this search."
                                : "No open jobs are available to rank yet. Add shifts with a manager account first."}
                        </p>
                    )}
                </div>
                )}
            </div>

            <ShiftSearchAgent
                onSearch={handleAgentSearch}
                onClear={handleAgentClear}
                isSearching={isAgentSearching}
                error={agentError}
                hasActiveSearch={isAgentSearchActive}
            />
        </div>
    );
}

export default WorkerMatches;
