/**
 * React Query: appraisal cycle mutations (HR/Admin).
 * Responses return the saved cycle, which is written straight into the workspace cache.
 */
import { useMutation } from '@tanstack/react-query';
import * as api from '../../services/api.js';
import { upsert, useUpdateWorkspace } from './workspace.js';

/** HR: remind every employee with a pending step. Variables: cycle id. */
export function useRemindCycle() {
  return useMutation({ mutationFn: (id) => api.remindCycle(id) });
}

/** Manager/HR: remind one employee. Variables: { u, period }. */
export function useRemindEmployee() {
  const update = useUpdateWorkspace();
  return useMutation({
    mutationFn: ({ u, period }) => api.remindEmployee(u, period),
    onSuccess: ({ plan }) => { if (plan) update((ws) => ({ ...ws, goalPlans: upsert(ws.goalPlans, plan) })); },
  });
}

/** Variables: { id?, input } — creates when id is missing, otherwise edits. */
export function useSaveCycle() {
  const update = useUpdateWorkspace();
  return useMutation({
    mutationFn: ({ id, input }) => (id ? api.updateCycle(id, input) : api.createCycle(input)),
    onSuccess: (cycle) => update((ws) => ({ ...ws, cycles: upsert(ws.cycles || [], cycle) })),
  });
}

/** Variables: { id, action: 'publish' | 'close' }. */
export function useCycleAction() {
  const update = useUpdateWorkspace();
  return useMutation({
    mutationFn: ({ id, action }) => api.cycleAction(id, action),
    onSuccess: (cycle) => update((ws) => ({ ...ws, cycles: upsert(ws.cycles || [], cycle) })),
  });
}

/** Variables: id (draft cycles only). */
export function useDeleteCycle() {
  const update = useUpdateWorkspace();
  return useMutation({
    mutationFn: (id) => api.deleteCycle(id),
    onSuccess: ({ id }) => update((ws) => ({ ...ws, cycles: (ws.cycles || []).filter((c) => c.id !== id) })),
  });
}
