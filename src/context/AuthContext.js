'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

const SESSION_ROLE_KEY = 'jf_expected_role';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  const checkUserLoggedIn = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      
      if (data.success) {
        const expectedRole = sessionStorage.getItem(SESSION_ROLE_KEY);

        // If this tab had a previous login session, verify the role still matches
        if (expectedRole && data.user.role !== expectedRole) {
          // Another tab logged in as a different role — the cookie was overwritten.
          // Clear this tab's stale expected role and redirect to login.
          sessionStorage.removeItem(SESSION_ROLE_KEY);
          setUser(null);
          setLoading(false);
          router.push('/login');
          return;
        }

        setUser(data.user);
      } else {
        sessionStorage.removeItem(SESSION_ROLE_KEY);
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await res.json();
    if (data.success) {
      // Store this tab's expected role so we can detect cross-tab overwrites
      sessionStorage.setItem(SESSION_ROLE_KEY, data.user.role);
      setUser(data.user);
      return { success: true, user: data.user };
    }
    return { success: false, message: data.message };
  };

  const register = async (userData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    
    const data = await res.json();
    if (data.success) {
      // Store this tab's expected role so we can detect cross-tab overwrites
      sessionStorage.setItem(SESSION_ROLE_KEY, data.user.role);
      setUser(data.user);
      return { success: true, user: data.user };
    }
    return { success: false, message: data.message };
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    sessionStorage.removeItem(SESSION_ROLE_KEY);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkUserLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
