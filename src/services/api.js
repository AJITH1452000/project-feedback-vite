/**
 * Single data-access layer for the whole app.
 *
 * - VITE_API_URL empty  → demo mode: in-memory data (same shape as the backend),
 *                         persisted to sessionStorage for the current tab only.
 * - VITE_API_URL set    → every call goes to the backend with cookie credentials.
 *                         The backend MUST enforce auth, roles and validation.
 *
 * Change endpoint paths in ENDPOINTS to match your backend routes.
 */
import {
  DEFAULT_REVIEW_SETTINGS, INITIAL_AI_SIGNALS, INITIAL_NOTIFICATIONS, INITIAL_REVIEW_HISTORY,
  MANAGER, PROJECTS, SEED_REVIEWS, USERS,
} from '../data/seed.js';
import { heuristicAnalysis } from './ratingHeuristic.js';

export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
export const isDemoMode = !API_URL;
/** Socket.IO server origin: same origin when the API is a relative path (e.g. "/api" behind the Vite proxy). */
export const SOCKET_URL = /^https?:\/\//.test(API_URL) ? new URL(API_URL).origin : undefined;

export const ENDPOINTS = {
  login: '/auth/login',
  logout: '/auth/logout',
  session: '/auth/me',
  projects: '/projects',
  users: '/users',
  reviews: '/reviews',
  history: '/reviews/history',
  signals: '/insights/signals',
  notifications: '/notifications',
  settings: '/settings/review',
};

/* ----------------------------- HTTP client ----------------------------- */

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function http(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      // X-Requested-With is required by the backend's CSRF guard on POST/PUT/PATCH/DELETE.
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!response.ok) {
    const message = data?.message || data?.error || (response.status === 401 ? 'Your session has expired. Please sign in again.' : `Request failed (${response.status}).`);
    throw new ApiError(message, response.status);
  }
  // Accept either raw payloads or { data: ... } envelopes.
  return data && typeof data === 'object' && 'data' in data ? data.data : data;
}

/* ------------------------------ Demo store ----------------------------- */

const DEMO_KEY = 'profeed-demo-db-v2';
const SESSION_KEY = 'profeed-demo-session';
const latency = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = (value) => JSON.parse(JSON.stringify(value));

function loadDemoDb() {
  try {
    const saved = sessionStorage.getItem(DEMO_KEY);
    if (saved) return { projects: clone(PROJECTS), ...JSON.parse(saved) };
  } catch { /* storage unavailable */ }
  return {
    projects: clone(PROJECTS),
    reviews: clone(SEED_REVIEWS),
    history: clone(INITIAL_REVIEW_HISTORY),
    signals: clone(INITIAL_AI_SIGNALS),
    notifications: clone(INITIAL_NOTIFICATIONS),
    settings: clone(DEFAULT_REVIEW_SETTINGS),
  };
}

let demoDb = loadDemoDb();
function persistDemo() {
  try { sessionStorage.setItem(DEMO_KEY, JSON.stringify(demoDb)); } catch { /* ignore */ }
}

function demoUserFor({ role, userId }) {
  if (role === 'manager') return { role: 'manager', userId: null, name: MANAGER.n, title: MANAGER.t };
  const member = USERS.find((u) => u.id === Number(userId));
  if (!member) throw new ApiError('Select a valid employee profile.', 400);
  return { role: 'employee', userId: member.id, name: member.n, title: member.t, track: member.r };
}

/* ------------------------------- Auth API ------------------------------ */

export async function login(credentials) {
  if (!isDemoMode) return http(ENDPOINTS.login, { method: 'POST', body: credentials });
  await latency(550);
  const user = demoUserFor(credentials);
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch { /* ignore */ }
  return user;
}

export async function logout() {
  if (!isDemoMode) {
    await http(ENDPOINTS.logout, { method: 'POST' }).catch(() => null);
    return;
  }
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}

