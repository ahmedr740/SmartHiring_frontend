const LAST_SEEN_KEY = "smartHiringLastSeenNotificationAt";
const NOTIFICATION_ENABLED_PREFIX = "smartHiringNotificationsEnabled:";

export const canUseBrowserNotifications = () => "Notification" in window;

export const getNotificationPermission = () =>
    canUseBrowserNotifications() ? window.Notification.permission : "unsupported";

export const requestNotificationPermission = async () => {
    if (!canUseBrowserNotifications()) {
        return "unsupported";
    }

    return window.Notification.requestPermission();
};

export const getNotificationPreference = (userId) => {
    if (!userId) {
        return false;
    }

    return localStorage.getItem(`${NOTIFICATION_ENABLED_PREFIX}${userId}`) === "true";
};

export const setNotificationPreference = (userId, enabled) => {
    if (!userId) {
        return false;
    }

    localStorage.setItem(`${NOTIFICATION_ENABLED_PREFIX}${userId}`, enabled ? "true" : "false");
    return enabled;
};

export const toggleNotificationPreference = async (userId) => {
    const currentPreference = getNotificationPreference(userId);

    if (currentPreference) {
        return {
            enabled: setNotificationPreference(userId, false),
            permission: getNotificationPermission(),
        };
    }

    const permission = getNotificationPermission() === "granted"
        ? "granted"
        : await requestNotificationPermission();

    return {
        enabled: permission === "granted" ? setNotificationPreference(userId, true) : false,
        permission,
    };
};

export const getNotificationButtonLabel = (permission, enabled) => {
    if (permission === "unsupported") {
        return "Notifications Unsupported";
    }

    if (permission === "denied") {
        return "Notifications Blocked";
    }

    return enabled ? "Notifications On" : "Notifications Off";
};

export const notifyOnce = (id, title, body, enabled = true) => {
    if (!enabled || !canUseBrowserNotifications() || window.Notification.permission !== "granted") {
        return;
    }

    const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
    if (lastSeen === id) {
        return;
    }

    localStorage.setItem(LAST_SEEN_KEY, id);
    new window.Notification(title, { body });
};
