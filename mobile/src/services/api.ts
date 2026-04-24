import axios from "axios";

const BASE_URL = "http://192.168.31.230:8000/api";
// 192.168.31.230 = local WiFi IP for physical device testing

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

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
    api.get("/qr/locations");