export async function restoreSession() {
  if (!isDemoMode) return http(ENDPOINTS.session).catch(() => null);
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

/* ---------------------------- Workspace API ---------------------------- */

/**
 * Loads everything the signed-in user may see.
 * Employees receive only their own reviews (the backend must enforce this too).
 */
export async function fetchWorkspace(user, { signal } = {}) {
  if (!isDemoMode) {
    const [projects, users, reviews, history, signals, notifications, settings] = await Promise.all([
      http(ENDPOINTS.projects, { signal }),
      http(ENDPOINTS.users, { signal }),
      http(ENDPOINTS.reviews, { signal }),
      user.role === 'manager' ? http(ENDPOINTS.history, { signal }) : [],
      user.role === 'manager' ? http(ENDPOINTS.signals, { signal }).catch(() => []) : [],
      http(ENDPOINTS.notifications, { signal }).catch(() => []),
      http(ENDPOINTS.settings, { signal }).catch(() => DEFAULT_REVIEW_SETTINGS),
    ]);
    return { projects, users, reviews, history, signals, notifications, settings };
  }
  await latency(650);
  const isManager = user.role === 'manager';
  const myReviews = demoDb.reviews.filter((r) => r.u === user.userId);
  // Employees only get notifications about their own reviews.
  const employeeNotifications = [...myReviews].sort((a, b) => b.d.localeCompare(a.d)).map((r) => ({
    id: `review-${r.id}`,
    title: 'New feedback shared with you',
    detail: `${demoDb.projects.find((p) => p.id === r.p)?.n || 'Project'} · from ${r.by}`,
    time: r.d,
    unread: false,
    tone: r.f.length ? 'warning' : 'success',
  }));
  return clone({
    projects: demoDb.projects,
    users: USERS,
    reviews: isManager ? demoDb.reviews : myReviews,
    history: isManager ? demoDb.history : [],
    signals: isManager ? demoDb.signals : [],
    notifications: isManager ? demoDb.notifications : employeeNotifications,
    settings: demoDb.settings,
  });
}

/** Creates a review. Payload uses the backend Review shape plus history metadata. */
export async function createReview(payload) {
  if (!isDemoMode) return http(ENDPOINTS.reviews, { method: 'POST', body: payload });
  await latency(500);
  const { review, meta } = payload;
  if (!review?.u || !review?.p) throw new ApiError('Choose an employee and a project.', 400);
  if (!Array.isArray(review.s) || review.s.length !== 4 || review.s.some((v) => !(v >= 1 && v <= 5))) {
    throw new ApiError('Rate all four dimensions from 1 to 5.', 400);
  }
  const project = demoDb.projects.find((p) => p.id === review.p);
  if (!project?.t.includes(review.u)) throw new ApiError('This person is not assigned to the selected project.', 400);
  const note = String(review.note || '').trim().slice(0, 1000);
  const id = Date.now();
  const now = new Date();
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const saved = { ...review, id, note, f: review.f || [], d: localDate };
  const member = USERS.find((u) => u.id === review.u);
  const historyItem = {
    id,
    employee: member?.n || 'Employee',
    project: project.n,
    period: meta?.period || 'Q4 2026',
    rating: Number((saved.s.reduce((a, b) => a + b, 0) / 4).toFixed(1)),
    status: 'Employee response pending',
    role: meta?.role || member?.t || '',
    date: saved.d,
  };
  demoDb = { ...demoDb, reviews: [...demoDb.reviews, saved], history: [historyItem, ...demoDb.history] };
  persistDemo();
  return { review: saved, historyItem };
}

/**
 * "Submit project feedback" form.
 * input: { p, u, type, period, overall, delivery, collaboration, strengths, development, comment, nextDate, visibility }
 */
export async function createQuickReview(input) {
  if (!isDemoMode) return http(ENDPOINTS.reviews, { method: 'POST', body: { quick: input } });
  await latency(500);
  if (!(input.overall >= 1 && input.overall <= 5)) throw new ApiError('Select an overall rating from 1 to 5.', 400);
  if (String(input.strengths || '').trim().length < 12) throw new ApiError('Add at least 12 characters of strengths / evidence.', 400);
  const project = demoDb.projects.find((p) => p.id === input.p);
  if (!project?.t.includes(input.u)) throw new ApiError('This person is not assigned to the selected project.', 400);
  const now = new Date();
  const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isDraft = input.visibility === 'Private draft (manager only)';
  const id = Date.now();
  const review = {
    id, p: input.p, u: input.u, by: 'Project manager', kind: 'quick', s: null, o: input.overall, f: [],
    note: input.strengths.trim(), d, status: isDraft ? 'Manager draft' : 'Employee response pending',
    q: {
      type: input.type, period: input.period, delivery: input.delivery, collaboration: input.collaboration,
      development: input.development || '', comment: input.comment || '',
      nextDate: input.type === 'Quarterly review' ? input.nextDate || null : null, visibility: input.visibility,
      ai: input.ai || null,
    },
  };
  const member = USERS.find((u) => u.id === input.u);
  const historyItem = {
    id, employee: member?.n || 'Employee', project: project.n, period: `${input.type} · ${input.period}`,
    rating: input.overall, status: review.status, role: member?.t || '', date: d,
  };
  demoDb = { ...demoDb, reviews: [...demoDb.reviews, review], history: [historyItem, ...demoDb.history] };
  persistDemo();
  return { review, historyItem };
}

/** Creates a project. Shape: { n, c, pr, s, e, t: [userIds] } → saved project with id. */
export async function createProject(input) {
  if (!isDemoMode) return http(ENDPOINTS.projects, { method: 'POST', body: input });
  await latency(450);
  const n = String(input?.n || '').trim().slice(0, 80);
  const c = String(input?.c || '').trim().slice(0, 80);
  if (n.length < 3) throw new ApiError('Project name must be at least 3 characters.', 400);
  if (!c) throw new ApiError('Enter the client name.', 400);
  if (!['High', 'Medium', 'Low'].includes(input.pr)) throw new ApiError('Choose a valid priority.', 400);
  if (!input.s || !input.e || input.e < input.s) throw new ApiError('End date must be on or after the start date.', 400);
  if (demoDb.projects.some((p) => p.n.toLowerCase() === n.toLowerCase())) throw new ApiError('A project with this name already exists.', 409);
  const team = [...new Set((input.t || []).map(Number))].filter((id) => USERS.some((u) => u.id === id));
  if (!team.length) throw new ApiError('Assign at least one team member.', 400);
  const project = { id: Math.max(0, ...demoDb.projects.map((p) => p.id)) + 1, n, c, pr: input.pr, s: input.s, e: input.e, t: team };
  demoDb = { ...demoDb, projects: [...demoDb.projects, project] };
  persistDemo();
  return project;
}

export async function updateSignal(id, changes) {
  if (!isDemoMode) return http(`${ENDPOINTS.signals}/${encodeURIComponent(id)}`, { method: 'PATCH', body: changes });
  await latency(150);
  demoDb = { ...demoDb, signals: demoDb.signals.map((s) => (s.id === id ? { ...s, ...changes } : s)) };
  persistDemo();
  return demoDb.signals.find((s) => s.id === id);
}

export async function markNotificationsRead(ids) {
  if (!isDemoMode) return http(`${ENDPOINTS.notifications}/read`, { method: 'POST', body: { ids } });
  if (ids.every((id) => typeof id === 'string')) return demoDb.notifications; // derived employee notifications
  demoDb = { ...demoDb, notifications: demoDb.notifications.map((n) => (ids.includes(n.id) ? { ...n, unread: false } : n)) };
  persistDemo();
  return demoDb.notifications;
}

export async function saveReviewSettings(settings) {
  if (!isDemoMode) return http(ENDPOINTS.settings, { method: 'PUT', body: settings });
  await latency(400);
  demoDb = { ...demoDb, settings: { ...settings } };
  persistDemo();
  return demoDb.settings;
}

export function resetDemoData() {
  demoDb = {
    projects: clone(PROJECTS), reviews: clone(SEED_REVIEWS), history: clone(INITIAL_REVIEW_HISTORY), signals: clone(INITIAL_AI_SIGNALS),
    notifications: clone(INITIAL_NOTIFICATIONS), settings: clone(DEFAULT_REVIEW_SETTINGS),
  };
  persistDemo();
}

/* ------------------------------- AI API -------------------------------- */

/** Server-side AI rating suggestion (served by Vite middleware / server.js). */
/**
 * AI rating suggestion for feedback text.
 * Backend mode → POST /ai/analyze (OpenAI if configured on the server, otherwise the built-in analyser).
 * Demo mode    → local Vite AI endpoint, falling back to the built-in analyser in the browser.
 * Result: { overallRating, delivery, collaboration: { score, confidence, rationale }, summary, source }
 */
export async function analyzeFeedback({ strengths, developmentAreas }, { signal } = {}) {
  if (!isDemoMode) return http('/ai/analyze', { method: 'POST', body: { strengths, developmentAreas }, signal });
  try {
    const response = await fetch('/api/analyze-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strengths, developmentAreas }),
      signal,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result?.error || 'AI unavailable');
    return { ...result, source: 'openai' };
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    return heuristicAnalysis({ strengths, developmentAreas });
  }
}
