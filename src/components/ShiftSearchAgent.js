import { useState } from "react";
import { Search, Sparkles, X } from "lucide-react";

function ShiftSearchAgent({ onSearch, onClear, isSearching, error, hasActiveSearch }) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!query.trim() || isSearching) {
            return;
        }
        onSearch(query);
    };

    const handleClear = () => {
        setQuery("");
        onClear();
    };

    return (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
            {isOpen && (
                <div className="w-80 max-w-[90vw] rounded-3xl border border-brand-100 bg-white p-5 shadow-soft">
                    <p className="flex items-center gap-2 text-sm font-bold text-ink"><Sparkles size={17} className="text-brand-600" aria-hidden="true" />Shift search assistant</p>
                    <p className="mt-1 text-xs text-gray-500">
                        Describe what you&apos;re looking for &mdash; role, day, time, pay &mdash; and we&apos;ll surface similar open shifts below.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2">
                        <textarea
                            rows={3}
                            placeholder="e.g. waiter shifts Friday night, at least $18/hr"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            className="jh-field min-h-[96px] resize-none"
                        />

                        {error && <p className="text-xs text-rose-600">{error}</p>}

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={isSearching}
                                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-2 text-sm font-bold text-white shadow-card hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
                            >
                                <Search size={16} aria-hidden="true" /> {isSearching ? "Searching…" : "Search"}
                            </button>
                            {hasActiveSearch && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="rounded-xl border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                aria-expanded={isOpen}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-soft hover:bg-brand-700"
            >
                {isOpen ? <X size={18} aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
                {isOpen ? "Close" : "AI Assistant"}
            </button>
        </div>
    );
}

export default ShiftSearchAgent;
