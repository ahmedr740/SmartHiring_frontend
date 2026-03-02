import axios from "axios";

const getStoredSession = () => JSON.parse(localStorage.getItem("user") || "null");

// We kept the API setup in one small file so every page could share the same base URL and token logic.
const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const user = getStoredSession();
    const isAuthRoute = config.url?.startsWith("/auth/");

    if (user?.token && !isAuthRoute) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
);

export default api;
