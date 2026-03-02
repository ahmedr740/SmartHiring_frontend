export const statusClasses = {
    PENDING: "bg-amber-100 text-amber-700",
    ACCEPTED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-rose-100 text-rose-700",
};

export const shiftStatusClasses = {
    OPEN: "bg-orange-100 text-orange-700",
    FILLED: "bg-sky-100 text-sky-700",
    IN_PROGRESS: "bg-violet-100 text-violet-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-rose-100 text-rose-700",
};

export const emptyRatingDraft = { rating: "5", review: "" };

export const getSavedUser = () => JSON.parse(localStorage.getItem("user") || "null");

export const isActiveWorkerSession = (user) =>
    user?.id && user?.role === "WORKER" && user?.status === "ACTIVE";

export const buildProfileDraft = (profile) => ({
    name: profile?.name || "",
    skills: profile?.skills || "",
    location: profile?.location || "",
    availability: profile?.availability || "",
});

export const matchesShiftSearch = (shift, searchValue) => {
    const searchTerm = searchValue.trim().toLowerCase();
    if (!searchTerm) {
        return true;
    }

    return (
        shift.title?.toLowerCase().includes(searchTerm) ||
        shift.roleNeeded?.toLowerCase().includes(searchTerm) ||
        shift.location?.toLowerCase().includes(searchTerm) ||
        shift.manager?.name?.toLowerCase().includes(searchTerm) ||
        shift.manager?.restaurantName?.toLowerCase().includes(searchTerm)
    );
};

export const likedShiftIdsFromResponse = (likedJobs) =>
    new Set(likedJobs.map((likedJob) => likedJob.shift?.id).filter(Boolean));

export const isAiMatchSource = (source) => source === "OLLAMA" || source === "N8N_OLLAMA";

export const matchSourceLabel = (source) => (isAiMatchSource(source) ? "AI" : "Fallback");
