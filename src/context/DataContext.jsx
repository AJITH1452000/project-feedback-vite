/**
 * Workspace data, backed by React Query (see hooks/queries).
 *
 * `useData()` keeps its original shape so every page works unchanged, but the data now lives in
 * the React Query cache: loading/error/refetch come from the query, actions write their saved
 * results into the cache, and socket events patch the same cache.
 * New code can use the query hooks directly (useWorkspaceQuery, useGoalData, hooks/queries/goals.js).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import * as api from '../services/api.js';
import { EMPTY_WORKSPACE, queryKeys, upsert, useUpdateWorkspace, useWorkspaceQuery } from '../hooks/queries/workspace.js';
import { useAuth } from './AuthContext.jsx';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const update = useUpdateWorkspace();
  const query = useWorkspaceQuery();
  const [live, setLive] = useState('connecting'); // connecting | live | offline

  // Signed out → drop every cached workspace so the next user never sees stale data.
  useEffect(() => {
    if (!user) queryClient.removeQueries({ queryKey: queryKeys.all });
  }, [user, queryClient]);

  // Expired session → sign out.
  useEffect(() => {
    if (query.error?.status === 401) logout();
  }, [query.error, logout]);

  const status = !user ? 'idle' : query.isPending ? 'loading' : query.isError ? 'error' : 'ready';
  const error = query.isError ? query.error?.message || 'Could not load workspace data.' : '';

  /* ------------------------- Real-time (backend) -------------------------- */
  useEffect(() => {
    if (!user) return undefined;
    const socket = io(api.SOCKET_URL, { path: '/socket.io', withCredentials: true, transports: ['websocket', 'polling'] });
    let wasDisconnected = false;

    socket.on('connect', () => {
      setLive('live');
      // After a reconnect, quietly resync anything missed while offline.
      if (wasDisconnected) queryClient.invalidateQueries({ queryKey: queryKeys.workspace(user) });
    });
    socket.on('disconnect', () => { wasDisconnected = true; setLive('offline'); });
    socket.on('connect_error', (err) => {
      setLive('offline');
      if (err?.message === 'unauthorized') logout();
    });

    socket.on('review:created', ({ review, historyItem }) => update((ws) => ({
      ...ws,
      reviews: upsert(ws.reviews, review),
      history: historyItem ? upsert(ws.history, historyItem, { prepend: true }) : ws.history,
    })));
    socket.on('project:created', (project) => update((ws) => ({ ...ws, projects: upsert(ws.projects, project) })));
    socket.on('signal:updated', (signal) => update((ws) => ({ ...ws, signals: upsert(ws.signals, signal) })));
    socket.on('notification:new', (n) => update((ws) => ({ ...ws, notifications: upsert(ws.notifications, n, { prepend: true }) })));
    socket.on('notifications:read', ({ ids }) => update((ws) => ({
      ...ws, notifications: ws.notifications.map((n) => (ids.includes(n.id) ? { ...n, unread: false } : n)),
    })));
    socket.on('settings:updated', (settings) => update((ws) => ({ ...ws, settings })));
    socket.on('goal:updated', (goal) => update((ws) => ({ ...ws, goals: upsert(ws.goals, goal) })));
    socket.on('goal:deleted', ({ id }) => update((ws) => ({ ...ws, goals: ws.goals.filter((g) => g.id !== id) })));
    socket.on('goalPlan:updated', (plan) => update((ws) => ({ ...ws, goalPlans: upsert(ws.goalPlans, plan) })));
    // A person was added, edited or deactivated: refresh the directory and the active-employee list.
    socket.on('user:updated', (person) => update((ws) => ({
      ...ws,
      people: ws.people?.length || user.role !== 'employee' ? upsert(ws.people || [], person) : ws.people,
      users: person.role === 'employee' && person.active ? upsert(ws.users, person) : ws.users.filter((u) => u.id !== person.id),
    })));

    return () => { socket.disconnect(); setLive('connecting'); };
  }, [user, logout, queryClient, update]);

  /* -------------------------------- Actions ------------------------------- */
  const { refetch } = query;
  const reload = useCallback(() => { refetch(); }, [refetch]);

  const addReview = useCallback(async (payload) => {
    const { review, historyItem } = await api.createReview(payload);
    update((ws) => ({
      ...ws,
      reviews: upsert(ws.reviews, review),
      history: historyItem ? upsert(ws.history, historyItem, { prepend: true }) : ws.history,
    }));
    return review;
  }, [update]);

  const addQuickReview = useCallback(async (input) => {
    const { review, historyItem } = await api.createQuickReview(input);
    update((ws) => ({
      ...ws,
      reviews: upsert(ws.reviews, review),
      history: historyItem ? upsert(ws.history, historyItem, { prepend: true }) : ws.history,
    }));
    return review;
  }, [update]);

  const addProject = useCallback(async (input) => {
    const project = await api.createProject(input);
    update((ws) => ({ ...ws, projects: upsert(ws.projects, project) }));
    return project;
  }, [update]);

  /** Optimistic: applied immediately, rolled back if the server rejects it. */
  const updateSignal = useCallback(async (id, changes) => {
    let previous;
    update((ws) => {
      previous = ws.signals.find((s) => s.id === id);
      return { ...ws, signals: ws.signals.map((s) => (s.id === id ? { ...s, ...changes } : s)) };
    });
    try {
      await api.updateSignal(id, changes);
    } catch (err) {
      if (previous) update((ws) => ({ ...ws, signals: upsert(ws.signals, previous) }));
      throw err;
    }
  }, [update]);

  const markNotificationsRead = useCallback(async (ids) => {
    update((ws) => ({ ...ws, notifications: ws.notifications.map((n) => (ids.includes(n.id) ? { ...n, unread: false } : n)) }));
    await api.markNotificationsRead(ids).catch(() => null);
  }, [update]);

  const saveSettings = useCallback(async (settings) => {
    const saved = await api.saveReviewSettings(settings);
    update((ws) => ({ ...ws, settings: saved }));
    return saved;
  }, [update]);


  const data = query.data || EMPTY_WORKSPACE;
  const value = useMemo(() => ({
    ...data, status, error, live, isFetching: query.isFetching, reload,
    addReview, addQuickReview, addProject, updateSignal, markNotificationsRead, saveSettings,
  }), [data, status, error, live, query.isFetching, reload, addReview, addQuickReview, addProject, updateSignal, markNotificationsRead, saveSettings]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used inside DataProvider');
  return context;
}
