import axios from 'axios';

// Get current hostname so it works on any network if accessed via IP
const API_BASE = `http://${window.location.hostname}:8000/api/v1`;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Inject JWT token from localStorage into every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Passenger (no auth) ────────────────────────────────────────────────────────
export const reportIncident = (data: any) =>
  axios.post(`http://${window.location.hostname}:8000/api/v1/incidents/`, data, { timeout: 30000 });
export const trackIncident = (number: string) =>
  axios.get(`http://${window.location.hostname}:8000/api/v1/incidents/track/${number}`, { timeout: 10000 });
export const chatWithPassenger = (message: string, history: any[]) =>
  axios.post(`http://${window.location.hostname}:8000/api/v1/ai/chat`, { message, history }, { timeout: 30000 });
export const submitRating = (sys_id: string, rating: number, comment: string) =>
  axios.post(`http://${window.location.hostname}:8000/api/v1/incidents/${sys_id}/rate`, { rating, comment }, { timeout: 10000 });

// ── Public FIDS ───────────────────────────────────────────────────────────────
export const getFlights = (status = '') =>
  axios.get(`http://${window.location.hostname}:8000/api/v1/fids/flights`, { params: { status }, timeout: 10000 });

// ── Admin Auth ────────────────────────────────────────────────────────────────
export const adminLogin = (username: string, password: string) =>
  axios.post(`http://${window.location.hostname}:8000/api/v1/auth/login`, { username, password });

// ── Admin Incidents ───────────────────────────────────────────────────────────
export const adminGetIncidents = (limit = 100, department = '') =>
  api.get('/incidents/', { params: { limit, department } });
export const adminUpdateIncident = (sys_id: string, data: any) =>
  api.patch(`/incidents/${sys_id}`, data);

// ── Admin Work Orders ─────────────────────────────────────────────────────────
export const adminGetWorkOrders = (status = '', assigned_to = '') =>
  api.get('/workorders/', { params: { status, assigned_to } });
export const adminCreateWorkOrder = (data: any) =>
  api.post('/workorders/', data);
export const adminUpdateWorkOrder = (sys_id: string, data: any) =>
  api.patch(`/workorders/${sys_id}`, data);
export const adminApproveWorkOrder = (sys_id: string, action: string, notes = '') =>
  api.post(`/workorders/${sys_id}/approve`, { action, notes });

// ── Admin Assets ──────────────────────────────────────────────────────────────
export const adminGetAssets = (airport_id = 'SJC-01') =>
  api.get('/assets/', { params: { airport_id } });
export const adminCreateAsset = (data: any) =>
  api.post('/assets/', data);
export const adminUpdateAsset = (sys_id: string, data: any) =>
  api.patch(`/assets/${sys_id}`, data);

// ── Admin Shifts ──────────────────────────────────────────────────────────────
export const adminGetShifts = (shift_date = '') =>
  api.get('/shifts/', { params: { shift_date } });
export const adminGetTodayRoster = () =>
  api.get('/shifts/today');
export const adminCreateShift = (data: any) =>
  api.post('/shifts/', data);
export const adminHandover = (sys_id: string, data: any) =>
  api.post(`/shifts/${sys_id}/handover`, data);

// ── Admin Reports ─────────────────────────────────────────────────────────────
export const adminGetMetrics = () =>
  api.get('/metrics/');
export const adminGetReport = (type: string) =>
  api.get(`/reports/${type}`);
export const adminGetAuditLogs = (actor = '', action = '', limit = 100) =>
  api.get('/reports/audit', { params: { actor, action, limit } });
export const adminExportCsv = (report_type: string) =>
  api.get('/reports/export/csv', { params: { report_type }, responseType: 'blob' });
export const adminExportPdf = (report_type: string) =>
  api.get('/reports/export/pdf', { params: { report_type }, responseType: 'blob' });

// ── Admin FIDS ────────────────────────────────────────────────────────────────
export const adminGetFlights = () =>
  api.get('/fids/flights');
export const adminUpdateFlight = (sys_id: string, data: any) =>
  api.patch(`/fids/flights/${sys_id}`, data);
export const adminCreateDisruption = (data: any) =>
  api.post('/fids/disruption', data);
