import axios from "axios";
import { Platform } from "react-native";

// ── API Configuration ──────────────────────────────────────────────────────
// For local development on a physical device, set your machine's local IP.
// For production, point this to your deployed backend URL.
// Android emulator must use 10.0.2.2 instead of 127.0.0.1/localhost.
const getBaseUrl = () => {
    // Production URL (set this to your deployed backend)
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }

    // Local development fallback
    if (Platform.OS === "android") {
        return "http://10.0.2.2:8000/api"; // Android emulator
    }
    if (Platform.OS === "web") {
        return "http://localhost:8000/api"; // Browser web build
    }
    return "http://192.168.31.230:8000/api"; // Local WiFi IP — change to your machine's IP
};

const BASE_URL = getBaseUrl();

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

// ── JWT Token Injection ────────────────────────────────────────────────────
// The store is imported lazily to avoid circular dependency issues.
// Every outgoing request automatically receives the current access token.
api.interceptors.request.use((config) => {
    try {
        // Lazy import to avoid circular deps with store
        const { store } = require("../store");
        const token: string = store.getState().auth.accessToken;
        if (token) {
            config.headers = config.headers || {};
            config.headers["Authorization"] = `Bearer ${token}`;
        }
    } catch {
        // Store not yet initialized — skip token injection
    }
    return config;
});

// ── Global response interceptor for error logging ──────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            console.error(`[API Error] ${error.config?.url} → ${error.response.status}:`, error.response.data);
        } else if (error.request) {
            console.error("[API Error] No response received. Is the backend running?", error.message);
        }
        return Promise.reject(error);
    }
);

// ── AUTH ──
export const loginApi = (data: { username: string; password: string }) =>
    api.post("/auth/login", data);

export const requestAccessApi = (data: { role: string; email?: string; phone?: string }) =>
    api.post("/auth/request-access", data);

export const getMeApi = () =>
    api.get("/auth/me");

export const refreshTokenApi = (refreshToken: string) =>
    api.post("/auth/refresh", { refresh_token: refreshToken });

// ── INCIDENTS ──
export const getIncidents = (limit = 50, department = "") =>
    api.get(`/incidents/?limit=${limit}&department=${department}`);

export const getIncident = (sysId: string) =>
    api.get(`/incidents/${sysId}`);

export const trackIncident = (number: string) =>
    api.get(`/incidents/track/${number}`);

export const createIncident = (data: any) =>
    api.post("/incidents/", data);

export const updateIncident = (sysId: string, data: any) =>
    api.patch(`/incidents/${sysId}`, data);

export const rateIncident = (sysId: string, rating: number, comment = "") =>
    api.post(`/incidents/${sysId}/rate`, { rating, comment });

// ── ASSETS ──
export const getAssets = () =>
    api.get("/assets/");

export const createAsset = (data: any) =>
    api.post("/assets/", data);

export const updateAsset = (sysId: string, data: any) =>
    api.patch(`/assets/${sysId}`, data);

// ── PREVENTIVE ──
export const getPreventiveTasks = () =>
    api.get("/preventive/");

export const createPreventiveTask = (data: any) =>
    api.post("/preventive/", data);

export const updatePreventiveTask = (sysId: string, data: any) =>
    api.patch(`/preventive/${sysId}`, data);

// ── TECHNICIAN ──
export const getMyTasks = (assignedTo: string) =>
    api.get(`/technician/tasks/${assignedTo}`);

export const getMyStats = (assignedTo: string) =>
    api.get(`/technician/stats/${assignedTo}`);

// ── AI ──
export const chatWithPassenger = (message: string, history: any[]) =>
    api.post("/ai/chat", { message, history });

export const askKB = (question: string, asset: string, issue: string) =>
    api.post("/ai/kb", { question, asset, issue });

export const summarizeResolution = (description: string, notes: string) =>
    api.post("/ai/summarize", { description, notes });

// ── QR ──
export const generateQR = (data: any) =>
    api.post("/qr/generate", data);

export const getQRLocations = () =>
    api.get("/qr/locations");export default api;
