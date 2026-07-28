import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

function LanguageSwitcher({ light = false, compact = false }) {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";

  const changeLanguage = (nextLanguage) => {
    i18n.changeLanguage(nextLanguage);
  };

  return (
    <div
      className={`inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl border p-1 ${
        light ? "border-white/20 bg-white/10 text-white" : "border-brand-100 bg-white text-gray-600 shadow-sm"
      }`}
      role="group"
      aria-label={language === "zh-HK" ? "選擇語言" : "Choose language"}
    >
      {!compact && <Languages size={16} className="ml-2" aria-hidden="true" />}
      <button
        type="button"
        onClick={() => changeLanguage("en")}
        aria-pressed={language === "en"}
        className={`min-h-9 rounded-lg px-2.5 text-xs font-bold ${
          language === "en"
            ? light ? "bg-white text-brand-800" : "bg-brand-600 text-white"
            : light ? "text-brand-100 hover:bg-white/10" : "text-gray-500 hover:bg-brand-50"
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => changeLanguage("zh-HK")}
        aria-pressed={language === "zh-HK"}
        className={`min-h-9 rounded-lg px-2.5 text-xs font-bold ${
          language === "zh-HK"
            ? light ? "bg-white text-brand-800" : "bg-brand-600 text-white"
            : light ? "text-brand-100 hover:bg-white/10" : "text-gray-500 hover:bg-brand-50"
        }`}
      >
        繁體中文
      </button>
    </div>
  );
}

export default LanguageSwitcher;
