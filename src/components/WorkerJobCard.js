import { CalendarDays, Clock3, Heart, MapPin, Sparkles, WalletCards } from "lucide-react";
import { matchSourceLabel } from "../pages/workerUtils";
import Button from "./ui/Button";

function WorkerJobCard({ shift, match, hasApplied, isSubmitting, isLiked, isTogglingLike, onApply, onToggleLike }) {
    const matchScore = match?.aiScore ?? match?.fallbackScore;
    const matchSource = matchSourceLabel(match?.source);

    return (
        <article className="group flex h-full flex-col rounded-3xl border border-gray-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft sm:p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">{shift.roleNeeded || "Hospitality shift"}</p>
                    <h3 className="mt-2 text-xl font-extrabold text-ink">{shift.title}</h3>
                    <p className="mt-1 text-sm font-medium text-gray-500">{shift.manager?.restaurantName || shift.manager?.name}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700">
                    <Sparkles size={13} aria-hidden="true" />{matchScore != null ? `${matchScore}% fit` : match?.label || "Review fit"}
                </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-2"><CalendarDays size={16} className="text-brand-600" aria-hidden="true" />{shift.date}</span>
                <span className="flex items-center gap-2"><Clock3 size={16} className="text-brand-600" aria-hidden="true" />{shift.startTime}–{shift.endTime}</span>
                <span className="col-span-2 flex items-center gap-2"><MapPin size={16} className="text-brand-600" aria-hidden="true" />{shift.location}</span>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-2xl bg-canvas px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-bold text-ink"><WalletCards size={17} className="text-accent-600" aria-hidden="true" />${shift.pay}/hr</span>
                {match && <span className="text-xs font-semibold text-gray-400">{matchSource}</span>}
            </div>

            <div className="mt-auto grid gap-3 pt-5 sm:grid-cols-[1fr_auto]">
                <Button type="button" onClick={() => onApply(shift.id)} disabled={hasApplied || isSubmitting}>
                    {hasApplied ? "Application sent" : isSubmitting ? "Applying…" : "Apply for shift"}
                </Button>
                <Button type="button" variant={isLiked ? "danger" : "secondary"} onClick={() => onToggleLike(shift.id, isLiked)} disabled={isTogglingLike} aria-label={isLiked ? `Remove ${shift.title} from saved jobs` : `Save ${shift.title}`}>
                    <Heart size={18} fill={isLiked ? "currentColor" : "none"} aria-hidden="true" />
                    <span className="sm:hidden">{isTogglingLike ? "Saving…" : isLiked ? "Saved" : "Save"}</span>
                </Button>
            </div>
        </article>
    );
}

export default WorkerJobCard;
