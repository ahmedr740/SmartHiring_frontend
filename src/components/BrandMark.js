import { BriefcaseBusiness } from "lucide-react";

function BrandMark({ compact = false, light = false, subtitle }) {
    return (
        <div className="inline-flex items-center gap-3" aria-label="JobHub">
            <span className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${light ? "bg-white text-brand-700" : "bg-brand-600 text-white"}`}>
                <BriefcaseBusiness size={22} strokeWidth={2.2} aria-hidden="true" />
                <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-accent-500" aria-hidden="true" />
            </span>
            {!compact && (
                <span>
                    <span className={`block text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-ink"}`}>
                        Job<span className={light ? "text-brand-100" : "text-brand-600"}>Hub</span>
                    </span>
                    {subtitle && <span className={`block text-xs font-medium ${light ? "text-brand-100" : "text-gray-500"}`}>{subtitle}</span>}
                </span>
            )}
        </div>
    );
}

export default BrandMark;
