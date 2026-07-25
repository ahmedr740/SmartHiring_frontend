import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { getApiErrorMessage, isAiMatchSource, matchSourceLabel } from "./workerUtils";

const getSavedUser = () => JSON.parse(localStorage.getItem("user") || "null");

const createShiftPayload = (values) => ({
    title: values.title,
    date: values.date,
    startTime: values.startTime,
    endTime: values.endTime,
    pay: Number(values.pay),
    roleNeeded: values.roleNeeded,
    location: values.location,
    description: values.description,
    requirements: values.requirements,
});

const applyDraftSuggestion = (current, suggestion) => ({
    ...current,
    title: suggestion.title || current.title,
    description: suggestion.description || current.description,
    requirements: suggestion.requirements || current.requirements,
    roleNeeded: suggestion.roleNeeded || current.roleNeeded,
    pay: suggestion.pay != null ? String(suggestion.pay) : current.pay,
    date: suggestion.date || current.date,
    startTime: suggestion.startTime || current.startTime,
    endTime: suggestion.endTime || current.endTime,
    location: suggestion.location || current.location,
});

function ManagerPostShift() {
    const navigate = useNavigate();
    const user = getSavedUser();
    const [profile, setProfile] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [draft, setDraft] = useState({
        title: "",
        date: "",
        startTime: "",
        endTime: "",
        pay: "",
        roleNeeded: "",
        location: "",
        description: "",
        requirements: "",
    });
    const [assistantInput, setAssistantInput] = useState("");
    const [isDrafting, setIsDrafting] = useState(false);
    const [assistantError, setAssistantError] = useState("");
    const [assistantMeta, setAssistantMeta] = useState(null);

    useEffect(() => {
        if (!user?.id || user.role !== "MANAGER" || user.status !== "ACTIVE") {
            localStorage.removeItem("user");
            navigate("/login");
            return;
        }

        api.get("/users/me")
            .then((response) => setProfile(response.data))
            .catch((error) => {
                console.error(error);
                setFeedback(getApiErrorMessage(error, "We couldn't load your manager profile right now."));
            });
    }, [navigate, user?.id, user?.role, user?.status]);

    const handleDraftChange = (field, value) => {
        setDraft((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const handleGenerateDraft = async () => {
        if (!assistantInput.trim()) {
            setAssistantError("Describe the shift you want to post first.");
            return;
        }

        try {
            setAssistantError("");
            setIsDrafting(true);
            const response = await api.post("/shifts/ai-draft", { managerInput: assistantInput });
            const suggestion = response.data;
            setDraft((current) => applyDraftSuggestion(current, suggestion));
            setAssistantMeta({ assumptions: suggestion.assumptions, source: suggestion.source });
        } catch (error) {
            console.error(error);
            setAssistantError(getApiErrorMessage(error, "We couldn't generate a draft right now. Please fill in the form manually."));
        } finally {
            setIsDrafting(false);
        }
    };

    const handleCreateShift = async (event) => {
        event.preventDefault();

        try {
            setFeedback("");
            setIsSubmitting(true);
            await api.post("/shifts", createShiftPayload(draft));
            setFeedback("Shift posted successfully. Returning to your dashboard...");
            setTimeout(() => navigate("/manager-home"), 700);
        } catch (error) {
            console.error(error);
            setFeedback(getApiErrorMessage(error, "We couldn't post that shift. Please try again."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
            <div className="flex flex-col gap-4 bg-white px-8 py-6 shadow-sm md:flex-row md:items-center md:justify-between md:px-20">
                <h1 className="text-2xl font-bold text-orange-600">HubPin</h1>

                <div className="flex flex-wrap items-center gap-3 md:gap-6">
                    <span className="font-medium text-gray-600">Welcome, {profile?.name || user?.name}</span>
                    <button
                        type="button"
                        onClick={() => navigate("/manager-home")}
                        className="rounded-xl border border-orange-300 px-4 py-2 font-semibold text-orange-600 transition hover:bg-orange-50"
                    >
                        Back to Dashboard
                    </button>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-xl border border-orange-500 px-4 py-2 text-orange-600 transition hover:bg-orange-500 hover:text-white"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <main className="px-8 py-12 md:px-20">
                <section className="mb-8 max-w-4xl">
                    <p className="text-sm uppercase tracking-[0.3em] text-orange-500">New Shift</p>
                    <h2 className="mt-3 text-4xl font-bold text-gray-900">Post a restaurant shift</h2>
                    <p className="mt-3 text-gray-600">
                        Add the schedule, pay, role, and location. Once posted, workers can browse and apply from their dashboards.
                    </p>
                </section>

                {feedback && (
                    <div className="mb-8 max-w-4xl rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                        {feedback}
                    </div>
                )}

                <section className="mb-8 max-w-5xl rounded-3xl border border-orange-200 bg-white p-6 shadow-lg">
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600">
                        AI Assistant
                    </span>
                    <h3 className="mt-3 text-lg font-semibold text-gray-900">Draft this shift from a few notes</h3>
                    <p className="mt-2 text-sm text-gray-600">
                        Describe the shift in your own words and we&apos;ll draft the details below for you to review and edit before posting.
                    </p>

                    <textarea
                        rows={3}
                        placeholder="e.g. need 2 servers Fri night, $18/hr, busy weekend"
                        value={assistantInput}
                        onChange={(event) => setAssistantInput(event.target.value)}
                        className="mt-4 w-full rounded-xl border p-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />

                    {assistantError && (
                        <p className="mt-3 text-sm text-rose-600">{assistantError}</p>
                    )}

                    {assistantMeta?.assumptions && (
                        <p className="mt-3 rounded-xl bg-orange-50 px-4 py-2 text-sm text-orange-700">
                            <span className="font-semibold">Assumptions: </span>
                            {assistantMeta.assumptions}
                        </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={handleGenerateDraft}
                            disabled={isDrafting}
                            className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
                        >
                            {isDrafting ? "Drafting..." : "Generate draft"}
                        </button>
                        {assistantMeta?.source && (
                            <span className="text-xs font-medium text-gray-500">
                                {isAiMatchSource(assistantMeta.source)
                                    ? `Drafted by ${matchSourceLabel(assistantMeta.source)}. Review before posting.`
                                    : "Review the draft before posting."}
                            </span>
                        )}
                    </div>
                </section>

                <form onSubmit={handleCreateShift} className="grid max-w-5xl gap-6 rounded-3xl bg-white p-8 shadow-2xl md:grid-cols-2">
                    <input
                        type="text"
                        placeholder="Shift Title"
                        value={draft.title}
                        onChange={(event) => handleDraftChange("title", event.target.value)}
                        className="rounded-xl border p-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        required
                    />

                    <input
                        type="date"
                        value={draft.date}
                        onChange={(event) => handleDraftChange("date", event.target.value)}
                        className="rounded-xl border p-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        required
                    />

                    <input
                        type="time"
                        value={draft.startTime}
                        onChange={(event) => handleDraftChange("startTime", event.target.value)}
                        className="rounded-xl border p-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        required
                    />

                    <input
                        type="time"
                        value={draft.endTime}
                        onChange={(event) => handleDraftChange("endTime", event.target.value)}
                        className="rounded-xl border p-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        required
                    />

                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Pay per hour ($)"
                        value={draft.pay}
                        onChange={(event) => handleDraftChange("pay", event.target.value)}
                        className="rounded-xl border p-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        required
                    />

                    <input
                        type="text"
                        placeholder="Location"
                        value={draft.location}
                        onChange={(event) => handleDraftChange("location", event.target.value)}
                        className="rounded-xl border p-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        required
                    />

                    <select
                        value={draft.roleNeeded}
                        onChange={(event) => handleDraftChange("roleNeeded", event.target.value)}
                        className="rounded-xl border p-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        required
                    >
                        <option value="">Select Role Needed</option>
                        <option value="WAITER">Waiter</option>
                        <option value="CHEF">Chef</option>
                        <option value="BARISTA">Barista</option>
                        <option value="CASHIER">Cashier</option>
                        <option value="KITCHEN HELPER">Kitchen Helper</option>
                    </select>

                    <textarea
                        rows={3}
                        placeholder="Description (optional)"
                        value={draft.description}
                        onChange={(event) => handleDraftChange("description", event.target.value)}
                        className="rounded-xl border p-4 focus:outline-none focus:ring-2 focus:ring-orange-400 md:col-span-2"
                    />

                    <textarea
                        rows={3}
                        placeholder="Requirements (optional)"
                        value={draft.requirements}
                        onChange={(event) => handleDraftChange("requirements", event.target.value)}
                        className="rounded-xl border p-4 focus:outline-none focus:ring-2 focus:ring-orange-400 md:col-span-2"
                    />

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-xl bg-orange-500 p-4 font-semibold text-white shadow-lg transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300 md:col-span-2"
                    >
                        {isSubmitting ? "Posting..." : "Post Shift"}
                    </button>
                </form>
            </main>
        </div>
    );
}

export default ManagerPostShift;
