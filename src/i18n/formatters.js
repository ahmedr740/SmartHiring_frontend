import i18n from "./index";
import zhHK from "./translations";

const reverseZhHK = Object.fromEntries(Object.entries(zhHK).map(([english, chinese]) => [chinese, english]));

const currentLanguage = () => i18n.resolvedLanguage || i18n.language || "en";

const translateDynamicEnglish = (text) => {
  const patterns = [
    [/^Welcome,\s*(.+)$/i, (_, value) => `歡迎你，${value}`],
    [/^Good to see you,\s*(.+)$/i, (_, value) => `很高興再見到你，${value}`],
    [/^Manager\s*·\s*(.+)$/i, (_, value) => `經理 · ${value}`],
    [/^(\d+) unread$/i, (_, value) => `${value} 則未讀`],
    [/^(\d+) applications?$/i, (_, value) => `${value} 份申請`],
    [/^(\d+) shifts?$/i, (_, value) => `${value} 個更次`],
    [/^(\d+) workers?$/i, (_, value) => `${value} 位工作人員`],
    [/^(\d+)% match$/i, (_, value) => `${value}% 配對`],
    [/^(\d+)% fit$/i, (_, value) => `${value}% 合適`],
    [/^Completed\s+(.+)$/i, (_, value) => `完成於 ${value}`],
    [/^Submitted\s+(.+)$/i, (_, value) => `提交於 ${value}`],
    [/^Joined:\s*(.+)$/i, (_, value) => `加入日期：${value}`],
    [/^Notifications,\s*(\d+) unread$/i, (_, value) => `通知，${value} 則未讀`],
    [/^(.+): your application was accepted\.$/i, (_, value) => `${value}：你的申請已獲接受。`],
    [/^(.+): your application was rejected\.$/i, (_, value) => `${value}：你的申請已被拒絕。`],
    [/^(.+): shift completed, rating is available\.$/i, (_, value) => `${value}：更次已完成，現可提交評分。`],
    [/^(.+) is now paid\.$/i, (_, value) => `${value} 現已付款。`],
    [/^(.+): payment has been marked as paid\.$/i, (_, value) => `${value}：付款已標示為完成。`],
    [/^(\$[\d,.]+)\/hr$/i, (_, value) => `${value}/小時`],
  ];
  for (const [pattern, formatter] of patterns) {
    if (pattern.test(text)) return text.replace(pattern, formatter);
  }
  return null;
};

const translateDynamicChinese = (text) => {
  const patterns = [
    [/^歡迎你，(.+)$/, (_, value) => `Welcome, ${value}`],
    [/^很高興再見到你，(.+)$/, (_, value) => `Good to see you, ${value}`],
    [/^經理\s*·\s*(.+)$/, (_, value) => `Manager · ${value}`],
    [/^(\d+) 則未讀$/, (_, value) => `${value} unread`],
    [/^(\d+) 份申請$/, (_, value) => `${value} applications`],
    [/^(\d+) 個更次$/, (_, value) => `${value} shifts`],
    [/^(\d+) 位工作人員$/, (_, value) => `${value} workers`],
    [/^(\d+)% 配對$/, (_, value) => `${value}% match`],
    [/^(\d+)% 合適$/, (_, value) => `${value}% fit`],
    [/^完成於 (.+)$/, (_, value) => `Completed ${value}`],
    [/^提交於 (.+)$/, (_, value) => `Submitted ${value}`],
    [/^加入日期：(.+)$/, (_, value) => `Joined: ${value}`],
    [/^通知，(\d+) 則未讀$/, (_, value) => `Notifications, ${value} unread`],
    [/^(.+)：你的申請已獲接受。$/, (_, value) => `${value}: your application was accepted.`],
    [/^(.+)：你的申請已被拒絕。$/, (_, value) => `${value}: your application was rejected.`],
    [/^(.+)：更次已完成，現可提交評分。$/, (_, value) => `${value}: shift completed, rating is available.`],
    [/^(.+) 現已付款。$/, (_, value) => `${value} is now paid.`],
    [/^(.+)：付款已標示為完成。$/, (_, value) => `${value}: payment has been marked as paid.`],
    [/^(\$[\d,.]+)\/小時$/, (_, value) => `${value}/hr`],
  ];
  for (const [pattern, formatter] of patterns) {
    if (pattern.test(text)) return text.replace(pattern, formatter);
  }
  return null;
};

export const translateDisplayText = (value, language = currentLanguage()) => {
  if (typeof value !== "string" || !value.trim()) return value;
  const leading = value.match(/^\s*/)?.[0] || "";
  const trailing = value.match(/\s*$/)?.[0] || "";
  const text = value.trim();

  let translated;
  if (language === "zh-HK") {
    translated = zhHK[text] || translateDynamicEnglish(text) || text;
  } else {
    translated = reverseZhHK[text] || translateDynamicChinese(text) || text;
  }
  return `${leading}${translated}${trailing}`;
};

export const translateStatus = (value) => {
  if (!value) return value;
  const normalized = String(value).replaceAll("_", " ");
  const source = zhHK[value] ? value : normalized;
  return translateDisplayText(source);
};

export const formatDateTime = (value, options = {}) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const formatOptions = Object.keys(options).length
    ? options
    : { dateStyle: "medium", timeStyle: "short" };
  return new Intl.DateTimeFormat(currentLanguage(), formatOptions).format(date);
};

export const formatDate = (value, options = {}) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(currentLanguage(), { dateStyle: "medium", ...options }).format(date);
};

export const formatRelativeTime = (value) => {
  if (!value) return "";
  const milliseconds = new Date(value).getTime() - Date.now();
  if (Number.isNaN(milliseconds)) return value;
  const absoluteSeconds = Math.abs(milliseconds) / 1000;
  let unit = "second";
  let divisor = 1;
  if (absoluteSeconds >= 86400) {
    unit = "day";
    divisor = 86400;
  } else if (absoluteSeconds >= 3600) {
    unit = "hour";
    divisor = 3600;
  } else if (absoluteSeconds >= 60) {
    unit = "minute";
    divisor = 60;
  }
  const amount = Math.round(milliseconds / 1000 / divisor);
  return new Intl.RelativeTimeFormat(currentLanguage(), { numeric: "auto", style: "narrow" }).format(amount, unit);
};

export const translateApiMessage = (message, fallback = "") =>
  translateDisplayText(message || fallback);
