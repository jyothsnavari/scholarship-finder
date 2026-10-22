import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
      return;
    }
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const startSession = (d) => {
    localStorage.setItem('token', d.token);
    setUser(d.user);
    return d.user;
  };

  const value = {
    user,
    setUser,
    loading,
    login: async (body) => startSession(await api('/auth/login', { method: 'POST', body })),
    // Returns the API response: either a session (token) or { needsVerification: true }
    register: async (body) => {
      const d = await api('/auth/register', { method: 'POST', body });
      if (d.token) startSession(d);
      return d;
    },
    logout: () => {
      localStorage.removeItem('token');
      setUser(null);
    },
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
