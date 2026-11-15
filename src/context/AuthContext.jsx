import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../services/api.js';

const AuthContext = createContext(null);

/** UI-only permission helper. The server enforces the same rules. */
export const can = (user, action) => ({
  give: user?.role === 'manager',
  seeAll: user?.role === 'manager',
  configure: user?.role === 'manager' || user?.role === 'hr',
  manageUsers: user?.role === 'manager' || user?.role === 'hr',
})[action] === true;

/** Keeps sign-in / sign-out in sync across browser tabs (the session cookie is shared). */
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('profeed-auth') : null;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('checking'); // checking | ready | offline
  const [error, setError] = useState('');

  const check = useCallback(async () => {
    setStatus('checking');
    try {
      setUser(await api.restoreSession());
      setError('');
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('offline');
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  useEffect(() => {
    if (!channel) return undefined;
    const onMessage = (event) => {
      if (event.data?.type === 'logout') setUser(null);
      if (event.data?.type === 'login') check();
    };
    channel.addEventListener('message', onMessage);
    return () => channel.removeEventListener('message', onMessage);
  }, [check]);

  const signedIn = useCallback((account) => {
    setUser(account);
    setStatus('ready');
    channel?.postMessage({ type: 'login' });
    return account;
  }, []);

  const login = useCallback(async (credentials) => signedIn(await api.login(credentials)), [signedIn]);
  const setup = useCallback(async (input) => signedIn(await api.setupWorkspace(input)), [signedIn]);

  /** Ends the server session (also disconnects this session's live socket). */
  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    channel?.postMessage({ type: 'logout' });
  }, []);

  const value = useMemo(() => ({
    user, status, error, retry: check, login, setup, logout, isManager: user?.role === 'manager', isHr: user?.role === 'hr',
  }), [user, status, error, check, login, setup, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
