import i18n, { resolveInitialLanguage } from "./index";
import { formatDateTime, translateApiMessage, translateDisplayText, translateStatus } from "./formatters";

describe("JobHub localization", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
    localStorage.clear();
  });

  test("chooses a supported stored language before the browser language", () => {
    expect(resolveInitialLanguage("en", ["zh-HK"])).toBe("en");
    expect(resolveInitialLanguage("zh-HK", ["en-US"])).toBe("zh-HK");
  });

  test("uses Traditional Chinese for Chinese browsers and English otherwise", () => {
    expect(resolveInitialLanguage(null, ["zh-TW", "en-US"])).toBe("zh-HK");
    expect(resolveInitialLanguage(null, ["en-HK"])).toBe("en");
  });

  test("translates known interface copy and preserves unknown server messages", async () => {
    await i18n.changeLanguage("zh-HK");
    expect(translateDisplayText("My jobs")).toBe("我的工作");
    expect(translateStatus("IN_PROGRESS")).toBe("進行中");
    expect(translateApiMessage("A new server message")).toBe("A new server message");
  });

  test("formats dates with the active locale", async () => {
    const value = "2026-07-31T10:30:00.000Z";
    await i18n.changeLanguage("en");
    const english = formatDateTime(value);
    await i18n.changeLanguage("zh-HK");
    const chinese = formatDateTime(value);
    expect(english).not.toBe(chinese);
    expect(chinese).toMatch(/2026/);
  });
});
