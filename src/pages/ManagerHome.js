import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { matchSourceLabel } from "./workerUtils";

const applicationStatusClasses = {
    PENDING: "bg-amber-100 text-amber-700",
    ACCEPTED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-rose-100 text-rose-700",
};

const shiftStatusClasses = {
    OPEN: "bg-orange-100 text-orange-700",
    FILLED: "bg-sky-100 text-sky-700",
    IN_PROGRESS: "bg-violet-100 text-violet-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-rose-100 text-rose-700",
};

const emptyRatingDraft = { rating: "5", review: "" };

const getSavedUser = () => JSON.parse(localStorage.getItem("user") || "null");

const createEmptyShiftDraft = () => ({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    pay: "",
    roleNeeded: "",
    location: "",
});

const createShiftPayload = (values) => ({
    title: values.title,
    date: values.date,
    startTime: values.startTime,
    endTime: values.endTime,
    pay: values.pay,
    roleNeeded: values.roleNeeded,
    location: values.location,
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
    // Posting and moderation both stayed in this page because we were still
    // adjusting the manager flow pretty late in the project.
    const navigate = useNavigate();
    const user = getSavedUser();
    const userId = user?.id;
    const userRole = user?.role;
    const userStatus = user?.status;

    const [profile, setProfile] = useState(null);
    const [shifts, setShifts] = useState([]);
    const [applications, setApplications] = useState([]);
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [pay, setPay] = useState("");
    const [roleNeeded, setRoleNeeded] = useState("");
    const [location, setLocation] = useState("");
    const [feedback, setFeedback] = useState("");
    const [busyKey, setBusyKey] = useState("");
    const [ratingDrafts, setRatingDrafts] = useState({});
    const [editingShiftId, setEditingShiftId] = useState(null);
    const [shiftDraft, setShiftDraft] = useState(createEmptyShiftDraft());
    const [applicantMatches, setApplicantMatches] = useState({});
    const [isLoadingMatches, setIsLoadingMatches] = useState(false);

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
            setFeedback("We couldn't load your dashboard right now. Please refresh and try again.");
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
    }, [navigate, userId, userRole, userStatus]);

    const handleCreateShift = async (e) => {
        e.preventDefault();

        try {
            setFeedback("");
            const response = await api.post("/shifts", createShiftPayload({
                title,
                date,
                startTime,
                endTime,
                pay,
                roleNeeded,
                location,
            }));

            setTitle("");
            setDate("");
            setStartTime("");
            setEndTime("");
            setPay("");
            setRoleNeeded("");
            setLocation("");
            setShifts((current) => [...current, response.data]);
            setFeedback("Shift posted successfully.");
        } catch (error) {
            console.error(error);
            setFeedback(error.response?.data?.message || "We couldn't post that shift. Please try again.");
        }
    };

    const runRefreshAction = async (key, action, successMessage) => {
        try {
            setFeedback("");
            setBusyKey(key);
            await action();
            await loadDashboardData();
            setFeedback(successMessage);
        } catch (error) {
            console.error(error);
            setFeedback(error.response?.data?.message || "We couldn't complete that action right now.");
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
    };

    const handleShiftStatus = async (shiftId, status) => {
        await runRefreshAction(
            `shift-${shiftId}-${status}`,
            () => api.put(`/shifts/${shiftId}/status`, { status }),
            `Shift moved to ${status}.`
        );
    };

    const handleMarkPaid = async (shiftId) => {
        await runRefreshAction(
            `shift-paid-${shiftId}`,
            () => api.put(`/shifts/${shiftId}/payment`),
            "Shift marked as paid."
        );
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

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/login");
    };

    const getApplicationsForShift = (shiftId) =>
        applications.filter((application) => application.shift?.id === shiftId);

    const getLifecycleActions = (shift) => {
        if (shift.status === "FILLED") {
            return [
                { label: "Start shift", status: "IN_PROGRESS" },
                { label: "Cancel shift", status: "CANCELLED" },
            ];
        }

        if (shift.status === "IN_PROGRESS") {
            return [{ label: "Complete shift", status: "COMPLETED" }];
        }

        if (shift.status === "OPEN") {
            return [{ label: "Cancel shift", status: "CANCELLED" }];
        }

        return [];
    };

    const canEditShift = (shift) => !["IN_PROGRESS", "COMPLETED"].includes(shift.status);

    const openShiftCount = shifts.filter((shift) => shift.status === "OPEN").length;
    const activeShiftCount = shifts.filter((shift) => ["FILLED", "IN_PROGRESS"].includes(shift.status)).length;
    const completedShiftCount = shifts.filter((shift) => shift.status === "COMPLETED").length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
            <div className="flex justify-between items-center px-8 md:px-20 py-6 bg-white shadow-sm">
                <h1 className="text-2xl font-bold text-orange-600">Smart Hiring</h1>

                <div className="flex items-center gap-6">
                    <span className="text-gray-600 font-medium">Welcome, {profile?.name || user?.name}</span>

                    <button
                        onClick={handleLogout}
                        className="border border-orange-500 text-orange-600 px-4 py-2 rounded-xl hover:bg-orange-500 hover:text-white transition"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="px-8 md:px-20 py-12 space-y-12">
                <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                    <div className="rounded-[2rem] bg-white p-8 shadow-xl">
                        <p className="text-sm uppercase tracking-[0.3em] text-orange-500">Manager Dashboard</p>
                        <h2 className="mt-3 text-4xl font-bold text-gray-900">Run the full shift lifecycle from one place</h2>
                        <p className="mt-3 max-w-2xl text-gray-600">
                            Post shifts, accept the best-fit worker, move the shift through completion, mark payment, and leave a rating after the work is done.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                        <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                            <p className="text-sm uppercase tracking-[0.2em] text-orange-500">Open shifts</p>
                            <p className="mt-3 text-4xl font-bold text-gray-900">{openShiftCount}</p>
                        </div>
                        <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                            <p className="text-sm uppercase tracking-[0.2em] text-orange-500">Active shifts</p>
                            <p className="mt-3 text-4xl font-bold text-gray-900">{activeShiftCount}</p>
                        </div>
                        <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                            <p className="text-sm uppercase tracking-[0.2em] text-orange-500">Completed</p>
                            <p className="mt-3 text-4xl font-bold text-gray-900">{completedShiftCount}</p>
                            <p className="mt-2 text-sm text-gray-500">{profile?.completedShiftsCount || 0} total finished on your account</p>
                        </div>
                    </div>
                </section>

                {feedback && (
                    <div className="max-w-4xl rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                        {feedback}
                    </div>
                )}

                <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-5xl">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-8">Post New Shift</h3>

                    <form onSubmit={handleCreateShift} className="grid md:grid-cols-2 gap-6">
                        <input
                            type="text"
                            placeholder="Shift Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                            required
                        />

                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                            required
                        />

                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                            required
                        />

                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                            required
                        />

                        <input
                            type="number"
                            placeholder="Pay per hour ($)"
                            value={pay}
                            onChange={(e) => setPay(e.target.value)}
                            className="p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                            required
                        />

                        <input
                            type="text"
                            placeholder="Location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                            required
                        />

                        <select
                            value={roleNeeded}
                            onChange={(e) => setRoleNeeded(e.target.value)}
                            className="p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                            required
                        >
                            <option value="">Select Role Needed</option>
                            <option value="WAITER">Waiter</option>
                            <option value="CHEF">Chef</option>
                            <option value="BARISTA">Barista</option>
                            <option value="CASHIER">Cashier</option>
                            <option value="KITCHEN HELPER">Kitchen Helper</option>
                        </select>

                        <button
                            type="submit"
                            className="md:col-span-2 bg-orange-500 text-white p-4 rounded-xl hover:bg-orange-600 font-semibold transition shadow-lg"
                        >
                            Post Shift
                        </button>
                    </form>
                </div>

                <section>
                    <div className="mb-8">
                        <h3 className="text-3xl font-bold text-gray-900">Your Posted Shifts</h3>
                        <p className="mt-2 text-gray-600">Review candidates, manage live staffing, and close the loop with payment and ratings.</p>
                    </div>

                    <div className="grid gap-8 xl:grid-cols-2">
                        {shifts.map((shift) => {
                            const shiftApplications = getApplicationsForShift(shift.id);
                            const acceptedApplication = shiftApplications.find((application) => application.status === "ACCEPTED");

                            return (
                                <div key={shift.id} className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
                                    {editingShiftId === shift.id ? (
                                        <div className="mb-5 space-y-4 rounded-3xl border border-orange-100 bg-orange-50/60 p-4">
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
                                                <input
                                                    type="text"
                                                    value={shiftDraft.title}
                                                    onChange={(event) => handleShiftDraftChange("title", event.target.value)}
                                                    className="rounded-xl border border-orange-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                />
                                                <input
                                                    type="date"
                                                    value={shiftDraft.date}
                                                    onChange={(event) => handleShiftDraftChange("date", event.target.value)}
                                                    className="rounded-xl border border-orange-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                />
                                                <input
                                                    type="time"
                                                    value={shiftDraft.startTime}
                                                    onChange={(event) => handleShiftDraftChange("startTime", event.target.value)}
                                                    className="rounded-xl border border-orange-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                />
                                                <input
                                                    type="time"
                                                    value={shiftDraft.endTime}
                                                    onChange={(event) => handleShiftDraftChange("endTime", event.target.value)}
                                                    className="rounded-xl border border-orange-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                />
                                                <input
                                                    type="number"
                                                    value={shiftDraft.pay}
                                                    onChange={(event) => handleShiftDraftChange("pay", event.target.value)}
                                                    className="rounded-xl border border-orange-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                />
                                                <input
                                                    type="text"
                                                    value={shiftDraft.location}
                                                    onChange={(event) => handleShiftDraftChange("location", event.target.value)}
                                                    className="rounded-xl border border-orange-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                />
                                                <select
                                                    value={shiftDraft.roleNeeded}
                                                    onChange={(event) => handleShiftDraftChange("roleNeeded", event.target.value)}
                                                    className="rounded-xl border border-orange-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                >
                                                    <option value="WAITER">Waiter</option>
                                                    <option value="CHEF">Chef</option>
                                                    <option value="BARISTA">Barista</option>
                                                    <option value="CASHIER">Cashier</option>
                                                    <option value="KITCHEN HELPER">Kitchen Helper</option>
                                                </select>
                                            </div>

                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveShiftEdit(shift.id)}
                                                    disabled={busyKey === `shift-edit-${shift.id}`}
                                                    className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
                                                >
                                                    {busyKey === `shift-edit-${shift.id}` ? "Saving..." : "Save changes"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingShiftId(null)}
                                                    className="rounded-xl border border-orange-200 px-4 py-3 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-5 flex items-start justify-between gap-4">
                                            <div>
                                                <h4 className="text-2xl font-semibold text-gray-800">{shift.title}</h4>
                                                <p className="mt-1 text-sm text-gray-500">{shift.date} • {shift.startTime} - {shift.endTime}</p>
                                                <p className="mt-1 text-sm text-gray-500">{shift.location}</p>
                                                <p className="mt-3 text-gray-700 font-medium">💰 ${shift.pay}/hr • {shift.roleNeeded}</p>
                                            </div>

                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${shiftStatusClasses[shift.status] || "bg-gray-100 text-gray-700"}`}>
                                                {shift.status}
                                            </span>
                                        </div>
                                    )}

                                    <div className="mb-5 flex flex-wrap gap-3">
                                        {canEditShift(shift) && editingShiftId !== shift.id && (
                                            <button
                                                type="button"
                                                onClick={() => handleStartEditingShift(shift)}
                                                className="rounded-xl border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                                            >
                                                Edit shift
                                            </button>
                                        )}
                                        {getLifecycleActions(shift).map((action) => (
                                            <button
                                                key={action.status}
                                                type="button"
                                                onClick={() => handleShiftStatus(shift.id, action.status)}
                                                disabled={busyKey === `shift-${shift.id}-${action.status}`}
                                                className="rounded-xl border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {busyKey === `shift-${shift.id}-${action.status}` ? "Working..." : action.label}
                                            </button>
                                        ))}
                                        {["OPEN", "CANCELLED"].includes(shift.status) && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteShift(shift.id)}
                                                disabled={busyKey === `shift-delete-${shift.id}`}
                                                className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {busyKey === `shift-delete-${shift.id}` ? "Deleting..." : "Delete shift"}
                                            </button>
                                        )}
                                        {shift.status === "COMPLETED" && !shift.paid && (
                                            <button
                                                type="button"
                                                onClick={() => handleMarkPaid(shift.id)}
                                                disabled={busyKey === `shift-paid-${shift.id}`}
                                                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
                                            >
                                                {busyKey === `shift-paid-${shift.id}` ? "Saving..." : "Mark as paid"}
                                            </button>
                                        )}
                                        {shift.paid && (
                                            <span className="rounded-xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                                                Paid
                                            </span>
                                        )}
                                    </div>

                                    {acceptedApplication && (
                                        <div className="mb-6 rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4">
                                            <p className="text-sm uppercase tracking-[0.2em] text-emerald-600">Assigned worker</p>
                                            <div className="mt-3 flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{acceptedApplication.worker?.name}</p>
                                                    <p className="text-sm text-gray-500">{acceptedApplication.worker?.email}</p>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        Rating {Number(acceptedApplication.worker?.rating || 0).toFixed(1)} • {acceptedApplication.worker?.completedShiftsCount || 0} completed shifts
                                                    </p>
                                                </div>
                                                {(() => {
                                                    const match = applicantMatches[acceptedApplication.id];
                                                    const score = match?.aiScore ?? match?.fallbackScore ?? getWorkerMatchScore(shift, acceptedApplication.worker);
                                                    return (
                                                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                                                    Match {score}% {matchSourceLabel(match?.source)}
                                                </span>
                                                    );
                                                })()}
                                            </div>

                                            {shift.status === "COMPLETED" && (
                                                acceptedApplication.workerRating != null ? (
                                                    <div className="mt-4 rounded-2xl bg-white p-4">
                                                        <p className="text-sm font-semibold text-gray-800">You rated this worker {acceptedApplication.workerRating}/5</p>
                                                        <p className="mt-1 text-sm text-gray-500">{acceptedApplication.workerReview || "No written review added."}</p>
                                                    </div>
                                                ) : (
                                                    <div className="mt-4 space-y-3 rounded-2xl bg-white p-4">
                                                        <div className="flex items-center gap-3">
                                                            <label className="text-sm font-medium text-gray-700" htmlFor={`worker-rating-${acceptedApplication.id}`}>
                                                                Rate worker
                                                            </label>
                                                            <select
                                                                id={`worker-rating-${acceptedApplication.id}`}
                                                                value={(ratingDrafts[acceptedApplication.id] || emptyRatingDraft).rating}
                                                                onChange={(event) => handleRatingDraftChange(acceptedApplication.id, "rating", event.target.value)}
                                                                className="rounded-xl border border-orange-200 px-3 py-2"
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
                                                            className="min-h-[96px] w-full rounded-2xl border border-orange-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSubmitWorkerRating(acceptedApplication.id)}
                                                            disabled={busyKey === `rating-${acceptedApplication.id}`}
                                                            className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
                                                        >
                                                            {busyKey === `rating-${acceptedApplication.id}` ? "Saving..." : "Submit rating"}
                                                        </button>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}

                                    <div className="border-t border-gray-100 pt-5">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <h5 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Applicants</h5>
                                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                                {shiftApplications.length}
                                            </span>
                                        </div>

                                        {shiftApplications.length > 0 ? (
                                            <div className="space-y-4">
                                                {shiftApplications.map((application) => {
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
                                                                        Rating {Number(application.worker?.rating || 0).toFixed(1)} • {application.worker?.completedShiftsCount || 0} completed • Match {matchScore}% ({matchSource})
                                                                    </p>
                                                                    <p className="mt-2 text-xs text-gray-500">
                                                                        {match?.explanation || (isLoadingMatches ? "Loading local AI recommendation..." : "Recommendation unavailable.")}
                                                                    </p>
                                                                    {match?.strengths?.length > 0 && (
                                                                        <p className="mt-1 text-xs text-emerald-700">
                                                                            Strengths: {match.strengths.join(" • ")}
                                                                        </p>
                                                                    )}
                                                                    {match?.risks?.length > 0 && (
                                                                        <p className="mt-1 text-xs text-amber-700">
                                                                            Watch: {match.risks.join(" • ")}
                                                                        </p>
                                                                    )}
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
                                                                    {application.status === "ACCEPTED" ? "Accepted" : "Accept"}
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
                                                                    {application.status === "REJECTED" ? "Rejected" : "Reject"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No applicants yet for this shift.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default ManagerHome;
