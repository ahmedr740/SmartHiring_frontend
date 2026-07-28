import { render, screen } from "@testing-library/react";
import WorkerJobCard from "./WorkerJobCard";

const shift = {
    id: 10,
    title: "Dinner waiter",
    roleNeeded: "Waiter",
    date: "2026-07-31",
    startTime: "18:00",
    endTime: "22:00",
    location: "Central",
    pay: 37,
    manager: { restaurantName: "Harbour Kitchen" },
};

test("shows the match score and pay without exposing the AI provider", () => {
    render(
        <WorkerJobCard
            shift={shift}
            match={{ aiScore: 72, fallbackScore: 65, source: "N8N_DEEPSEEK" }}
            hasApplied={false}
            isSubmitting={false}
            isLiked={false}
            isTogglingLike={false}
            onApply={jest.fn()}
            onToggleLike={jest.fn()}
        />
    );

    expect(screen.getByText("72% fit")).toBeInTheDocument();
    expect(screen.getByText("$37/hr")).toBeInTheDocument();
    expect(screen.queryByText("DeepSeek AI")).not.toBeInTheDocument();
    expect(screen.queryByText("Local AI")).not.toBeInTheDocument();
    expect(screen.queryByText("Fallback")).not.toBeInTheDocument();
});
