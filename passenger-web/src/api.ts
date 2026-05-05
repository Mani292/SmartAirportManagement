import axios from 'axios';

// Get current hostname so it works on any network if accessed via IP
const API_BASE = `http://${window.location.hostname}:8000/api`;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export const reportIncident = (data: any) => api.post("/incidents/", data);
export const trackIncident = (number: string) => api.get(`/incidents/track/${number}`);
export const chatWithPassenger = (message: string, history: any[]) => api.post("/ai/chat", { message, history });
export const submitRating = (sys_id: string, rating: number, comment: string) => api.post(`/incidents/${sys_id}/rate`, { rating, comment });
