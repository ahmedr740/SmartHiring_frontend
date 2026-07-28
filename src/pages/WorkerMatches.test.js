import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import api from "../api/axios";
import WorkerMatches from "./WorkerMatches";

jest.mock("../api/axios", () => ({
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
}));

jest.mock("../components/WorkerHeader", () => () => <div>Worker header</div>);

const shifts = [
    {
        id: 1,
        title: "Qualified waiter shift",
        roleNeeded: "Waiter",
        date: "2026-07-31",
        startTime: "18:00",
        endTime: "22:00",
        location: "Central",
        pay: 37,
        status: "OPEN",
        manager: { restaurantName: "Harbour Kitchen" },
    },
    {
        id: 2,
        title: "Lower match cashier shift",
        roleNeeded: "Cashier",
        date: "2026-08-01",
        startTime: "12:00",
        endTime: "16:00",
        location: "Central",
        pay: 25,
        status: "OPEN",
        manager: { restaurantName: "Central Cafe" },
    },
];

const renderPage = () => render(
    <MemoryRouter initialEntries={["/worker-matches"]}>
        <WorkerMatches />
    </MemoryRouter>
);

beforeEach(() => {
    api.get.mockReset();
    window.localStorage.clear();
    window.localStorage.setItem("user", JSON.stringify({
        id: 7,
        name: "Ava Worker",
        role: "WORKER",
        status: "ACTIVE",
        token: "test-token",
    }));

    api.get.mockImplementation((url) => {
        if (url === "/users/me") return Promise.resolve({ data: { name: "Ava Worker" } });
        if (url === "/shifts") return Promise.resolve({ data: shifts });
        if (url === "/applications") return Promise.resolve({ data: [] });
        if (url === "/liked-jobs") return Promise.resolve({ data: [] });
        if (url === "/matches/worker/shifts") {
            return Promise.resolve({
                data: [
                    { targetId: 1, aiScore: 45, fallbackScore: 70, rank: 2, source: "N8N_DEEPSEEK" },
                    { targetId: 2, aiScore: 44, fallbackScore: 80, rank: 1, source: "N8N_DEEPSEEK" },
                ],
            });
        }
        return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
});

test("renders qualified matches without the assistant or provider branding", async () => {
    renderPage();

    expect(await screen.findByText("Qualified waiter shift")).toBeInTheDocument();
    expect(screen.queryByText("Lower match cashier shift")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "AI Assistant" })).not.toBeInTheDocument();
    expect(screen.queryByText("DeepSeek AI")).not.toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalledWith("/matches/worker/shifts/search", expect.anything());
});

test("explains when 30%-44% fallback matches are shown", async () => {
    const defaultGet = api.get.getMockImplementation();
    api.get.mockImplementation((url) => url === "/matches/worker/shifts"
        ? Promise.resolve({
            data: [
                { targetId: 1, aiScore: 30, rank: 2, source: "N8N_DEEPSEEK" },
                { targetId: 2, aiScore: 44, rank: 1, source: "N8N_DEEPSEEK" },
            ],
        })
        : defaultGet(url));

    renderPage();

    expect(await screen.findByText("No shifts reached a 45% match.")).toBeInTheDocument();
    expect(screen.getByText("Qualified waiter shift")).toBeInTheDocument();
    expect(screen.getByText("Lower match cashier shift")).toBeInTheDocument();
});

test("offers profile and all-jobs actions when no shift reaches 30%", async () => {
    const defaultGet = api.get.getMockImplementation();
    api.get.mockImplementation((url) => url === "/matches/worker/shifts"
        ? Promise.resolve({
            data: [
                { targetId: 1, aiScore: 29, rank: 1, source: "N8N_DEEPSEEK" },
                { targetId: 2, aiScore: null, fallbackScore: null, rank: 2, source: "FALLBACK" },
            ],
        })
        : defaultGet(url));

    renderPage();

    expect(await screen.findByText("No shifts currently meet your 30% match minimum.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update matching profile" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Browse all open jobs" })).toBeInTheDocument();
});
