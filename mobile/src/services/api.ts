import axios from "axios";
import { Platform } from "react-native";

// ── Types ──────────────────────────────────────────────────────────────────
export interface IncidentData {
    short_description: string;
    location: string;
    area: string;
    department?: string;
    reported_via?: string;
    reporter_phone?: string;
    reporter_email?: string;
}

export interface AssetData {
    name: string;
    asset_type: string;
    location: string;
    area: string;
    status?: string;
}

export interface PreventiveTaskData {
    asset_id: string;
    task_description: string;
    frequency: string;
    next_due?: string;
}

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface QRData {
    terminal: string;
    area: string;
    location_code: string;
}

// ── API Configuration ──────────────────────────────────────────────────────
const getBaseUrl = () => {
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }
    if (Platform.OS === "android") {
        return "http://10.0.2.2:8000/api/v1"; 
    }
    if (Platform.OS === "web") {
        return "http://localhost:8000/api/v1"; 
    }
    return "http://localhost:8000/api/v1";
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
api.interceptors.request.use((config) => {
    try {
        const { store } = require("../store");
        const token: string = store.getState().auth.accessToken;
        if (token) {
            config.headers = config.headers || {};
            config.headers["Authorization"] = `Bearer ${token}`;
        }
    } catch {
        // Store not yet initialized
    }
    return config;
});

// ── Interceptors ───────────────────────────────────────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            console.error(`[API Error] ${error.config?.url} → ${error.response.status}:`, error.response.data);
        } else if (error.request) {
            console.error("[API Error] No response received.", error.message);
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

export const createIncident = (data: IncidentData) =>
    api.post("/incidents/", data);

export const updateIncident = (sysId: string, data: Partial<IncidentData> & { state?: string; work_notes?: string; close_notes?: string }) =>
    api.patch(`/incidents/${sysId}`, data);

export const rateIncident = (sysId: string, rating: number, comment = "") =>
    api.post(`/incidents/${sysId}/rate`, { rating, comment });

// ── ASSETS ──
export const getAssets = () =>
    api.get("/assets/");

export const createAsset = (data: AssetData) =>
    api.post("/assets/", data);

export const updateAsset = (sysId: string, data: Partial<AssetData>) =>
    api.patch(`/assets/${sysId}`, data);

// ── PREVENTIVE ──
export const getPreventiveTasks = () =>
    api.get("/preventive/");

export const createPreventiveTask = (data: PreventiveTaskData) =>
    api.post("/preventive/", data);

export const updatePreventiveTask = (sysId: string, data: Partial<PreventiveTaskData>) =>
    api.patch(`/preventive/${sysId}`, data);

// ── TECHNICIAN ──
export const getMyTasks = (assignedTo: string) =>
    api.get(`/technician/tasks/${assignedTo}`);

export const getMyStats = (assignedTo: string) =>
    api.get(`/technician/stats/${assignedTo}`);

// ── AI ──
export const chatWithPassenger = (message: string, history: ChatMessage[]) =>
    api.post("/ai/chat", { message, history });

export const askKB = (question: string, asset: string, issue: string) =>
    api.post("/ai/kb", { question, asset, issue });

export const summarizeResolution = (description: string, notes: string) =>
    api.post("/ai/summarize", { description, notes });

// ── QR ──
export const generateQR = (data: QRData) =>
    api.post("/qr/generate", data);

export const getQRLocations = () =>
    api.get("/qr/locations");