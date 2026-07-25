import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("axios", () => ({
  create: () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  }),
}), { virtual: true });

jest.mock("react-router-dom", () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ element }) => element,
  useNavigate: () => jest.fn(),
  useParams: () => ({ shiftId: "1" }),
}), { virtual: true });

jest.mock("./components/NotificationBell", () => () => null);
test("renders HubPin landing page content", () => {
  render(<App />);
  expect(screen.getAllByText(/hubpin/i).length).toBeGreaterThan(0);
});
