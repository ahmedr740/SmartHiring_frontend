import { matchSourceLabel } from "../pages/workerUtils";

function WorkerJobCard({
    shift,
    match,
    hasApplied,
    isSubmitting,
    isLiked,
    isTogglingLike,
    isLoadingMatches,
    onApply,
    onToggleLike,
}) {
    const matchScore = match?.aiScore ?? match?.fallbackScore;
    const matchSource = matchSourceLabel(match?.source);

    return (
        <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h4 className="text-xl font-semibold text-gray-800">{shift.title}</h4>
                    <p className="mt-1 text-sm text-gray-500">{shift.manager?.restaurantName || shift.manager?.name}</p>
                </div>

                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                    {match?.label || "Review fit"}
                </span>
            </div>

            <div className="space-y-1 text-sm text-gray-500">
                <p>{shift.date}</p>
                <p>{shift.startTime} - {shift.endTime}</p>
                <p>{shift.location}</p>
                <p>Role: {shift.roleNeeded}</p>
            </div>

            <p className="mt-3 font-medium text-gray-700">${shift.pay}/hr</p>
            <p className="mt-4 text-sm font-semibold text-gray-700">
                Match score: {matchScore != null ? `${matchScore}%` : "Loading..."}
                {match && <span className="ml-2 text-xs font-medium text-gray-400">({matchSource})</span>}
            </p>
            <p className="mt-2 text-xs text-gray-500">
                {match?.explanation || (isLoadingMatches ? "Loading local AI recommendation..." : "Recommendation unavailable.")}
            </p>
            {match?.strengths?.length > 0 && (
                <p className="mt-2 text-xs text-emerald-700">Strengths: {match.strengths.join(" | ")}</p>
            )}
            {match?.risks?.length > 0 && (
                <p className="mt-2 text-xs text-amber-700">Watch: {match.risks.join(" | ")}</p>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                    type="button"
                    onClick={() => onApply(shift.id)}
                    disabled={hasApplied || isSubmitting}
                    className={`rounded-xl py-3 font-semibold shadow-md transition ${
                        hasApplied || isSubmitting
                            ? "cursor-not-allowed bg-gray-200 text-gray-500"
                            : "bg-orange-500 text-white hover:bg-orange-600"
                    }`}
                >
                    {hasApplied ? "Application Sent" : isSubmitting ? "Applying..." : "Apply"}
                </button>

                <button
                    type="button"
                    onClick={() => onToggleLike(shift.id, isLiked)}
                    disabled={isTogglingLike}
                    className={`rounded-xl border py-3 font-semibold transition ${
                        isLiked
                            ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                            : "border-orange-200 text-orange-600 hover:bg-orange-50"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                    {isTogglingLike ? "Saving..." : isLiked ? "Unlike" : "Like"}
                </button>
            </div>
        </div>
    );
}

export default WorkerJobCard;
