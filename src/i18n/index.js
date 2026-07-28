import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zhHK from "./translations";

export const LANGUAGE_STORAGE_KEY = "jobhub.language";
export const SUPPORTED_LANGUAGES = ["en", "zh-HK"];

export const resolveInitialLanguage = (stored, browserLanguages = []) => {
  if (SUPPORTED_LANGUAGES.includes(stored)) return stored;
  return browserLanguages.some((language) => /^zh(?:-|$)/i.test(language || "")) ? "zh-HK" : "en";
};

const getInitialLanguage = () => {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  const browserLanguages = window.navigator.languages || [window.navigator.language];
  return resolveInitialLanguage(stored, browserLanguages);
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: {} },
        "zh-HK": { translation: zhHK },
      },
      lng: getInitialLanguage(),
      fallbackLng: "en",
      supportedLngs: SUPPORTED_LANGUAGES,
      nonExplicitSupportedLngs: false,
      keySeparator: false,
      nsSeparator: false,
      interpolation: { escapeValue: false },
      returnNull: false,
    });
}

export default i18n;
