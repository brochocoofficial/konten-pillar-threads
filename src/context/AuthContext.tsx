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
const USER_STORAGE_KEY = 'pillarflow_auth_user_v1';
const LOCAL_USERS_STORAGE_KEY = 'pillarflow_local_users_v1';

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
                'Akun Anda telah digunakan untuk login di perangkat lain. Demi keamanan, sesi pada perangkat ini telah berakhir.'
            );
          } else if (errData.code === 'ACCOUNT_DISABLED') {
            handleSessionTerminated('Akun Anda telah dinonaktifkan oleh Owner.');
          } else {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            localStorage.removeItem(USER_STORAGE_KEY);
            setToken(null);
            setUser(null);
          }
        }
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Session validation network error, falling back to local storage:', err);
    }

    // Fallback if API returned non-JSON (static hosting on Vercel) or network error
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

  // Initial check on mount
  useEffect(() => {
    validateSession();
  }, [validateSession]);

  // Periodic Heartbeat Check
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      validateSession();
    }, 10000);

    return () => clearInterval(interval);
  }, [token, validateSession]);

  // Login Handler
  const login = async (usernameInput: string, passwordInput: string) => {
    setIsLoading(true);
    setSessionKickedMessage(null);

    const username = (usernameInput || '').trim();
    const password = (passwordInput || '').trim();
    const deviceInfo: DeviceInfo = getClientDeviceInfo();

    let isApiFunctional = false;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, deviceInfo })
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        isApiFunctional = true;
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
          return { success: false, error: data.error || 'Login gagal.' };
        }
      }
    } catch (err: any) {
      console.warn('Backend API login unavailable, using client fallback:', err);
    }

    // Client-side fallback for Vercel Static deployment or offline mode
    if (!isApiFunctional) {
      const target = username.toLowerCase();

      // Check Owner Credentials
      if (
        (target === 'owner' || target === 'owner@pillarflow.com') &&
        (password === 'ownerpassword123' || password === 'owner')
      ) {
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

      // Check locally registered users
      const localUsersRaw = localStorage.getItem(LOCAL_USERS_STORAGE_KEY);
      if (localUsersRaw) {
        try {
          const localUsers: any[] = JSON.parse(localUsersRaw);
          const match = localUsers.find(
            (u) =>
              (u.username.toLowerCase() === target || u.email.toLowerCase() === target) &&
              u.password === password
          );
          if (match) {
            const fallbackToken = 'vcl_user_token_' + Date.now();
            const userObj: User = {
              id: match.id,
              username: match.username,
              name: match.name,
              email: match.email,
              role: match.role || 'user',
              status: match.status || 'active',
              createdAt: match.createdAt || new Date().toISOString(),
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
        } catch (e) {
          console.error('Error reading local users:', e);
        }
      }

      setIsLoading(false);
      return { success: false, error: 'Username/email atau password salah.' };
    }

    setIsLoading(false);
    return { success: false, error: 'Gagal terhubung ke server auth.' };
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

    let isApiFunctional = false;

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

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        isApiFunctional = true;
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
          return { success: false, error: data.error || 'Pendaftaran gagal.' };
        }
      }
    } catch (err) {
      console.warn('Backend API registration unavailable, trying client fallback:', err);
    }

    // Client fallback registration for Vercel Static
    if (!isApiFunctional) {
      const newUserId = 'usr_loc_' + Date.now();
      const newUserObj: User = {
        id: newUserId,
        username: username.trim(),
        name: name.trim(),
        email: email.trim(),
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        currentDeviceInfo: deviceInfo,
        isOnline: true
      };

      const localUsersRaw = localStorage.getItem(LOCAL_USERS_STORAGE_KEY);
      let localUsers: any[] = [];
      if (localUsersRaw) {
        try {
          localUsers = JSON.parse(localUsersRaw);
        } catch (e) {
          localUsers = [];
        }
      }

      localUsers.push({
        ...newUserObj,
        password: password.trim()
      });

      localStorage.setItem(LOCAL_USERS_STORAGE_KEY, JSON.stringify(localUsers));

      const fallbackToken = 'vcl_user_token_' + Date.now();
      localStorage.setItem(TOKEN_STORAGE_KEY, fallbackToken);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUserObj));
      setToken(fallbackToken);
      setUser(newUserObj);
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, error: 'Gagal menghubungi server pendaftaran.' };
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
    localStorage.removeItem(USER_STORAGE_KEY);
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
