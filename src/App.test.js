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

jest.mock("./components/NotificationBell", () => () => null);
test("renders JobHub landing page content", () => {
  window.history.pushState({}, "", "/");
  render(<App />);
  expect(screen.getAllByText(/JobHub/i).length).toBeGreaterThan(0);
});
