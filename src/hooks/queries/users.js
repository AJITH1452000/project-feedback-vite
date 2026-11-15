/** React Query: people directory mutations (add, edit, deactivate, reset password). */
import { useMutation } from '@tanstack/react-query';
import * as api from '../../services/api.js';
import { upsert, useUpdateWorkspace } from './workspace.js';

/** Keep both lists in sync: `people` (full directory) and `users` (active employees). */
const applyPerson = (ws, person) => ({
  ...ws,
  people: upsert(ws.people || [], person),
  users: person.role === 'employee' && person.active ? upsert(ws.users, person) : ws.users.filter((u) => u.id !== person.id),
});

export function useCreateUser() {
  const update = useUpdateWorkspace();
  return useMutation({
    mutationFn: (input) => api.createUser(input),
    onSuccess: (person) => update((ws) => applyPerson(ws, person)),
  });
}

/** Variables: { id, changes } — changes may include profile fields, { active }, or { password }. */
export function useUpdateUser() {
  const update = useUpdateWorkspace();
  return useMutation({
    mutationFn: ({ id, changes }) => api.updateUser(id, changes),
    onSuccess: (person) => update((ws) => applyPerson(ws, person)),
  });
}
