import {
    getEffectiveMatchScore,
    isAiMatchSource,
    matchSourceLabel,
    selectQualifiedWorkerMatches,
} from "./workerUtils";

test("recognizes hosted DeepSeek recommendations as AI", () => {
    expect(isAiMatchSource("N8N_DEEPSEEK")).toBe(true);
    expect(matchSourceLabel("N8N_DEEPSEEK")).toBe("DeepSeek AI");
    expect(matchSourceLabel("N8N_OLLAMA")).toBe("Local AI");
    expect(matchSourceLabel("FALLBACK")).toBe("Fallback");
});

const shift = (id, title, status = "OPEN") => ({
    id,
    title,
    status,
    roleNeeded: title,
    location: "Central",
    manager: { name: "Harbour Kitchen" },
});

test("uses the AI score before the fallback score", () => {
    expect(getEffectiveMatchScore({ aiScore: 44, fallbackScore: 90 })).toBe(44);
    expect(getEffectiveMatchScore({ aiScore: null, fallbackScore: 61 })).toBe(61);
    expect(getEffectiveMatchScore({})).toBeNull();
});

test("shows only 45% and higher matches when a strong match exists", () => {
    const shifts = [shift(1, "Waiter"), shift(2, "Cashier"), shift(3, "Chef")];
    const matches = {
        1: { aiScore: 45, rank: 2 },
        2: { aiScore: 44, rank: 1 },
        3: { fallbackScore: 80, rank: 3 },
    };

    const result = selectQualifiedWorkerMatches(shifts, matches);

    expect(result.shifts.map(({ id }) => id)).toEqual([1, 3]);
    expect(result.isFallbackActive).toBe(false);
});

test("falls back to every 30%-44% match when no strong match exists", () => {
    const shifts = [shift(1, "Waiter"), shift(2, "Cashier"), shift(3, "Chef")];
    const matches = {
        1: { aiScore: 30, rank: 2 },
        2: { aiScore: 44, rank: 1 },
        3: { fallbackScore: 29, rank: 3 },
    };

    const result = selectQualifiedWorkerMatches(shifts, matches);

    expect(result.shifts.map(({ id }) => id)).toEqual([2, 1]);
    expect(result.isFallbackActive).toBe(true);
});

test("excludes unscored, closed, and search-mismatched shifts", () => {
    const shifts = [
        shift(1, "Waiter"),
        shift(2, "Waiter", "FILLED"),
        shift(3, "Chef"),
        shift(4, "Waiter"),
    ];
    const matches = {
        1: { aiScore: 70, rank: 2 },
        2: { aiScore: 90, rank: 1 },
        3: { aiScore: 80, rank: 3 },
    };

    const result = selectQualifiedWorkerMatches(shifts, matches, "waiter");

    expect(result.shifts.map(({ id }) => id)).toEqual([1]);
    expect(result.candidateCount).toBe(2);
});
