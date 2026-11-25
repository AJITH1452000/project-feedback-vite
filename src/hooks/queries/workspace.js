/**
 * React Query: workspace cache.
 * The whole workspace (projects, users, reviews, goals…) is one query keyed by the signed-in user,
 * so different users never share cached data. Slices are read with `select`, which keeps
 * components from re-rendering when unrelated parts of the workspace change.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import * as api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { registerCycles } from '../../data/cycles.js';

export const EMPTY_WORKSPACE = {
  projects: [], users: [], reviews: [], history: [], signals: [], notifications: [], settings: null, goals: [], goalPlans: [], people: [], cycles: [],
};

export const queryKeys = {
  all: ['workspace'],
  workspace: (user) => ['workspace', user?.role ?? 'anonymous', user?.userId ?? user?.managerId ?? null],
};

/** Insert or replace by id — keeps updates idempotent (own actions + socket echoes). */
export const upsert = (list = [], item, { prepend = false } = {}) => {
  const exists = list.some((x) => x.id === item.id);
  if (exists) return list.map((x) => (x.id === item.id ? { ...x, ...item } : x));
  return prepend ? [item, ...list] : [...list, item];
};

export function workspaceQueryOptions(user) {
  return {
    queryKey: queryKeys.workspace(user),
    queryFn: async ({ signal }) => ({ ...EMPTY_WORKSPACE, ...(await api.fetchWorkspace(user, { signal })) }),
    enabled: Boolean(user),
  };
}

/** The workspace query for the current user. Pass `select` to subscribe to a slice only. */
export function useWorkspaceQuery(select) {
  const { user } = useAuth();
  return useQuery({ ...workspaceQueryOptions(user), select });
}

/** Returns `update(fn)` that patches the cached workspace for the current user: fn(workspace) => workspace. */
export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useCallback(
    (fn) => queryClient.setQueryData(queryKeys.workspace(user), (cur) => (cur ? fn(cur) : cur)),
    [queryClient, user],
  );
}

/* ----------------------------- Slice hooks ------------------------------ */
const selectGoalData = (ws) => ({ goals: ws.goals, goalPlans: ws.goalPlans, users: ws.users, people: ws.people, settings: ws.settings, cycles: ws.cycles || [] });

/** Goals, plans, users and settings — everything the goal screens need. */
export function useGoalData() {
  const query = useWorkspaceQuery(selectGoalData);
  const data = query.data || selectGoalData(EMPTY_WORKSPACE);
  // The shared workflow rules (goals.js) read cycle settings from this registry.
  registerCycles(data.cycles);
  return { ...data, query };
}
