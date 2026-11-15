/**
 * React Query: goal workflow mutations.
 * Every API response returns the saved records, so onSuccess writes them straight into the
 * workspace cache (no refetch needed). Components get `isPending` / `error` from the mutation.
 */
import { useMutation } from '@tanstack/react-query';
import * as api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { upsert, useUpdateWorkspace } from './workspace.js';

const mergeGoals = (current, goals = []) => goals.reduce((list, goal) => upsert(list, goal), current);

/** Employee creates a goal. Variables: goal fields + { period, submit }. */
export function useCreateGoal() {
  const { user } = useAuth();
  const update = useUpdateWorkspace();
  return useMutation({
    mutationFn: (input) => api.createGoal(input, user),
    onSuccess: ({ goal }) => update((ws) => ({ ...ws, goals: upsert(ws.goals, goal) })),
  });
}

/** Employee edits a draft / returned goal. Variables: { id, changes }. */
export function useUpdateGoal() {
  const { user } = useAuth();
  const update = useUpdateWorkspace();
  return useMutation({
    mutationFn: ({ id, changes }) => api.updateGoal(id, changes, user),
    onSuccess: ({ goal }) => update((ws) => ({ ...ws, goals: upsert(ws.goals, goal) })),
  });
}

/** Employee deletes a draft / returned / rejected goal. Variables: id. Optimistic, rolled back on error. */
export function useDeleteGoal() {
  const { user } = useAuth();
  const update = useUpdateWorkspace();
  return useMutation({
    mutationFn: (id) => api.deleteGoal(id, user),
    onMutate: (id) => {
      let removed;
      update((ws) => {
        removed = ws.goals.find((g) => g.id === id);
        return { ...ws, goals: ws.goals.filter((g) => g.id !== id) };
      });
      return { removed };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.removed) update((ws) => ({ ...ws, goals: upsert(ws.goals, ctx.removed) }));
    },
    onSuccess: ({ plan }) => {
      if (plan) update((ws) => ({ ...ws, goalPlans: upsert(ws.goalPlans, plan) }));
    },
  });
}

/** One workflow action on one goal (submit, approve, reject, progress, requestChange…). Variables: { id, action, payload }. */
export function useGoalAction() {
  const { user } = useAuth();
  const update = useUpdateWorkspace();
  return useMutation({
    mutationFn: ({ id, action, payload }) => api.goalAction(id, action, payload, user),
    onSuccess: ({ goal }) => update((ws) => ({ ...ws, goals: upsert(ws.goals, goal) })),
  });
}

/** Plan-level step (submitAll, approveAll, selfAssess, evaluate, hrFinalize, hrReturn, acknowledge). Variables: { u, period, action, payload }. */
export function useGoalPlanAction() {
  const { user } = useAuth();
  const update = useUpdateWorkspace();
  return useMutation({
    mutationFn: ({ u, period, action, payload }) => api.goalPlanAction(u, period, action, payload, user),
    onSuccess: ({ plan, goals }) => update((ws) => ({ ...ws, goalPlans: upsert(ws.goalPlans, plan), goals: mergeGoals(ws.goals, goals) })),
  });
}
