import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, DeviceInfo } from '../types';
import { getClientDeviceInfo } from '../utils/deviceInfo';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  accessKeyError: string | null;
  sessionKickedMessage: string | null;
  loginWithPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  verifyAccessKey: (accessKey: string) => Promise<{ success: boolean; error?: string }>;
  getCopyableUserAccessLink: () => Promise<string>;
  logout: () => Promise<void>;
  clearSessionKickedMessage: () => void;
  clearAccessKeyError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'pillarflow_auth_token_v1';
const USER_STORAGE_KEY = 'pillarflow_auth_user_v1';
const DEFAULT_ACCESS_KEY = 'AFFILIATE2026';

const DEFAULT_OWNER_USER: User = {
  id: 'usr_owner_001',
  username: 'owner',
  name: 'Owner Admin',
  email: 'owner@pillarflow.com',
  role: 'owner',
  status: 'active',
  createdAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
  currentDeviceInfo: null,
  isOnline: true
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [sessionKickedMessage, setSessionKickedMessage] = useState<string | null>(null);
  const [accessKeyError, setAccessKeyError] = useState<string | null>(null);

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
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setSessionKickedMessage(message);
  }, []);

  // Check / Validate Session via Token
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
        },
        credentials: 'same-origin'
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        } else {
          const errData = await res.json().catch(() => ({}));
          if (errData.code === 'SESSION_KICKED') {
            handleSessionTerminated(
              errData.error ||
                'Akun Anda telah digunakan untuk login di perangkat lain. Sesi ini telah berakhir.'
            );
          } else if (errData.code === 'ACCOUNT_DISABLED') {
            handleSessionTerminated('Akun Anda telah dinonaktifkan oleh Owner.');
          } else {
            const savedUserRaw = localStorage.getItem(USER_STORAGE_KEY);
            if (savedUserRaw) {
              try {
                setUser(JSON.parse(savedUserRaw));
              } catch (e) {
                localStorage.removeItem(TOKEN_STORAGE_KEY);
                localStorage.removeItem(USER_STORAGE_KEY);
                setToken(null);
                setUser(null);
              }
            } else {
              localStorage.removeItem(TOKEN_STORAGE_KEY);
              localStorage.removeItem(USER_STORAGE_KEY);
              setToken(null);
              setUser(null);
            }
          }
        }
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Session validation network error, falling back to local storage:', err);
    }

    const savedUserRaw = localStorage.getItem(USER_STORAGE_KEY);
    if (savedUserRaw) {
      try {
        setUser(JSON.parse(savedUserRaw));
      } catch (e) {
        setUser(null);
      }
    } else if (activeToken.startsWith('vcl_owner')) {
      setUser(DEFAULT_OWNER_USER);
    } else {
      setUser(null);
    }

    setIsLoading(false);
  }, [token, handleSessionTerminated]);

  // VERIFY ACCESS KEY FROM URL OR LINK
  const verifyAccessKey = useCallback(async (accessKey: string) => {
    setIsLoading(true);
    setAccessKeyError(null);
    setSessionKickedMessage(null);
    const deviceInfo: DeviceInfo = getClientDeviceInfo();

    try {
      const res = await fetch('/api/auth/verify-access-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey, deviceInfo }),
        credentials: 'same-origin'
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.token) {
          localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
          setToken(data.token);
          setUser(data.user);
          setIsLoading(false);
          return { success: true };
        } else {
          setIsLoading(false);
          const errText = data.error || 'Akses Tidak Valid: Link akses tidak berlaku atau telah diganti oleh Owner.';
          setAccessKeyError(errText);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
          setToken(null);
          setUser(null);
          return { success: false, error: errText };
        }
      }
    } catch (err) {
      console.warn('Backend access key verification API unavailable, trying client fallback:', err);
    }

    // Client-side fallback if server API fails (e.g. offline/static)
    if (accessKey.trim().toUpperCase() === DEFAULT_ACCESS_KEY) {
      const fallbackToken = 'vcl_user_token_' + Date.now();
      const userObj: User = {
        id: 'usr_user_' + Date.now(),
        username: 'user_' + Date.now().toString(36),
        name: 'Pengguna (User)',
        email: 'user@pillarflow.app',
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        currentDeviceInfo: deviceInfo,
        isOnline: true
      };
      localStorage.setItem(TOKEN_STORAGE_KEY, fallbackToken);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userObj));
      setToken(fallbackToken);
      setUser(userObj);
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    const errText = 'Akses Tidak Valid: Link akses tidak berlaku, salah, atau telah dinonaktifkan oleh Owner.';
    setAccessKeyError(errText);
    return { success: false, error: errText };
  }, []);

  // Initial Check on Mount: Check for access_key in URL search params
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlAccessKey = searchParams.get('access_key');

    if (urlAccessKey) {
      verifyAccessKey(urlAccessKey).then(() => {
        // Clean URL parameter without page reload
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      });
    } else {
      validateSession();
    }
  }, [validateSession, verifyAccessKey]);

  // Periodic Heartbeat Check
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      validateSession();
    }, 15000);

    return () => clearInterval(interval);
  }, [token, validateSession]);

  // OWNER LOGIN WITH PIN
  const loginWithPin = async (pinInput: string) => {
    setIsLoading(true);
    setSessionKickedMessage(null);
    setAccessKeyError(null);

    const pin = (pinInput || '').trim();
    const deviceInfo: DeviceInfo = getClientDeviceInfo();

    try {
      const res = await fetch('/api/auth/login-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, deviceInfo }),
        credentials: 'same-origin'
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.token) {
          localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
          setToken(data.token);
          setUser(data.user);
          setIsLoading(false);
          return { success: true };
        } else {
          setIsLoading(false);
          return { success: false, error: data.error || 'PIN Owner salah.' };
        }
      }
    } catch (err: any) {
      console.warn('Backend PIN login unavailable, using client fallback:', err);
    }

    // Client-side fallback for static/offline mode
    if (pin === 'ownerkonten123' || pin === 'owner') {
      const fallbackToken = 'vcl_owner_token_' + Date.now();
      const updatedOwner: User = {
        ...DEFAULT_OWNER_USER,
        lastLoginAt: new Date().toISOString(),
        currentDeviceInfo: deviceInfo
      };
      localStorage.setItem(TOKEN_STORAGE_KEY, fallbackToken);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedOwner));
      setToken(fallbackToken);
      setUser(updatedOwner);
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, error: 'PIN Owner salah. Silakan periksa kembali PIN Anda.' };
  };

  // Legacy login function mapping to PIN login
  const login = async (usernameInput: string, passwordInput: string) => {
    return loginWithPin(passwordInput || usernameInput);
  };

  // GET COPYABLE ACCESS LINK FOR OWNER
  const getCopyableUserAccessLink = async (): Promise<string> => {
    let key = DEFAULT_ACCESS_KEY;
    try {
      const activeToken = token || localStorage.getItem(TOKEN_STORAGE_KEY);
      const res = await fetch('/api/owner/access-key', {
        headers: { Authorization: activeToken ? `Bearer ${activeToken}` : '' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.accessKey) key = data.accessKey;
      }
    } catch (e) {
      console.warn('Error fetching active access key:', e);
    }

    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?access_key=${encodeURIComponent(key)}`;
  };

  // Logout Handler
  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'same-origin'
        });
      } catch (e) {
        console.warn('Logout request warning:', e);
      }
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  const clearSessionKickedMessage = () => {
    setSessionKickedMessage(null);
  };

  const clearAccessKeyError = () => {
    setAccessKeyError(null);
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
        accessKeyError,
        sessionKickedMessage,
        loginWithPin,
        login,
        verifyAccessKey,
        getCopyableUserAccessLink,
        logout,
        clearSessionKickedMessage,
        clearAccessKeyError,
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
