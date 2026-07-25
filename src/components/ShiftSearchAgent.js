import { useState } from "react";

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
                <div className="w-80 max-w-[90vw] rounded-3xl border border-orange-200 bg-white p-5 shadow-2xl">
                    <p className="text-sm font-semibold text-gray-900">Shift search assistant</p>
                    <p className="mt-1 text-xs text-gray-500">
                        Describe what you&apos;re looking for &mdash; role, day, time, pay &mdash; and we&apos;ll surface similar open shifts below.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2">
                        <textarea
                            rows={3}
                            placeholder="e.g. waiter shifts Friday night, at least $18/hr"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            className="w-full rounded-xl border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />

                        {error && <p className="text-xs text-rose-600">{error}</p>}

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={isSearching}
                                className="flex-1 rounded-xl bg-orange-500 py-2 text-sm font-semibold text-white shadow transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
                            >
                                {isSearching ? "Searching..." : "Search"}
                            </button>
                            {hasActiveSearch && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="rounded-xl border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
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
                className="rounded-full bg-orange-500 px-5 py-4 text-sm font-semibold text-white shadow-2xl transition hover:bg-orange-600"
            >
                {isOpen ? "Close" : "AI Assistant"}
            </button>
        </div>
    );
}

export default ShiftSearchAgent;
