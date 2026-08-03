import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, DeviceInfo } from '../types';
import { getClientDeviceInfo } from '../utils/deviceInfo';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  sessionKickedMessage: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  registerWithInvite: (
    inviteToken: string,
    username: string,
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  clearSessionKickedMessage: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'pillarflow_auth_token_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionKickedMessage, setSessionKickedMessage] = useState<string | null>(null);

  // Helper for auth headers
  const getAuthHeaders = useCallback((customToken?: string) => {
    const activeToken = customToken || token || localStorage.getItem(TOKEN_STORAGE_KEY);
    return {
      'Content-Type': 'application/json',
      Authorization: activeToken ? `Bearer ${activeToken}` : ''
    };
  }, [token]);

  // Handle session termination locally
  const handleSessionTerminated = useCallback((message: string) => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setSessionKickedMessage(message);
  }, []);

  // Check / Validate Session
  const validateSession = useCallback(async (authToken?: string) => {
    const activeToken = authToken || token || localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!activeToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${activeToken}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        const errData = await res.json().catch(() => ({}));
        if (errData.code === 'SESSION_KICKED') {
          handleSessionTerminated(
            errData.error ||
              'Akun Anda telah digunakan untuk login di perangkat lain. Demi keamanan, sesi pada perangkat ini telah berakhir.'
          );
        } else if (errData.code === 'ACCOUNT_DISABLED') {
          handleSessionTerminated('Akun Anda telah dinonaktifkan oleh Owner.');
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setToken(null);
          setUser(null);
        }
      }
    } catch (err) {
      console.error('Session validation network error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, handleSessionTerminated]);

  // Initial check on mount
  useEffect(() => {
    validateSession();
  }, [validateSession]);

  // Periodic Heartbeat Check (Every 10 seconds to enforce Single Device Login in real time)
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      validateSession();
    }, 10000);

    return () => clearInterval(interval);
  }, [token, validateSession]);

  // Login Handler
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setSessionKickedMessage(null);

    const deviceInfo: DeviceInfo = getClientDeviceInfo();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, deviceInfo })
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: data.error || 'Login gagal.' };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: 'Gagal terhubung ke server auth.' };
    }
  };

  // Register via Invite Handler
  const registerWithInvite = async (
    inviteToken: string,
    username: string,
    name: string,
    email: string,
    password: string
  ) => {
    setIsLoading(true);
    setSessionKickedMessage(null);
    const deviceInfo: DeviceInfo = getClientDeviceInfo();

    try {
      const res = await fetch('/api/auth/register-with-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: inviteToken,
          username,
          name,
          email,
          password,
          deviceInfo
        })
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: data.error || 'Pendaftaran gagal.' };
      }
    } catch (err) {
      setIsLoading(false);
      return { success: false, error: 'Gagal menghubungi server pendaftaran.' };
    }
  };

  // Logout Handler
  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: getAuthHeaders()
        });
      } catch (e) {
        console.warn('Logout request warning:', e);
      }
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  const clearSessionKickedMessage = () => {
    setSessionKickedMessage(null);
  };

  const refreshUser = async () => {
    await validateSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        sessionKickedMessage,
        login,
        logout,
        registerWithInvite,
        clearSessionKickedMessage,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
