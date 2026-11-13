import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import * as api from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const DataContext = createContext(null);

const EMPTY = { projects: [], users: [], reviews: [], history: [], signals: [], notifications: [], settings: null };

/** Insert or replace by id — keeps updates idempotent (own actions + socket echoes). */
const upsert = (list, item, { prepend = false } = {}) => {
  const exists = list.some((x) => x.id === item.id);
  if (exists) return list.map((x) => (x.id === item.id ? { ...x, ...item } : x));
  return prepend ? [item, ...list] : [...list, item];
};

export function DataProvider({ children }) {
  const { user, logout } = useAuth();
  const [data, setData] = useState(EMPTY);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [live, setLive] = useState(api.isDemoMode ? 'demo' : 'connecting'); // demo | connecting | live | offline

  /* ----------------------------- Initial load ----------------------------- */
  useEffect(() => {
    if (!user) {
      setData(EMPTY);
      setStatus('idle');
      return undefined;
    }
    const controller = new AbortController();
    setStatus('loading');
    setError('');
    api.fetchWorkspace(user, { signal: controller.signal })
      .then((workspace) => {
        setData({ ...EMPTY, ...workspace });
        setStatus('ready');
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (err.status === 401) { logout(); return; }
        setError(err.message || 'Could not load workspace data.');
        setStatus('error');
      });
    return () => controller.abort();
  }, [user, reloadKey, logout]);

  /* ------------------------- Real-time (backend) -------------------------- */
  useEffect(() => {
    if (!user || api.isDemoMode) return undefined;
    const socket = io(api.SOCKET_URL, { path: '/socket.io', withCredentials: true, transports: ['websocket', 'polling'] });
    let wasDisconnected = false;

    socket.on('connect', () => {
      setLive('live');
      // After a reconnect, quietly resync anything missed while offline.
      if (wasDisconnected) {
        api.fetchWorkspace(user).then((workspace) => setData((cur) => ({ ...cur, ...workspace }))).catch(() => null);
      }
    });
    socket.on('disconnect', () => { wasDisconnected = true; setLive('offline'); });
    socket.on('connect_error', (err) => {
      setLive('offline');
      if (err?.message === 'unauthorized') logout();
    });

    socket.on('review:created', ({ review, historyItem }) => setData((cur) => ({
      ...cur,
      reviews: upsert(cur.reviews, review),
      history: historyItem ? upsert(cur.history, historyItem, { prepend: true }) : cur.history,
    })));
    socket.on('project:created', (project) => setData((cur) => ({ ...cur, projects: upsert(cur.projects, project) })));
    socket.on('signal:updated', (signal) => setData((cur) => ({ ...cur, signals: upsert(cur.signals, signal) })));
    socket.on('notification:new', (n) => setData((cur) => ({ ...cur, notifications: upsert(cur.notifications, n, { prepend: true }) })));
    socket.on('notifications:read', ({ ids }) => setData((cur) => ({
      ...cur, notifications: cur.notifications.map((n) => (ids.includes(n.id) ? { ...n, unread: false } : n)),
    })));
    socket.on('settings:updated', (settings) => setData((cur) => ({ ...cur, settings })));

    return () => { socket.disconnect(); setLive('connecting'); };
  }, [user, logout]);

  /* -------------------------------- Actions ------------------------------- */
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const addReview = useCallback(async (payload) => {
    const { review, historyItem } = await api.createReview(payload);
    setData((cur) => ({
      ...cur,
      reviews: upsert(cur.reviews, review),
      history: historyItem ? upsert(cur.history, historyItem, { prepend: true }) : cur.history,
    }));
    return review;
  }, []);

  const addQuickReview = useCallback(async (input) => {
    const { review, historyItem } = await api.createQuickReview(input);
    setData((cur) => ({
      ...cur,
      reviews: upsert(cur.reviews, review),
      history: historyItem ? upsert(cur.history, historyItem, { prepend: true }) : cur.history,
    }));
    return review;
  }, []);

  const addProject = useCallback(async (input) => {
    const project = await api.createProject(input);
    setData((cur) => ({ ...cur, projects: upsert(cur.projects, project) }));
    return project;
  }, []);

  const updateSignal = useCallback(async (id, changes) => {
    setData((cur) => ({ ...cur, signals: cur.signals.map((s) => (s.id === id ? { ...s, ...changes } : s)) }));
    await api.updateSignal(id, changes);
  }, []);

  const markNotificationsRead = useCallback(async (ids) => {
    setData((cur) => ({ ...cur, notifications: cur.notifications.map((n) => (ids.includes(n.id) ? { ...n, unread: false } : n)) }));
    await api.markNotificationsRead(ids).catch(() => null);
  }, []);

  const saveSettings = useCallback(async (settings) => {
    const saved = await api.saveReviewSettings(settings);
    setData((cur) => ({ ...cur, settings: saved }));
    return saved;
  }, []);

  const resetDemo = useCallback(() => {
    api.resetDemoData();
    reload();
  }, [reload]);

  const value = useMemo(() => ({
    ...data, status, error, live, reload, addReview, addQuickReview, addProject, updateSignal, markNotificationsRead, saveSettings, resetDemo,
  }), [data, status, error, live, reload, addReview, addQuickReview, addProject, updateSignal, markNotificationsRead, saveSettings, resetDemo]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used inside DataProvider');
  return context;
}
