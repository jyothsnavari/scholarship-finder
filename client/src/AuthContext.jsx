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

  const authenticate = async (path, body) => {
    const d = await api(path, { method: 'POST', body });
    localStorage.setItem('token', d.token);
    setUser(d.user);
    return d.user;
  };

  const value = {
    user,
    setUser,
    loading,
    login: (body) => authenticate('/auth/login', body),
    register: (body) => authenticate('/auth/register', body),
    logout: () => {
      localStorage.removeItem('token');
      setUser(null);
    },
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
