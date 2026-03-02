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
}), { virtual: true });

test("renders Smart Hiring landing page content", () => {
  render(<App />);
  expect(screen.getAllByText(/smart hiring/i).length).toBeGreaterThan(0);
});
