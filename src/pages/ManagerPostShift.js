import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Sparkles, Store } from "lucide-react";
import api from "../api/axios";
import BrandMark from "../components/BrandMark";
import LanguageSwitcher from "../components/LanguageSwitcher";
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
        <div className="jh-page">
            <header className="border-b border-brand-100/80 bg-white/95 shadow-sm backdrop-blur-xl">
                <div className="jh-container flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <BrandMark subtitle={`Manager · ${profile?.restaurantName || profile?.name || user?.name || "Workspace"}`} />
                    <div className="flex flex-wrap items-center gap-2">
                    <LanguageSwitcher compact />
                    <button
                        type="button"
                        onClick={() => navigate("/manager-home")}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-bold text-brand-700 hover:bg-brand-50"
                    >
                        <ArrowLeft size={17} aria-hidden="true" /> Dashboard
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/manager-profile")}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-bold text-brand-700 hover:bg-brand-50"
                    >
                        <Store size={17} aria-hidden="true" /> Profile
                    </button>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="grid h-11 w-11 place-items-center rounded-xl border border-gray-200 text-gray-500 hover:bg-brand-50 hover:text-brand-700"
                        aria-label="Log out"
                    >
                        <LogOut size={18} aria-hidden="true" />
                    </button>
                    </div>
                </div>
            </header>

            <main className="jh-container py-8 sm:py-10 lg:py-12">
                <section className="mb-8 max-w-4xl">
                    <p className="text-sm uppercase tracking-[0.3em] text-brand-500">New Shift</p>
                    <h2 className="mt-3 text-4xl font-bold text-gray-900">Post a restaurant shift</h2>
                    <p className="mt-3 text-gray-600">
                        Add the schedule, pay, role, and location. Once posted, workers can browse and apply from their dashboards.
                    </p>
                </section>

                {feedback && (
                    <div className="mb-8 max-w-4xl rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
                        {feedback}
                    </div>
                )}

                <section className="mb-8 max-w-5xl rounded-3xl border border-brand-200 bg-white p-6 shadow-card">
                    <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
                        <Sparkles size={14} aria-hidden="true" /> AI Assistant
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
                        className="mt-4 w-full rounded-xl border p-4 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    />

                    {assistantError && (
                        <p className="mt-3 text-sm text-rose-600">{assistantError}</p>
                    )}

                    {assistantMeta?.assumptions && (
                        <p className="mt-3 rounded-xl bg-brand-50 px-4 py-2 text-sm text-brand-700">
                            <span className="font-semibold">Assumptions: </span>
                            {assistantMeta.assumptions}
                        </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={handleGenerateDraft}
                            disabled={isDrafting}
                            className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white shadow-card transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
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

                <form onSubmit={handleCreateShift} className="grid max-w-5xl gap-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-soft sm:p-8 md:grid-cols-2">
                    <label><span className="jh-label">Shift title</span><input type="text" placeholder="Friday dinner service" value={draft.title} onChange={(event) => handleDraftChange("title", event.target.value)} className="jh-field" required /></label>
                    <label><span className="jh-label">Date</span><input type="date" value={draft.date} onChange={(event) => handleDraftChange("date", event.target.value)} className="jh-field" required /></label>
                    <label><span className="jh-label">Start time</span><input type="time" value={draft.startTime} onChange={(event) => handleDraftChange("startTime", event.target.value)} className="jh-field" required /></label>
                    <label><span className="jh-label">End time</span><input type="time" value={draft.endTime} onChange={(event) => handleDraftChange("endTime", event.target.value)} className="jh-field" required /></label>
                    <label><span className="jh-label">Pay per hour ($)</span><input type="number" min="0" step="0.01" placeholder="95" value={draft.pay} onChange={(event) => handleDraftChange("pay", event.target.value)} className="jh-field" required /></label>
                    <label><span className="jh-label">Location</span><input type="text" placeholder="Central, Hong Kong" value={draft.location} onChange={(event) => handleDraftChange("location", event.target.value)} className="jh-field" required /></label>
                    <label>
                        <span className="jh-label">Role needed</span>
                        <select value={draft.roleNeeded} onChange={(event) => handleDraftChange("roleNeeded", event.target.value)} className="jh-field" required>
                            <option value="">Select a role</option>
                            <option value="WAITER">Waiter</option>
                            <option value="CHEF">Chef</option>
                            <option value="BARISTA">Barista</option>
                            <option value="CASHIER">Cashier</option>
                            <option value="KITCHEN HELPER">Kitchen helper</option>
                        </select>
                    </label>
                    <label className="md:col-span-2"><span className="jh-label">Description <span className="font-normal text-gray-400">(optional)</span></span><textarea rows={3} placeholder="Describe the service, team, or anything useful to know" value={draft.description} onChange={(event) => handleDraftChange("description", event.target.value)} className="jh-field min-h-[108px] resize-y" /></label>
                    <label className="md:col-span-2"><span className="jh-label">Requirements <span className="font-normal text-gray-400">(optional)</span></span><textarea rows={3} placeholder="Experience, uniform, certificates, or language requirements" value={draft.requirements} onChange={(event) => handleDraftChange("requirements", event.target.value)} className="jh-field min-h-[108px] resize-y" /></label>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-xl bg-brand-600 p-4 font-semibold text-white shadow-card transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300 md:col-span-2"
                    >
                        {isSubmitting ? "Posting..." : "Post Shift"}
                    </button>
                </form>
            </main>
        </div>
    );
}

export default ManagerPostShift;
