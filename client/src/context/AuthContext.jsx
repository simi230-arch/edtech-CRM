import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthAPI, getAuthToken, setAuthToken, getStoredUser, setStoredUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getAuthToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyUser() {
      const currentToken = getAuthToken();
      if (!currentToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await AuthAPI.me();
        setUser(res.user);
        setStoredUser(res.user);
      } catch (err) {
        console.warn('Session verification failed:', err);
        setAuthToken(null);
        setStoredUser(null);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    verifyUser();

    function handleUnauthorized() {
      setUser(null);
      setToken(null);
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const res = await AuthAPI.login({ email, password });
    setAuthToken(res.token);
    setStoredUser(res.user);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const register = async (name, email, password) => {
    const res = await AuthAPI.register({ name, email, password });
    setAuthToken(res.token);
    setStoredUser(res.user);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    try {
      await AuthAPI.logout();
    } catch (e) {
      // Ignore network errors during logout
    }
    setAuthToken(null);
    setStoredUser(null);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
