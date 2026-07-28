import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGE_STORAGE_KEY } from "../i18n";
import { translateDisplayText } from "../i18n/formatters";

const TRANSLATABLE_ATTRIBUTES = ["aria-label", "placeholder", "title"];

const shouldSkip = (node) => {
  const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  return !element || Boolean(element.closest("script, style, [data-i18n-ignore='true']"));
};

const translateElement = (element, language) => {
  if (shouldSkip(element)) return;
  TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
    if (!element.hasAttribute?.(attribute)) return;
    const current = element.getAttribute(attribute);
    const next = translateDisplayText(current, language);
    if (next !== current) element.setAttribute(attribute, next);
  });
};

const translateTree = (root, language) => {
  if (!root || shouldSkip(root)) return;

  if (root.nodeType === Node.TEXT_NODE) {
    const next = translateDisplayText(root.nodeValue, language);
    if (next !== root.nodeValue) root.nodeValue = next;
    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE) return;
  translateElement(root, language);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const next = translateDisplayText(node.nodeValue, language);
      if (next !== node.nodeValue) node.nodeValue = next;
    } else {
      translateElement(node, language);
    }
    node = walker.nextNode();
  }
};

function LanguageRuntime({ language: selectedLanguage }) {
  const { i18n } = useTranslation();
  const language = selectedLanguage || i18n.resolvedLanguage || i18n.language || "en";

  useEffect(() => {
    const root = document.getElementById("root");
    document.documentElement.lang = language;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.title = language === "zh-HK"
      ? "JobHub | 餐飲及酒店業人手配對更簡單"
      : "JobHub | Hospitality staffing made simpler";

    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute(
        "content",
        language === "zh-HK"
          ? "JobHub 連繫餐飲及酒店業僱主與可靠的彈性工作人才，讓招聘及找工作更簡單。"
          : "JobHub connects hospitality businesses with dependable flexible workers for better shifts, faster."
      );
    }

    const socialTitle = document.querySelector('meta[property="og:title"]');
    const socialDescription = document.querySelector('meta[property="og:description"]');
    if (socialTitle) socialTitle.setAttribute("content", document.title);
    if (socialDescription && description) socialDescription.setAttribute("content", description.getAttribute("content"));

    translateTree(root, language);
    if (!root) return undefined;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") translateTree(mutation.target, language);
        mutation.addedNodes.forEach((node) => translateTree(node, language));
      });
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  return null;
}

export default LanguageRuntime;
