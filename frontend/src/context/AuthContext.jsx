import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('casesync_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('casesync_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('casesync_token');
    localStorage.removeItem('casesync_user');
  }, []);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const profileRes = await authApi.getMe();
          const userData = profileRes?.data || profileRes?.user;
          if (userData) {
            setUser(userData);
            localStorage.setItem('casesync_user', JSON.stringify(userData));
          }
        } catch (err) {
          console.warn('Session verification error:', err.message);
          if (err.message?.includes('token') || err.message?.includes('expired') || err.message?.includes('401') || err.message?.includes('Forbidden')) {
            logout();
          }
        }
      }
      setIsLoading(false);
    }

    verifyAuth();
  }, [token, logout]);

  const login = async (email, password) => {
    const response = await authApi.login(email, password);
    const payload = response?.data || response;
    if (payload?.token) {
      const newToken = payload.token;
      const userData = payload.user;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('casesync_token', newToken);
      localStorage.setItem('casesync_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    throw new Error(response?.message || 'Login failed');
  };

  const register = async (formData) => {
    const response = await authApi.register(formData);
    return response;
  };

  const role = user?.role || 'CITIZEN';
  const isCitizen = role === 'CITIZEN';
  const isDeskOfficer = role === 'DESK_OFFICER';
  const isIo = role === 'IO';
  const isSho = role === 'SHO';
  const isSupervisor = role === 'SUPERVISOR';
  const isAuditor = role === 'AUDITOR';
  const isAdmin = role === 'ADMIN';
  const isPolicePersonnel = ['DESK_OFFICER', 'IO', 'SHO', 'SUPERVISOR', 'AUDITOR', 'ADMIN'].includes(role);

  const value = {
    user,
    token,
    role,
    isAuthenticated: !!token,
    isLoading,
    login,
    register,
    logout,
    isCitizen,
    isDeskOfficer,
    isIo,
    isSho,
    isSupervisor,
    isAuditor,
    isAdmin,
    isPolicePersonnel
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
