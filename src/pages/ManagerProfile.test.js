import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ManagerProfile from "./ManagerProfile";
import api from "../api/axios";

const mockNavigate = jest.fn();
const manager = {
    id: 2,
    token: "token",
    role: "MANAGER",
    status: "ACTIVE",
    name: "Mina Lee",
    email: "mina@example.com",
    restaurantName: "Harbour Kitchen",
    phone: "+852 2345 6789",
    location: "Central",
    rating: 4.8,
    ratingCount: 12,
    completedShiftsCount: 24,
};

jest.mock("../api/axios", () => ({ get: jest.fn(), put: jest.fn() }));
jest.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate }));
jest.mock("../components/NotificationBell", () => () => null);

describe("ManagerProfile", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.setItem("user", JSON.stringify(manager));
        api.get.mockResolvedValue({ data: manager });
        api.put.mockResolvedValue({ data: { ...manager, restaurantName: "JobHub Bistro" } });
    });

    afterEach(() => localStorage.clear());

    test("loads and updates the restaurant profile with the existing user API", async () => {
        render(<ManagerProfile />);

        const restaurantInput = await screen.findByLabelText("Restaurant name");
        fireEvent.change(restaurantInput, { target: { value: "JobHub Bistro" } });
        fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

        await waitFor(() => {
            expect(api.put).toHaveBeenCalledWith("/users/me", {
                name: "Mina Lee",
                restaurantName: "JobHub Bistro",
                phone: "+852 2345 6789",
                location: "Central",
            });
        });
        expect(await screen.findByText("Restaurant profile updated successfully.")).toBeInTheDocument();
    });
});
