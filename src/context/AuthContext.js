'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

const SESSION_ROLE_KEY = 'jf_expected_role';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const syncTabSession = async () => {
    try {
      const token = sessionStorage.getItem('jf_token');
      if (token) {
        await fetch('/api/auth/restore-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      }
    } catch (error) {
      console.error('Failed to sync tab session:', error);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      // Load user from sessionStorage first for instant client hydration
      const cachedUser = sessionStorage.getItem('jf_user');
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch (e) {
          console.error('Error parsing cached user:', e);
        }
      }
      await checkUserLoggedIn();
    };

    initAuth();

    const handleFocus = () => {
      syncTabSession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncTabSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const checkUserLoggedIn = async () => {
    try {
      // Always sync the token to cookie first if it exists in sessionStorage
      const token = sessionStorage.getItem('jf_token');
      if (token) {
        const syncRes = await fetch('/api/auth/restore-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const syncData = await syncRes.json();
        if (!syncData.success) {
          // Token is invalid/expired
          sessionStorage.removeItem('jf_token');
          sessionStorage.removeItem('jf_user');
          sessionStorage.removeItem(SESSION_ROLE_KEY);
          setUser(null);
          setLoading(false);
          return;
        }
      }

      const expectedRole = sessionStorage.getItem(SESSION_ROLE_KEY);
      
      const res = await fetch('/api/auth/me', {
        headers: {
          'x-expected-role': expectedRole || ''
        }
      });
      const data = await res.json();
      
      if (data.success) {
        const expectedRole = sessionStorage.getItem(SESSION_ROLE_KEY);

        // If this tab had a previous login session, verify the role still matches
        if (expectedRole && data.user.role !== expectedRole) {
          // Stale expected role, redirect to login
          sessionStorage.removeItem('jf_token');
          sessionStorage.removeItem('jf_user');
          sessionStorage.removeItem(SESSION_ROLE_KEY);
          setUser(null);
          setLoading(false);
          router.push('/login');
          return;
        }

        sessionStorage.setItem('jf_user', JSON.stringify(data.user));
        setUser(data.user);
      } else {
        sessionStorage.removeItem('jf_token');
        sessionStorage.removeItem('jf_user');
        sessionStorage.removeItem(SESSION_ROLE_KEY);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth verification error:', error);
      // Fallback: keep cached user on network errors
      const cachedUser = sessionStorage.getItem('jf_user');
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
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
      if (data.token) {
        sessionStorage.setItem('jf_token', data.token);
      }
      sessionStorage.setItem('jf_user', JSON.stringify(data.user));
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
      // Return success without logging the user in
      return { success: true, message: data.message };
    }
    return { success: false, message: data.message };
  };

  const logout = async () => {
    const expectedRole = user?.role || sessionStorage.getItem(SESSION_ROLE_KEY);
    await fetch('/api/auth/logout', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: expectedRole })
    });
    sessionStorage.removeItem('jf_token');
    sessionStorage.removeItem('jf_user');
    sessionStorage.removeItem(SESSION_ROLE_KEY);
    setUser(null);
    
    if (expectedRole === 'super_admin') {
      router.push('/admin/login');
    } else if (expectedRole === 'college') {
      router.push('/college/login');
    } else if (expectedRole === 'company' || expectedRole === 'hr_company') {
      router.push('/company/login');
    } else {
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkUserLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
