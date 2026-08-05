import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getMe, login as apiLogin, register as apiRegister, logout as apiLogout } from '@/services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount via the HTTP-only cookie.
  useEffect(() => {
    let mounted = true;
    getMe()
      .then((res) => mounted && setUser(res.ok ? res.data : null))
      .catch(() => mounted && setUser(null))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await apiLogin(email, password);
    if (res.ok) setUser(res.data.user);
    return res;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await apiRegister(name, email, password);
    if (res.ok) setUser(res.data.user);
    return res;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const value = { user, loading, login, register, logout, setUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
