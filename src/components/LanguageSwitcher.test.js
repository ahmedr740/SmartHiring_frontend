import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import i18n, { LANGUAGE_STORAGE_KEY } from "../i18n";
import LanguageRuntime from "./LanguageRuntime";
import LanguageSwitcher from "./LanguageSwitcher";

describe("LanguageSwitcher", () => {
  beforeEach(async () => {
    localStorage.clear();
    await act(async () => i18n.changeLanguage("en"));
  });

  afterEach(async () => {
    cleanup();
    await act(async () => i18n.changeLanguage("en"));
  });

  test("switches language without navigation and persists the choice", async () => {
    render(
      <>
        <LanguageRuntime />
        <LanguageSwitcher />
      </>
    );

    fireEvent.click(screen.getByRole("button", { name: "繁體中文" }));

    await waitFor(() => {
      expect(i18n.resolvedLanguage).toBe("zh-HK");
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("zh-HK");
      expect(document.documentElement.lang).toBe("zh-HK");
    });
    expect(document.title).toContain("餐飲及酒店業");
    expect(screen.getByRole("button", { name: "繁體中文" })).toHaveAttribute("aria-pressed", "true");
  });

  test("exposes an accessible language group", () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole("group", { name: "Choose language" })).toBeInTheDocument();
  });
});
