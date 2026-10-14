import React, { createContext, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const profile = await authApi.getMe();
          if (profile?.data) {
            setUser(profile.data);
            localStorage.setItem('casesync_user', JSON.stringify(profile.data));
          }
        } catch (err) {
          console.warn('Session expired or backend unavailable:', err.message);
          // If 401 or invalid token, clean up
          if (err.message?.includes('token') || err.message?.includes('expired') || err.message?.includes('401')) {
            logout();
          }
        }
      }
      setIsLoading(false);
    }

    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    const response = await authApi.login(email, password);
    if (response?.success && response.data?.token) {
      const { token: newToken, user: userData } = response.data;
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

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('casesync_token');
    localStorage.removeItem('casesync_user');
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    register,
    logout,
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
