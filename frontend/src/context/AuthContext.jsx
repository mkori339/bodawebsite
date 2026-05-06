import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/api.js';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const rawUser = localStorage.getItem('boda_user');
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (_error) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('boda_token'));
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (token && !user) {
      refreshProfile(token).catch(() => {
        if (isMounted) {
          clearAuth();
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [token, user]);

  function persistAuth(nextToken, nextUser) {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem('boda_token', nextToken);
    localStorage.setItem('boda_user', JSON.stringify(nextUser));
  }

  function clearAuth() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('boda_token');
    localStorage.removeItem('boda_user');
  }

  async function login(credentials) {
    setLoading(true);

    try {
      const data = await authApi.login(credentials);
      persistAuth(data.token, data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  async function register(payload) {
    setLoading(true);

    try {
      const data = await authApi.register(payload);
      persistAuth(data.token, data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  async function refreshProfile(currentToken = token) {
    if (!currentToken) {
      return null;
    }

    const data = await authApi.me(currentToken);
    persistAuth(currentToken, data.user);
    return data.user;
  }

  function logout() {
    clearAuth();
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        register,
        refreshProfile,
        logout,
        isAuthenticated: Boolean(token && user)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
