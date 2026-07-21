import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import NotificationBell from "./NotificationBell";
import api from "../api/axios";

const mockNavigate = jest.fn();

jest.mock("../api/axios", () => ({
    get: jest.fn(),
    put: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

describe("NotificationBell", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        api.get.mockImplementation((url) => {
            if (url.includes("unread-count")) {
                return Promise.resolve({ data: { count: 1 } });
            }
            return Promise.resolve({
                data: [{
                    id: 10,
                    title: "Application accepted",
                    message: "Your application was accepted.",
                    actionUrl: "/worker-jobs",
                    read: false,
                    createdAt: new Date().toISOString(),
                }],
            });
        });
        api.put.mockResolvedValue({ data: {} });
    });

    test("shows unread count and opens a notification", async () => {
        render(<NotificationBell />);

        expect(await screen.findByLabelText(/1 unread/i)).toBeInTheDocument();
        fireEvent.click(screen.getByLabelText(/1 unread/i));
        expect(await screen.findByText("Application accepted")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Application accepted"));

        await waitFor(() => {
            expect(api.put).toHaveBeenCalledWith("/notifications/10/read");
            expect(mockNavigate).toHaveBeenCalledWith("/worker-jobs");
        });
    });

    test("links to the full notification history", async () => {
        render(<NotificationBell />);
        fireEvent.click(await screen.findByLabelText(/1 unread/i));
        fireEvent.click(await screen.findByText("View all"));
        expect(mockNavigate).toHaveBeenCalledWith("/notifications");
    });
});
