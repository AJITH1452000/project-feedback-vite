import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../services/api.js';

const AuthContext = createContext(null);

/** UI-only permission helper. The backend must enforce the same rules. */
export const can = (user, action) => ({
  give: user?.role === 'manager',
  seeAll: user?.role === 'manager',
  configure: user?.role === 'manager',
})[action] === true;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('checking'); // checking | ready

  useEffect(() => {
    let active = true;
    api.restoreSession().then((session) => {
      if (!active) return;
      setUser(session || null);
      setStatus('ready');
    });
    return () => { active = false; };
  }, []);

  const login = useCallback(async (credentials) => {
    const signedIn = await api.login(credentials);
    setUser(signedIn);
    return signedIn;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, status, login, logout, isManager: user?.role === 'manager' }), [user, status, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
