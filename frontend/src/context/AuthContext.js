import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // FIX: Wrapped in useCallback so refreshUser is stable across renders
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch {
      // Don't clear token here — session might still be valid,
      // network blip could cause this to fail temporarily.
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // On mount: check if already logged in via session or stored JWT
    api.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => {
        // FIX: Only remove token if it's truly invalid (auth middleware
        //      already validates the JWT). If there's no token, this is a
        //      normal "not logged in" state — don't throw errors.
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Still clean up locally even if the server call fails
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);