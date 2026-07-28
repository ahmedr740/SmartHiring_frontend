import { translateApiMessage } from "../i18n/formatters";

export const statusClasses = {
    PENDING: "bg-amber-100 text-amber-700",
    ACCEPTED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-rose-100 text-rose-700",
};

export const shiftStatusClasses = {
    OPEN: "bg-brand-100 text-brand-700",
    FILLED: "bg-sky-100 text-sky-700",
    IN_PROGRESS: "bg-violet-100 text-violet-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-rose-100 text-rose-700",
};

export const issueStatusClasses = {
    OPEN: "bg-rose-100 text-rose-700",
    REVIEWING: "bg-amber-100 text-amber-700",
    RESOLVED: "bg-emerald-100 text-emerald-700",
};

export const emptyRatingDraft = { rating: "5", review: "" };
export const emptyIssueDraft = { category: "GENERAL", description: "" };

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

export const isAiMatchSource = (source) =>
    source === "OLLAMA" || source === "N8N_OLLAMA" || source === "N8N_DEEPSEEK";

export const matchSourceLabel = (source) => {
    if (source === "N8N_DEEPSEEK") {
        return "DeepSeek AI";
    }
    if (source === "OLLAMA" || source === "N8N_OLLAMA") {
        return "Local AI";
    }
    return "Fallback";
};

export const getApiErrorMessage = (error, fallback) => {
    if (!error.response) {
        return translateApiMessage("We couldn't reach the backend service. Please wait a moment and try again.");
    }

    return translateApiMessage(error.response?.data?.message, fallback);
};

export const buildWorkerReminders = (applications) =>
    applications
        .filter((application) =>
            application.status === "ACCEPTED" ||
            application.status === "REJECTED" ||
            application.shift?.status === "COMPLETED" ||
            application.shift?.paid
        )
        .slice(0, 4)
        .map((application) => {
            if (application.shift?.paid) {
                return `${application.shift?.title}: payment has been marked as paid.`;
            }

            if (application.shift?.status === "COMPLETED") {
                return `${application.shift?.title}: shift completed, rating is available.`;
            }

            if (application.status === "REJECTED") {
                return `${application.shift?.title}: your application was rejected.`;
            }

            return `${application.shift?.title}: your application was accepted.`;
        });

export const buildManagerReminders = (shifts, applications) => {
    const pendingCount = applications.filter((application) => application.status === "PENDING").length;
    const completedUnpaid = shifts.filter((shift) => shift.status === "COMPLETED" && !shift.paid).length;
    const readyToRate = applications.filter((application) =>
        application.status === "ACCEPTED" &&
        application.shift?.status === "COMPLETED" &&
        application.workerRating == null
    ).length;

    return [
        pendingCount > 0 ? `${pendingCount} application${pendingCount === 1 ? "" : "s"} waiting for review.` : null,
        completedUnpaid > 0 ? `${completedUnpaid} completed shift${completedUnpaid === 1 ? "" : "s"} still need payment marked.` : null,
        readyToRate > 0 ? `${readyToRate} completed worker rating${readyToRate === 1 ? "" : "s"} still need submission.` : null,
    ].filter(Boolean);
};
