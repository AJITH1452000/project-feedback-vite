/**
 * API client — every call is a real HTTP request to the ProFeed API server (server/index.js).
 * Sessions use an HttpOnly cookie; mutating requests carry X-Requested-With for the CSRF guard.
 * In development Vite proxies /api and /socket.io to the API server (see vite.config.js).
 */
import { DEFAULT_REVIEW_SETTINGS } from '../data/constants.js';

export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
/** Socket.IO server origin: same origin when the API is a relative path (e.g. "/api" behind the Vite proxy). */
export const SOCKET_URL = /^https?:\/\//.test(API_URL) ? new URL(API_URL).origin : undefined;

export const ENDPOINTS = {
  setup: '/auth/setup',
  login: '/auth/login',
  logout: '/auth/logout',
  session: '/auth/me',
  password: '/auth/password',
  projects: '/projects',
  users: '/users',
  directory: '/users/directory',
  reviews: '/reviews',
  history: '/reviews/history',
  signals: '/insights/signals',
  notifications: '/notifications',
  settings: '/settings/review',
  goals: '/goals',
  goalPlans: '/goal-plans',
  ai: '/ai/analyze',
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
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Cannot reach the server. Is the API running? (npm run dev)', 0);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!response.ok) {
    const fallback = response.status === 401 ? 'Your session has expired. Please sign in again.'
      : response.status >= 502 ? 'The API server is not responding. Start it with npm run dev.'
        : `Request failed (${response.status}).`;
    throw new ApiError(data?.message || data?.error || fallback, response.status);
  }
  return data && typeof data === 'object' && !Array.isArray(data) && 'data' in data ? data.data : data;
}

/* ------------------------------- Auth API ------------------------------ */

/** { needsSetup } — true until the first account exists. */
export const getSetupStatus = () => http(ENDPOINTS.setup);
/** First run: create the first manager / HR account (signs in). */
export const setupWorkspace = (input) => http(ENDPOINTS.setup, { method: 'POST', body: input });
export const login = ({ email, password }) => http(ENDPOINTS.login, { method: 'POST', body: { email, password } });
export const logout = () => http(ENDPOINTS.logout, { method: 'POST' }).catch(() => null);
/** Current session or null (401 = signed out). Other failures propagate so the UI can show "server unavailable". */
export async function restoreSession() {
  try {
    return await http(ENDPOINTS.session);
  } catch (err) {
    if (err.status === 401) return null;
    throw err;
  }
}
export const changePassword = (current, next) => http(ENDPOINTS.password, { method: 'POST', body: { current, next } });

/* ---------------------------- Workspace API ---------------------------- */

/** Everything the signed-in user may see. The server filters by role. */
export async function fetchWorkspace(user, { signal } = {}) {
  const staff = user.role === 'manager' || user.role === 'hr';
  const [projects, users, reviews, history, signals, notifications, settings, goals, goalPlans, people] = await Promise.all([
    http(ENDPOINTS.projects, { signal }),
    http(ENDPOINTS.users, { signal }),
    http(ENDPOINTS.reviews, { signal }),
    staff ? http(ENDPOINTS.history, { signal }) : [],
    user.role === 'manager' ? http(ENDPOINTS.signals, { signal }).catch(() => []) : [],
    http(ENDPOINTS.notifications, { signal }).catch(() => []),
    http(ENDPOINTS.settings, { signal }).catch(() => DEFAULT_REVIEW_SETTINGS),
    http(ENDPOINTS.goals, { signal }),
    http(ENDPOINTS.goalPlans, { signal }),
    staff ? http(ENDPOINTS.directory, { signal }) : [],
  ]);
  return { projects, users, reviews, history, signals, notifications, settings, goals, goalPlans, people };
}

/* ------------------------------- People -------------------------------- */
export const createUser = (input) => http(ENDPOINTS.users, { method: 'POST', body: input });
export const updateUser = (id, changes) => http(`${ENDPOINTS.users}/${encodeURIComponent(id)}`, { method: 'PATCH', body: changes });

/* ---------------------------- Projects/reviews ------------------------- */
/** Payload: { review, meta } → { review, historyItem } */
export const createReview = (payload) => http(ENDPOINTS.reviews, { method: 'POST', body: payload });
/** "Submit project feedback" form → { review, historyItem } */
export const createQuickReview = (input) => http(ENDPOINTS.reviews, { method: 'POST', body: { quick: input } });
/** { n, c, pr, s, e, t: [userIds] } → saved project */
export const createProject = (input) => http(ENDPOINTS.projects, { method: 'POST', body: input });
export const updateSignal = (id, changes) => http(`${ENDPOINTS.signals}/${encodeURIComponent(id)}`, { method: 'PATCH', body: changes });
export const markNotificationsRead = (ids) => http(`${ENDPOINTS.notifications}/read`, { method: 'POST', body: { ids } });
export const saveReviewSettings = (settings) => http(ENDPOINTS.settings, { method: 'PUT', body: settings });

/* ------------------------------ Goals API ------------------------------ */
/* The `user` argument is kept for call-site compatibility; the server uses the session. */
export const createGoal = (input) => http(ENDPOINTS.goals, { method: 'POST', body: input });
export const updateGoal = (id, changes) => http(`${ENDPOINTS.goals}/${encodeURIComponent(id)}`, { method: 'PATCH', body: changes });
export const deleteGoal = (id) => http(`${ENDPOINTS.goals}/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const goalAction = (id, action, payload) => http(`${ENDPOINTS.goals}/${encodeURIComponent(id)}/${action}`, { method: 'POST', body: payload || {} });
export const goalPlanAction = (u, period, action, payload) => http(
  `${ENDPOINTS.goalPlans}/${encodeURIComponent(u)}/${encodeURIComponent(period)}/${action}`, { method: 'POST', body: payload || {} },
);

/* ------------------------------- AI API -------------------------------- */
/**
 * AI rating suggestion for feedback text (OpenAI on the server when configured, otherwise its built-in analyser).
 * Result: { overallRating, delivery, collaboration: { score, confidence, rationale }, summary, source }
 */
export const analyzeFeedback = ({ strengths, developmentAreas }, { signal } = {}) => http(ENDPOINTS.ai, { method: 'POST', body: { strengths, developmentAreas }, signal });
