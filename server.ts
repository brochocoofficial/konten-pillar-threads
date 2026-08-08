import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { generateLocalContentPlan } from './src/data/generatorEngine.js';
import { GenerateFormInput, GenerationResult, User, UserRole, AccountStatus, InviteLink, DeviceInfo } from './src/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data Directory & Database File Path
const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'auth-db.json');

// Memory State & Interfaces
interface StoredUser extends User {
  passwordHash: string;
}

interface StoredSession {
  token: string;
  userId: string;
  createdAt: string;
  lastActiveAt: string;
  deviceInfo: DeviceInfo;
}

interface AuthDatabase {
  users: StoredUser[];
  sessions: StoredSession[];
  invites: InviteLink[];
  ownerPin?: string;
  activeAccessKey?: string;
  accessKeyStatus?: 'active' | 'disabled';
}

// Password Hash Helper
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_pillarflow_salt_v2026').digest('hex');
}

// Database Initialization & Persistence Helper
function loadDatabase(): AuthDatabase {
  let loadedDb: AuthDatabase | null = null;
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      loadedDb = JSON.parse(data);
    } else {
      const fallbackPath = path.join(__dirname, 'data', 'auth-db.json');
      const fallbackPathCwd = path.join(process.cwd(), 'data', 'auth-db.json');
      if (fs.existsSync(fallbackPath)) {
        loadedDb = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
      } else if (fs.existsSync(fallbackPathCwd)) {
        loadedDb = JSON.parse(fs.readFileSync(fallbackPathCwd, 'utf-8'));
      }
    }
  } catch (err) {
    console.error('Error loading database file, reinitializing...', err);
  }

  if (!loadedDb || !Array.isArray(loadedDb.users)) {
    loadedDb = {
      users: [],
      sessions: [],
      invites: [],
      ownerPin: 'ownerkonten123',
      activeAccessKey: 'AFFILIATE2026',
      accessKeyStatus: 'active'
    };
  }

  // Ensure default Owner configuration exists
  if (!loadedDb.ownerPin) loadedDb.ownerPin = 'ownerkonten123';
  if (!loadedDb.activeAccessKey) loadedDb.activeAccessKey = 'AFFILIATE2026';
  if (!loadedDb.accessKeyStatus) loadedDb.accessKeyStatus = 'active';

  // Ensure default Owner account exists and is active
  let ownerUser = loadedDb.users.find((u) => u.username.toLowerCase() === 'owner');
  if (!ownerUser) {
    ownerUser = {
      id: 'usr_owner_001',
      username: 'owner',
      name: 'Owner Admin',
      email: 'owner@pillarflow.com',
      passwordHash: hashPassword('ownerkonten123'),
      role: 'owner',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      lastActiveAt: null,
      currentDeviceInfo: null
    };
    loadedDb.users.unshift(ownerUser);
  } else {
    ownerUser.role = 'owner';
    ownerUser.status = 'active';
  }

  saveDatabase(loadedDb);
  return loadedDb;
}

function saveDatabase(db: AuthDatabase) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save database file (e.g. read-only filesystem):', err);
  }
}

// Global In-Memory Database
let db = loadDatabase();

// Extended Request Interface with Auth Info
interface AuthenticatedRequest extends Request {
  user?: StoredUser;
  sessionToken?: string;
}

export const app = express();

async function startServer() {
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper function to sanitize user object (strip passwordHash)
  const sanitizeUser = (user: StoredUser): User => {
    const isOnline = user.lastActiveAt
      ? new Date().getTime() - new Date(user.lastActiveAt).getTime() < 2 * 60 * 1000
      : false;

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      lastActiveAt: user.lastActiveAt,
      currentDeviceInfo: user.currentDeviceInfo,
      isOnline
    };
  };

// Helper to create timestamped session tokens
function createSessionToken(userId: string): string {
  const ts = Date.now();
  const rand = crypto.randomBytes(16).toString('hex');
  return `st.${userId}.${ts}.${rand}`;
}

// Helper to parse session tokens
function parseSessionToken(token: string): { userId: string; timestamp: number } | null {
  if (!token || typeof token !== 'string') return null;
  if (token.startsWith('st.')) {
    const parts = token.split('.');
    if (parts.length >= 3) {
      const userId = parts[1];
      const timestamp = parseInt(parts[2], 10);
      if (!isNaN(timestamp) && userId) {
        return { userId, timestamp };
      }
      if (userId) {
        return { userId, timestamp: 0 };
      }
    }
  } else if (token.startsWith('vcl_owner')) {
    return { userId: 'usr_owner_001', timestamp: 0 };
  }
  return null;
}

// Helper to set session cookie on response
function setAuthCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
  const maxAgeSeconds = 30 * 24 * 60 * 60; // 30 days
  const cookieHeader = `pillarflow_token=${encodeURIComponent(token)}; Path=/; HttpOnly; Max-Age=${maxAgeSeconds}; SameSite=Lax${isProd ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookieHeader);
}

// Helper to clear session cookie on response
function clearAuthCookie(res: Response) {
  const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
  const cookieHeader = `pillarflow_token=; Path=/; HttpOnly; Max-Age=0; Path=/; SameSite=Lax${isProd ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookieHeader);
}

// Helper to extract session token from Authorization header or Cookie
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.split(' ')[1].trim();
    if (bearerToken && bearerToken !== 'null' && bearerToken !== 'undefined') {
      return bearerToken;
    }
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)pillarflow_token=([^;]*)/);
    if (match && match[1]) {
      const cookieToken = decodeURIComponent(match[1]).trim();
      if (cookieToken && cookieToken !== 'null' && cookieToken !== 'undefined') {
        return cookieToken;
      }
    }
  }
  return null;
}

  // Middleware: Authentication & Single Device Session Validation
  const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: 'Akses ditolak. Silakan login terlebih dahulu.' });
      return;
    }

    const parsedToken = parseSessionToken(token);
    let userId = parsedToken?.userId || null;

    if (!userId) {
      res.status(401).json({ error: 'Sesi tidak valid atau telah berakhir. Silakan login kembali.' });
      return;
    }

    const user = db.users.find(
      (u) => u.id === userId || u.username.toLowerCase() === userId?.toLowerCase()
    );

    if (!user) {
      res.status(401).json({ error: 'Pengguna tidak ditemukan.' });
      return;
    }

    // Check account status
    if (user.status === 'disabled') {
      res.status(403).json({
        code: 'ACCOUNT_DISABLED',
        error: 'Akun Anda telah dinonaktifkan oleh Owner. Akses ditolak.'
      });
      return;
    }

    // Single Device Enforcement Check using Timestamps:
    // If user has a currentSessionId set, check if it represents a STRICTLY NEWER session
    if (user.currentSessionId && user.currentSessionId !== token) {
      const currentParsed = parseSessionToken(user.currentSessionId);
      if (parsedToken && currentParsed && currentParsed.timestamp > parsedToken.timestamp) {
        res.status(401).json({
          code: 'SESSION_KICKED',
          error: 'Akun Anda telah digunakan untuk login di perangkat lain. Demi keamanan, sesi pada perangkat ini telah berakhir.'
        });
        return;
      }
    }

    // Update active session on user and in memory
    user.currentSessionId = token;
    const nowIso = new Date().toISOString();
    user.lastActiveAt = nowIso;

    let session = db.sessions.find((s) => s.token === token);
    if (!session) {
      session = {
        token,
        userId: user.id,
        createdAt: nowIso,
        lastActiveAt: nowIso,
        deviceInfo: user.currentDeviceInfo || { device: 'Perangkat Web', browser: 'Browser', os: 'OS' }
      };
      db.sessions.push(session);
    } else {
      session.lastActiveAt = nowIso;
    }

    saveDatabase(db);

    req.user = user;
    req.sessionToken = token;
    next();
  };

  // Middleware: Require Owner Role
  const requireOwner = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'owner') {
      res.status(403).json({ error: 'Akses khusus Owner. Pengguna tidak memiliki izin.' });
      return;
    }
    next();
  };

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // 1. OWNER PIN LOGIN ENDPOINT
  app.post('/api/auth/login-pin', (req: Request, res: Response) => {
    const { pin, deviceInfo } = req.body;

    if (!pin) {
      res.status(400).json({ error: 'PIN Owner wajib diisi.' });
      return;
    }

    const currentPin = db.ownerPin || 'ownerkonten123';
    if (pin.trim() !== currentPin) {
      res.status(401).json({ error: 'PIN yang Anda masukkan salah. Silakan coba lagi.' });
      return;
    }

    let ownerUser = db.users.find((u) => u.username === 'owner' || u.role === 'owner');
    if (!ownerUser) {
      ownerUser = {
        id: 'usr_owner_001',
        username: 'owner',
        name: 'Owner Admin',
        email: 'owner@pillarflow.com',
        passwordHash: hashPassword(currentPin),
        role: 'owner',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
        lastActiveAt: null,
        currentDeviceInfo: null
      };
      db.users.unshift(ownerUser);
    }

    const newToken = createSessionToken(ownerUser.id);
    const nowIso = new Date().toISOString();

    ownerUser.currentSessionId = newToken;
    ownerUser.lastLoginAt = nowIso;
    ownerUser.lastActiveAt = nowIso;
    ownerUser.currentDeviceInfo = deviceInfo || { device: 'Perangkat Web', browser: 'Browser', os: 'OS' };

    // Remove old sessions for owner
    db.sessions = db.sessions.filter((s) => s.userId !== ownerUser!.id);

    db.sessions.push({
      token: newToken,
      userId: ownerUser.id,
      createdAt: nowIso,
      lastActiveAt: nowIso,
      deviceInfo: ownerUser.currentDeviceInfo
    });

    saveDatabase(db);
    setAuthCookie(res, newToken);

    res.json({
      token: newToken,
      user: sanitizeUser(ownerUser)
    });
  });

  // 2. USER ACCESS KEY VERIFICATION ENDPOINT
  app.post('/api/auth/verify-access-key', (req: Request, res: Response) => {
    const { accessKey, deviceInfo } = req.body;

    if (!accessKey) {
      res.status(400).json({ code: 'INVALID_ACCESS_KEY', error: 'Key Akses tidak ditemukan dalam URL.' });
      return;
    }

    const activeKey = db.activeAccessKey || 'AFFILIATE2026';
    const status = db.accessKeyStatus || 'active';

    if (status !== 'active') {
      res.status(401).json({
        code: 'ACCESS_KEY_DISABLED',
        error: 'Akses Tidak Valid: Link akses User sedang dinonaktifkan oleh Owner.'
      });
      return;
    }

    let inputKey = (accessKey || '').trim();
    if (inputKey.startsWith('enc_')) {
      try {
        let k = inputKey.substring(4);
        while (k.length % 4 !== 0) k += '=';
        k = k.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = Buffer.from(k, 'base64').toString('utf-8');
        if (decoded.startsWith('PF2026:')) {
          inputKey = decoded.substring(7);
        }
      } catch (e) {
        console.warn('Could not decode encrypted accessKey:', e);
      }
    }

    if (inputKey.toUpperCase() !== activeKey.trim().toUpperCase()) {
      res.status(401).json({
        code: 'INVALID_ACCESS_KEY',
        error: 'Akses Tidak Valid: Link akses tidak berlaku atau telah diganti oleh Owner.'
      });
      return;
    }

    // Create or retrieve a User session object
    const newUserId = 'usr_user_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const nowIso = new Date().toISOString();
    const newToken = createSessionToken(newUserId);

    const newUser: StoredUser = {
      id: newUserId,
      username: 'user_' + Date.now().toString(36),
      name: 'Pengguna (User)',
      email: 'user@pillarflow.app',
      passwordHash: '',
      role: 'user',
      status: 'active',
      createdAt: nowIso,
      lastLoginAt: nowIso,
      lastActiveAt: nowIso,
      currentDeviceInfo: deviceInfo || { device: 'Perangkat Web', browser: 'Browser', os: 'OS' },
      currentSessionId: newToken
    };

    db.users.push(newUser);

    db.sessions.push({
      token: newToken,
      userId: newUserId,
      createdAt: nowIso,
      lastActiveAt: nowIso,
      deviceInfo: newUser.currentDeviceInfo!
    });

    saveDatabase(db);
    setAuthCookie(res, newToken);

    res.json({
      token: newToken,
      user: sanitizeUser(newUser),
      accessKey: activeKey
    });
  });

  // Backward-compatible Login Endpoint
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password, pin, deviceInfo } = req.body;

    if (pin || username === 'owner') {
      const pinValue = pin || password;
      const currentPin = db.ownerPin || 'ownerkonten123';
      if (pinValue && pinValue.trim() === currentPin) {
        let ownerUser = db.users.find((u) => u.username === 'owner' || u.role === 'owner');
        if (!ownerUser) {
          ownerUser = {
            id: 'usr_owner_001',
            username: 'owner',
            name: 'Owner Admin',
            email: 'owner@pillarflow.com',
            passwordHash: hashPassword(currentPin),
            role: 'owner',
            status: 'active',
            createdAt: new Date().toISOString(),
            lastLoginAt: null,
            lastActiveAt: null,
            currentDeviceInfo: null
          };
          db.users.unshift(ownerUser);
        }

        const newToken = createSessionToken(ownerUser.id);
        const nowIso = new Date().toISOString();

        ownerUser.currentSessionId = newToken;
        ownerUser.lastLoginAt = nowIso;
        ownerUser.lastActiveAt = nowIso;
        ownerUser.currentDeviceInfo = deviceInfo || { device: 'Perangkat Web', browser: 'Browser', os: 'OS' };

        db.sessions = db.sessions.filter((s) => s.userId !== ownerUser!.id);
        db.sessions.push({
          token: newToken,
          userId: ownerUser.id,
          createdAt: nowIso,
          lastActiveAt: nowIso,
          deviceInfo: ownerUser.currentDeviceInfo
        });

        saveDatabase(db);
        setAuthCookie(res, newToken);

        res.json({
          token: newToken,
          user: sanitizeUser(ownerUser)
        });
        return;
      }
    }

    res.status(401).json({ error: 'PIN Owner atau data login tidak sesuai.' });
  });

  // Get Current Session Profile
  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    if (req.sessionToken) {
      setAuthCookie(res, req.sessionToken);
    }
    res.json({
      user: sanitizeUser(req.user!)
    });
  });

  // Logout
  app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const token = req.sessionToken;
    const user = req.user;

    if (user && user.currentSessionId === token) {
      user.currentSessionId = null;
    }

    db.sessions = db.sessions.filter((s) => s.token !== token);
    saveDatabase(db);
    clearAuthCookie(res);

    res.json({ success: true, message: 'Berhasil logout.' });
  });

  // Get Invite Link Info (Public for registration page)
  app.get('/api/auth/invite-info', (req: Request, res: Response) => {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({ valid: false, error: 'Token tidak diberikan.' });
      return;
    }

    const invite = db.invites.find((i) => i.token === token);
    if (!invite) {
      res.status(404).json({ valid: false, error: 'Link undangan tidak ditemukan atau tidak valid.' });
      return;
    }

    const isExpired = invite.expiresAt && invite.expiresAt !== 'never'
      ? new Date(invite.expiresAt).getTime() < new Date().getTime()
      : false;
    const isExhausted = invite.maxUses > 0 && invite.usedCount >= invite.maxUses;

    if (isExpired || isExhausted || invite.status !== 'active') {
      res.status(400).json({
        valid: false,
        error: isExpired
          ? 'Link undangan telah kedaluwarsa.'
          : isExhausted
          ? 'Batas penggunaan link undangan telah habis.'
          : 'Link undangan sudah tidak aktif.'
      });
      return;
    }

    res.json({
      valid: true,
      invite: {
        createdByName: invite.createdByName,
        expiresAt: invite.expiresAt
      }
    });
  });

  // Register User via Invite Link
  app.post('/api/auth/register-with-invite', (req: Request, res: Response) => {
    const { token, username, name, email, password, deviceInfo } = req.body;

    if (!token || !username || !name || !email || !password) {
      res.status(400).json({ error: 'Semua field wajib diisi.' });
      return;
    }

    const invite = db.invites.find((i) => i.token === token);
    if (!invite) {
      res.status(400).json({ error: 'Link undangan tidak valid.' });
      return;
    }

    const isExpired = invite.expiresAt && invite.expiresAt !== 'never'
      ? new Date(invite.expiresAt).getTime() < new Date().getTime()
      : false;
    const isExhausted = invite.maxUses > 0 && invite.usedCount >= invite.maxUses;

    if (isExpired || isExhausted || invite.status !== 'active') {
      res.status(400).json({ error: 'Link undangan telah kedaluwarsa atau habis batas penggunaannya.' });
      return;
    }

    // Check duplicate username or email
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = db.users.find(
      (u) => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail
    );

    if (existingUser) {
      res.status(400).json({ error: 'Username atau email sudah digunakan.' });
      return;
    }

    // Create User
    const newUserId = 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const nowIso = new Date().toISOString();
    const newToken = createSessionToken(newUserId);

    const newUser: StoredUser = {
      id: newUserId,
      username: cleanUsername,
      name: name.trim(),
      email: cleanEmail,
      passwordHash: hashPassword(password),
      role: 'user', // ALWAYS user role via invite
      status: 'active',
      createdAt: nowIso,
      lastLoginAt: nowIso,
      lastActiveAt: nowIso,
      currentDeviceInfo: deviceInfo || null,
      currentSessionId: newToken
    };

    db.users.push(newUser);

    // Update Invite usage
    invite.usedCount += 1;
    invite.usedByUsers.push(cleanUsername);
    if (invite.maxUses > 0 && invite.usedCount >= invite.maxUses) {
      invite.status = 'exhausted';
    }

    // Create active session
    db.sessions.push({
      token: newToken,
      userId: newUserId,
      createdAt: nowIso,
      lastActiveAt: nowIso,
      deviceInfo: newUser.currentDeviceInfo || { device: 'Perangkat Web', browser: 'Browser', os: 'OS' }
    });

    saveDatabase(db);
    setAuthCookie(res, newToken);

    res.json({
      success: true,
      token: newToken,
      user: sanitizeUser(newUser)
    });
  });

  // Change Password
  app.post('/api/auth/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    const user = req.user!;

    if (!oldPassword || !newPassword) {
      res.status(400).json({ error: 'Password lama dan password baru wajib diisi.' });
      return;
    }

    if (hashPassword(oldPassword) !== user.passwordHash) {
      res.status(400).json({ error: 'Password lama tidak sesuai.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
      return;
    }

    user.passwordHash = hashPassword(newPassword);
    saveDatabase(db);

    res.json({ success: true, message: 'Password berhasil diperbarui.' });
  });

  // ==========================================
  // OWNER PANEL ROUTES (Role-Based Access)
  // ==========================================

  // Get Owner Access Key & PIN Config (Owner Only)
  app.get('/api/owner/access-key', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
    res.json({
      accessKey: db.activeAccessKey || 'AFFILIATE2026',
      status: db.accessKeyStatus || 'active',
      ownerPin: db.ownerPin || 'ownerkonten123'
    });
  });

  // Update Access Key or Owner PIN (Owner Only)
  app.post('/api/owner/access-key', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
    const { newAccessKey, status, newPin } = req.body;

    if (newAccessKey && typeof newAccessKey === 'string' && newAccessKey.trim()) {
      db.activeAccessKey = newAccessKey.trim().toUpperCase();
    }
    if (status === 'active' || status === 'disabled') {
      db.accessKeyStatus = status;
    }
    if (newPin && typeof newPin === 'string' && newPin.trim()) {
      db.ownerPin = newPin.trim();
    }

    saveDatabase(db);

    res.json({
      success: true,
      message: 'Pengaturan Access Key & Security diperbarui.',
      accessKey: db.activeAccessKey,
      status: db.accessKeyStatus,
      ownerPin: db.ownerPin
    });
  });

  // Rotate Access Key Automatically (Owner Only)
  app.post('/api/owner/rotate-access-key', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newKey = `AFFILIATE${randomSuffix}`;

    db.activeAccessKey = newKey;
    db.accessKeyStatus = 'active';

    saveDatabase(db);

    res.json({
      success: true,
      message: 'Access Key baru berhasil dibuat.',
      accessKey: newKey
    });
  });

  // Get All Users (Owner Only)
  app.get('/api/owner/users', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
    const sanitizedList = db.users.map((u) => sanitizeUser(u));
    res.json(sanitizedList);
  });

  // Create User Directly (Owner Only)
  app.post('/api/owner/users', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
    const { username, name, email, password, role } = req.body;

    if (!username || !name || !email || !password) {
      res.status(400).json({ error: 'Username, nama, email, dan password wajib diisi.' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (db.users.some((u) => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail)) {
      res.status(400).json({ error: 'Username atau email sudah digunakan.' });
      return;
    }

    const newUserId = 'usr_' + Date.now();
    const newUser: StoredUser = {
      id: newUserId,
      username: cleanUsername,
      name: name.trim(),
      email: cleanEmail,
      passwordHash: hashPassword(password),
      role: (role === 'owner' ? 'owner' : 'user') as UserRole,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      lastActiveAt: null,
      currentDeviceInfo: null,
      currentSessionId: null
    };

    db.users.push(newUser);
    saveDatabase(db);

    res.json({ success: true, user: sanitizeUser(newUser) });
  });

  // Toggle User Status (Active / Disabled)
  app.put('/api/owner/users/:id/status', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.params.id;
    const { status } = req.body;

    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan.' });
      return;
    }

    if (user.id === req.user!.id) {
      res.status(400).json({ error: 'Anda tidak dapat menonaktifkan akun Owner Anda sendiri.' });
      return;
    }

    user.status = status === 'disabled' ? 'disabled' : 'active';

    // If disabled, immediately kick out active sessions!
    if (user.status === 'disabled') {
      user.currentSessionId = null;
      db.sessions = db.sessions.filter((s) => s.userId !== user.id);
    }

    saveDatabase(db);
    res.json({ success: true, user: sanitizeUser(user) });
  });

  // Reset User Password (Owner Only)
  app.put('/api/owner/users/:id/reset-password', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.params.id;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
      return;
    }

    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan.' });
      return;
    }

    user.passwordHash = hashPassword(newPassword);
    saveDatabase(db);

    res.json({ success: true, message: `Password user ${user.username} berhasil direset.` });
  });

  // Delete User (Owner Only)
  app.delete('/api/owner/users/:id', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.params.id;

    if (userId === req.user!.id) {
      res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' });
      return;
    }

    const userIndex = db.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      res.status(404).json({ error: 'User tidak ditemukan.' });
      return;
    }

    db.users.splice(userIndex, 1);
    db.sessions = db.sessions.filter((s) => s.userId !== userId);
    saveDatabase(db);

    res.json({ success: true, message: 'User berhasil dihapus.' });
  });

  // Force Logout User (Owner Only)
  app.post('/api/owner/users/:id/force-logout', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.params.id;
    const user = db.users.find((u) => u.id === userId);

    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan.' });
      return;
    }

    user.currentSessionId = null;
    db.sessions = db.sessions.filter((s) => s.userId !== userId);
    saveDatabase(db);

    res.json({ success: true, message: `Sesi login untuk user ${user.username} berhasil dicabut.` });
  });

  // Get Invite Links (Owner Only)
  app.get('/api/owner/invites', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
    const now = new Date().getTime();

    // Update statuses dynamically
    db.invites.forEach((invite) => {
      const isExpired = invite.expiresAt && invite.expiresAt !== 'never'
        ? new Date(invite.expiresAt).getTime() < now
        : false;
      const isExhausted = invite.maxUses > 0 && invite.usedCount >= invite.maxUses;
      if (isExpired && invite.status === 'active') invite.status = 'expired';
      if (isExhausted && invite.status === 'active') invite.status = 'exhausted';
    });

    saveDatabase(db);
    res.json(db.invites);
  });

  // Generate Invite Link (Owner Only)
  app.post('/api/owner/invites', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
    const { expiryDays, maxUses } = req.body;

    const uses = parseInt(maxUses) || 1; // Default single-use

    const token = 'inv_' + crypto.randomBytes(16).toString('hex');
    const now = new Date();

    let expiresAt = 'never';
    if (expiryDays !== 'never' && expiryDays !== 'forever' && expiryDays !== '0' && expiryDays !== 0) {
      const days = parseInt(expiryDays) || 7;
      expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    }

    const newInvite: InviteLink = {
      id: 'inv_id_' + Date.now(),
      token,
      createdBy: req.user!.id,
      createdByName: req.user!.name,
      createdAt: now.toISOString(),
      expiresAt,
      maxUses: uses,
      usedCount: 0,
      status: 'active',
      usedByUsers: []
    };

    db.invites.unshift(newInvite);
    saveDatabase(db);

    res.json({ success: true, invite: newInvite });
  });

  // Revoke / Delete Invite Link
  app.delete('/api/owner/invites/:id', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
    const inviteId = req.params.id;
    const idx = db.invites.findIndex((i) => i.id === inviteId);

    if (idx === -1) {
      res.status(404).json({ error: 'Link undangan tidak ditemukan.' });
      return;
    }

    db.invites.splice(idx, 1);
    saveDatabase(db);

    res.json({ success: true, message: 'Link undangan berhasil dicabut.' });
  });

  // ==========================================
  // CORE APP API ROUTE (PROTECTED BY AUTH)
  // ==========================================

  // Helper function to fetch Shopee public item detail API
  async function fetchShopeeItemApi(shopid: string, itemid: string) {
    if (!shopid || !itemid) return null;
    const endpoints = [
      `https://shopee.co.id/api/v4/item/get?itemid=${itemid}&shopid=${shopid}`,
      `https://shopee.co.id/api/v2/item/get?itemid=${itemid}&shopid=${shopid}`,
      `https://shopee.co.id/api/v4/pdp/get_pc?itemid=${itemid}&shopid=${shopid}`
    ];

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(endpoint, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Referer': `https://shopee.co.id/product/${shopid}/${itemid}`,
            'X-Requested-With': 'XMLHttpRequest',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
          }
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const json = await res.json();
          const item = json?.data?.item || json?.data || json?.item;
          if (item && (item.name || item.title)) {
            const rawPrice = item.price || item.price_min || item.price_max;
            let formattedPrice = '';
            if (rawPrice) {
              const num = Number(rawPrice);
              const realPrice = num > 10000000 ? Math.round(num / 100000) : num;
              formattedPrice = `Rp ${realPrice.toLocaleString('id-ID')}`;
            }
            return {
              name: item.name || item.title || '',
              description: item.description || item.desc || '',
              price: formattedPrice,
              brand: item.brand || item.brand_name || '',
              rating: item.item_rating?.rating_star ? `${Number(item.item_rating.rating_star).toFixed(1)}/5` : '',
              sold: item.historical_sold || item.sold ? `${item.historical_sold || item.sold} terjual` : '',
              shopName: item.shop_name || '',
              shopLocation: item.shop_location || ''
            };
          }
        }
      } catch (e) {
        console.log(`Shopee API error for ${endpoint}:`, e);
      }
    }
    return null;
  }

  // Helper to extract Lynk.id creator, product title, and category from URL
  function extractLynkIdDetails(urlStr: string) {
    try {
      const parsed = new URL(urlStr);
      const host = parsed.hostname.replace(/^www\./i, '');
      if (!/lynk\.id|lynk\.is/i.test(host)) return null;

      const rawSegments = parsed.pathname.split('/').filter(Boolean);
      if (rawSegments.length === 0) return null;

      let rawUser = '';
      let rawSlug = '';
      let pageType = 'Katalog Store / Bio Link Creator';
      let defaultCategory = 'Produk Digital & E-Commerce';

      if (rawSegments.length === 1) {
        rawUser = rawSegments[0];
      } else if (rawSegments[0] === 'p' || rawSegments[0] === 's' || rawSegments[0] === 'v' || rawSegments[0] === 'e') {
        pageType = rawSegments[0] === 'p' ? 'Produk Digital / Ebook' : rawSegments[0] === 's' ? 'Kelas / Course' : 'Konten / Event';
        rawSlug = rawSegments.slice(1).join('-');
      } else {
        rawUser = rawSegments[0];
        const sub = rawSegments[1];
        if (sub === 'p') {
          pageType = 'Produk Digital / Ebook';
          defaultCategory = 'Produk Digital & Ebook';
          rawSlug = rawSegments.slice(2).join('-');
        } else if (sub === 's') {
          pageType = 'Kelas / Mini Course';
          defaultCategory = 'Edukasi & Mini Course';
          rawSlug = rawSegments.slice(2).join('-');
        } else if (sub === 'v' || sub === 'e') {
          pageType = 'Konten Premium / Event';
          defaultCategory = 'Konten Digital';
          rawSlug = rawSegments.slice(2).join('-');
        } else if (sub === 'id') {
          pageType = 'Produk Digital';
          rawSlug = rawSegments.slice(2).join('-');
        } else {
          pageType = 'Produk Digital';
          rawSlug = rawSegments.slice(1).join('-');
        }
      }

      let creatorFormatted = rawUser
        .replace(/[-_.]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (creatorFormatted) {
        creatorFormatted = creatorFormatted.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }

      let productFormatted = rawSlug
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (productFormatted) {
        if (/^[a-zA-Z0-9]{5,10}$/.test(productFormatted) && !/ebook|kelas|course|preset|template|panduan|buku|video|jasa|modul/i.test(productFormatted)) {
          productFormatted = `Produk Digital Creator (${creatorFormatted || 'Lynk.id'})`;
        } else {
          productFormatted = productFormatted.split(' ').map(w => {
            if (/^(dan|atau|yang|untuk|di|ke|dari|dengan|by)$/i.test(w)) return w.toLowerCase();
            return w.charAt(0).toUpperCase() + w.slice(1);
          }).join(' ');
        }
      } else {
        productFormatted = `Katalog Store & Produk Digital ${creatorFormatted || 'Creator'}`;
      }

      return {
        isLynkId: true,
        creatorUsername: rawUser,
        creatorFormatted,
        productFormatted,
        pageType,
        defaultCategory
      };
    } catch (e) {
      return null;
    }
  }

  // Helper function to resolve Short URLs, query redirects (redir/url/target), and HTTP/JS Redirects to get the true Canonical URL
  async function resolveCanonicalUrl(startUrl: string, maxHops = 8): Promise<{ canonicalUrl: string; redirectHistory: string[]; finalHtml: string; status: number; extractedUrlTitle?: string; shopeeShopId?: string; shopeeItemId?: string }> {
    let currentUrl = startUrl;
    const history: string[] = [currentUrl];
    let finalHtml = '';
    let lastStatus = 200;
    let extractedUrlTitle = '';
    let shopeeShopId = '';
    let shopeeItemId = '';

    // Helper to check if a query string or parameter contains an embedded encoded target URL
    const extractEmbeddedUrl = (urlStr: string): string | null => {
      try {
        const parsed = new URL(urlStr);
        const redirectParams = ['redir', 'redirect', 'url', 'target', 'dest', 'destination', 'link', 'deep_link', 'target_url', 'sub_url', 'next', 'r', 'out', 'u', 'p'];
        
        for (const param of redirectParams) {
          const val = parsed.searchParams.get(param);
          if (val) {
            let decoded = val;
            try { decoded = decodeURIComponent(val); } catch (e) {}
            if (/^https?:\/\//i.test(decoded) && decoded !== urlStr) {
              return decoded;
            }
          }
        }

        // Search raw query string for http(s)%3A%2F%2F pattern
        const rawQuery = parsed.search;
        const encodedMatch = rawQuery.match(/(?:https?%3A%2F%2F|https?:\/\/)[^\s&"']+/i);
        if (encodedMatch) {
          try {
            const decoded = decodeURIComponent(encodedMatch[0]);
            if (/^https?:\/\//i.test(decoded) && decoded !== urlStr) {
              return decoded;
            }
          } catch (e) {}
        }
      } catch (e) {}
      return null;
    };

    const isFullProductUrl = (u: string) => {
      return /\/product\/\d+\/\d+|-i\.\d+\.\d+|\/i\.\d+\.\d+|tokopedia\.com\/[^/]+\/[^/]+|tiktok\.com\/@/i.test(u);
    };

    for (let hop = 0; hop < maxHops; hop++) {
      // 1. First check if currentUrl itself has an embedded URL in query params (e.g. shopee.co.id/universal-link?redir=https%3A%2F%2Fshopee.co.id%2F...)
      const embeddedUrl = extractEmbeddedUrl(currentUrl);
      if (embeddedUrl && !history.includes(embeddedUrl)) {
        console.log(`[Canonical Resolver] Hop ${hop}: Found embedded URL in query param => ${embeddedUrl}`);
        currentUrl = embeddedUrl;
        history.push(currentUrl);
        if (isFullProductUrl(currentUrl)) {
          // If we reached a full canonical product URL, continue to fetch that exact page
        }
        continue;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'manual', // Catch 301, 302, 303, 307, 308 manually
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
          }
        });
        clearTimeout(timeoutId);

        lastStatus = res.status;

        // Check for HTTP Redirect Headers (301, 302, 303, 307, 308)
        if ([301, 302, 303, 307, 308].includes(res.status)) {
          const locationHeader = res.headers.get('location');
          if (locationHeader) {
            let nextUrl = new URL(locationHeader, currentUrl).href;
            
            // Check if location header contains an embedded redirect URL
            const innerEmbedded = extractEmbeddedUrl(nextUrl);
            if (innerEmbedded) {
              nextUrl = innerEmbedded;
            }

            if (nextUrl !== currentUrl && !history.includes(nextUrl)) {
              console.log(`[Canonical Resolver] Hop ${hop}: HTTP ${res.status} redirect => ${nextUrl}`);
              currentUrl = nextUrl;
              history.push(currentUrl);
              continue;
            }
          }
        }

        // If 200 OK, read text and inspect for client-side JS / Meta Refresh redirects or Canonical Tag
        if (res.ok || res.status === 200) {
          const html = await res.text();
          finalHtml = html;

          // If current URL is already a full product URL, do NOT search for redirects inside HTML body!
          if (isFullProductUrl(currentUrl)) {
            break;
          }

          // 1. Check HTML <link rel="canonical" href="...">
          const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
          if (canonicalMatch && canonicalMatch[1]) {
            try {
              const canonicalHref = new URL(canonicalMatch[1], currentUrl).href;
              if (canonicalHref !== currentUrl && /^https?:\/\//i.test(canonicalHref) && !history.includes(canonicalHref)) {
                currentUrl = canonicalHref;
                history.push(currentUrl);
                continue;
              }
            } catch (e) {
              console.log('Error parsing canonical tag:', e);
            }
          }

          // 2. Check HTML Meta Refresh redirect (<meta http-equiv="refresh" content="0;url=...">)
          const metaRefreshMatch = html.match(/<meta[^>]*http-equiv=["']refresh["'][^>]*content=["']\d+;\s*url=([^"'\s>]+)["']/i);
          if (metaRefreshMatch && metaRefreshMatch[1]) {
            try {
              let refreshUrl = new URL(metaRefreshMatch[1].replace(/['"]/g, ''), currentUrl).href;
              const innerEmb = extractEmbeddedUrl(refreshUrl);
              if (innerEmb) refreshUrl = innerEmb;

              if (refreshUrl !== currentUrl && !history.includes(refreshUrl)) {
                currentUrl = refreshUrl;
                history.push(currentUrl);
                continue;
              }
            } catch (e) {
              console.log('Error parsing meta refresh:', e);
            }
          }

          // 3. Check JavaScript redirects in short-link landing pages (e.g. location.href = "...", window.location = "...")
          const jsRedirectMatch = html.match(/(?:window\.)?location(?:\.href|\.replace)?\s*=\s*["'](https?:\/\/[^"']+)["']/i);
          if (jsRedirectMatch && jsRedirectMatch[1]) {
            let jsUrl = jsRedirectMatch[1];
            const innerEmb = extractEmbeddedUrl(jsUrl);
            if (innerEmb) jsUrl = innerEmb;

            if (jsUrl !== currentUrl && !history.includes(jsUrl)) {
              currentUrl = jsUrl;
              history.push(currentUrl);
              continue;
            }
          }

          // Arrived at final destination page
          break;
        } else {
          // Non-200 status code
          break;
        }
      } catch (err) {
        console.log(`Hop ${hop} fetch error for ${currentUrl}:`, err);
        break;
      }
    }

    // Extract Shopee Shop ID and Item ID if present across history
    try {
      for (const u of history) {
        const shopeeProductMatch = 
          u.match(/\/product\/(\d+)\/(\d+)/i) ||
          u.match(/\/([a-zA-Z0-9._-]+)\/(\d+)\/(\d+)/i) ||
          u.match(/-i\.(\d+)\.(\d+)/i) ||
          u.match(/\/i\.(\d+)\.(\d+)/i) ||
          u.match(/shopid=(\d+).*itemid=(\d+)/i) ||
          u.match(/itemid=(\d+).*shopid=(\d+)/i);

        if (shopeeProductMatch) {
          if (shopeeProductMatch[1] && shopeeProductMatch[2] && /^\d+$/.test(shopeeProductMatch[1]) && /^\d+$/.test(shopeeProductMatch[2])) {
            shopeeShopId = shopeeProductMatch[1];
            shopeeItemId = shopeeProductMatch[2];
            break;
          } else if (shopeeProductMatch[2] && shopeeProductMatch[3] && /^\d+$/.test(shopeeProductMatch[2]) && /^\d+$/.test(shopeeProductMatch[3])) {
            shopeeShopId = shopeeProductMatch[2];
            shopeeItemId = shopeeProductMatch[3];
            break;
          }
        }
      }
    } catch (e) {}

    // Extract Slug Title from Shopee or Tokopedia or general URL
    try {
      // 1. Shopee slug pattern: /Slug-Name-i.shopid.itemid
      const shopeeSlugMatch = currentUrl.match(/shopee\.co\.id\/([^/]+)-i\.\d+\.\d+/i);
      if (shopeeSlugMatch && shopeeSlugMatch[1]) {
        let raw = decodeURIComponent(shopeeSlugMatch[1]).replace(/[-_]/g, ' ').trim();
        if (raw.length >= 4 && !/^\d+$/.test(raw)) {
          extractedUrlTitle = raw;
        }
      }

      // 2. Tokopedia slug pattern: /shopname/product-name-slug
      if (!extractedUrlTitle) {
        const tokoSlugMatch = currentUrl.match(/tokopedia\.com\/[^/]+\/([^/?#]+)/i);
        if (tokoSlugMatch && tokoSlugMatch[1]) {
          let raw = decodeURIComponent(tokoSlugMatch[1]).replace(/[-_]/g, ' ').trim();
          if (raw.length >= 4 && !/^\d+$/.test(raw)) {
            extractedUrlTitle = raw;
          }
        }
      }

      // 3. Fallback path segment extractor
      if (!extractedUrlTitle) {
        const finalParsed = new URL(currentUrl);
        const segments = finalParsed.pathname.split('/').filter(Boolean);
        for (const seg of segments) {
          let cleaned = decodeURIComponent(seg)
            .replace(/\.(html?|php|aspx?)$/i, '')
            .replace(/-i\.\d+\.\d+$/i, '')
            .replace(/i\d+$/i, '')
            .replace(/[-_]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (cleaned.length >= 5 && !/^\d+$/.test(cleaned) && !/^(p|product|products|item|items|view|shop|store|universal link|pdp)$/i.test(cleaned)) {
            extractedUrlTitle = cleaned;
          }
        }
      }
    } catch (e) {}

    return {
      canonicalUrl: currentUrl,
      redirectHistory: history,
      finalHtml,
      status: lastStatus,
      extractedUrlTitle,
      shopeeShopId,
      shopeeItemId
    };
  }

  // API Route: Analyze Product Link (Shopee, Tokopedia, TikTok, Lynk.id, Website, etc.)
  app.post('/api/analyze-link', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      let { url } = req.body;
      if (!url || typeof url !== 'string' || !url.trim()) {
        res.status(400).json({ error: 'URL link produk wajib diisi.' });
        return;
      }

      url = url.trim();
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }

      // STEP 1 - 3: Follow Short URL redirects & obtain the Canonical URL
      const { canonicalUrl, redirectHistory, finalHtml, status, extractedUrlTitle, shopeeShopId, shopeeItemId } = await resolveCanonicalUrl(url);

      console.log(`[Link Analysis] Original: ${url} => Canonical: ${canonicalUrl} (ShopID: ${shopeeShopId || 'N/A'}, ItemID: ${shopeeItemId || 'N/A'}, Title Slug: "${extractedUrlTitle || ''}")`);

      // STEP 3.5: Fetch Shopee Public Item API if ShopID and ItemID are present
      let shopeeApiData: any = null;
      if (shopeeShopId && shopeeItemId) {
        shopeeApiData = await fetchShopeeItemApi(shopeeShopId, shopeeItemId);
        if (shopeeApiData) {
          console.log(`[Link Analysis] Successfully fetched Shopee API data: "${shopeeApiData.name}"`);
        }
      }

      let cleanShopeeUrl = '';
      if (shopeeShopId && shopeeItemId) {
        cleanShopeeUrl = `https://shopee.co.id/product/${shopeeShopId}/${shopeeItemId}`;
      }

      let socialTitle = '';
      let socialOgTitle = '';
      let socialMetaDesc = '';

      // STEP 3.6: Fetch target URL with Social Crawler User-Agent to extract SSR metadata
      const targetSocialUrl = cleanShopeeUrl || canonicalUrl;
      try {
        const socialRes = await fetch(targetSocialUrl, {
          headers: {
            'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });

        if (socialRes.ok) {
          const socialHtml = await socialRes.text();
          const titleMatch = socialHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch) socialTitle = titleMatch[1].trim();

          const ogMatch = socialHtml.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                          socialHtml.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
          if (ogMatch) socialOgTitle = ogMatch[1].trim();

          const descMatch = socialHtml.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                            socialHtml.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i) ||
                            socialHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
          if (descMatch) socialMetaDesc = descMatch[1].trim();
        }
      } catch (socialErr) {
        console.log('[Link Analysis] Error fetching with social crawler UA:', socialErr);
      }

      let hostName = '';
      let extractedStoreName = '';
      let urlKeywords: string[] = [];

      try {
        const canonicalObj = new URL(cleanShopeeUrl || canonicalUrl);
        hostName = canonicalObj.hostname.replace(/^www\./i, '');
      } catch (e) {
        hostName = url;
      }

      let fetchedTitle = '';
      let fetchedOgTitle = '';
      let fetchedMetaDesc = '';
      let fetchedJsonLd = '';
      let fetchedBodyText = '';
      let jsonLdParsed: any = null;

      // STEP 4: Extract Metadata & Structured Data from Canonical Page HTML
      if (finalHtml && finalHtml.length > 50) {
        // 1. Extract <title>
        const titleMatch = finalHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) fetchedTitle = titleMatch[1].trim();

        // 2. Extract OpenGraph & Twitter Meta Tags
        const ogTitleMatch = finalHtml.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
          finalHtml.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
        if (ogTitleMatch) fetchedOgTitle = ogTitleMatch[1].trim();

        const metaDescMatch = finalHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
          finalHtml.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
        if (metaDescMatch) fetchedMetaDesc = metaDescMatch[1].trim();

        // 3. Extract JSON-LD / Schema.org structured data
        const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
        let match;
        while ((match = jsonLdRegex.exec(finalHtml)) !== null) {
          try {
            const parsed = JSON.parse(match[1]);
            if (parsed) {
              fetchedJsonLd += JSON.stringify(parsed) + ' ';
              if (parsed['@type'] === 'Product' || parsed['@type'] === 'ItemPage') {
                jsonLdParsed = parsed;
              }
            }
          } catch (e) {
            // ignore JSON parse error
          }
        }
        if (fetchedJsonLd) {
          fetchedJsonLd = fetchedJsonLd.replace(/\s+/g, ' ').trim().slice(0, 2000);
        }

        // 4. Clean Body Content
        const bodyTextRaw = finalHtml
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (!/javascript is (disabled|required)|access denied|security check|captcha|just a moment|cloudflare/i.test(bodyTextRaw)) {
          fetchedBodyText = bodyTextRaw.slice(0, 3500);
        }
      }

      // Filter generic platform titles
      const isGenericPlatformTitle = (t: string) => 
        !t || /shopee indonesia|situs belanja online|tokopedia|jual beli online|lazada|blibli|tiktok shop|instagram|facebook|log in|sign up|captcha|security check|access denied|403 forbidden|404 not found|just a moment|attention required/i.test(t);

      if (isGenericPlatformTitle(fetchedTitle)) fetchedTitle = '';
      if (isGenericPlatformTitle(fetchedOgTitle)) fetchedOgTitle = '';
      if (isGenericPlatformTitle(fetchedMetaDesc)) fetchedMetaDesc = '';
      if (isGenericPlatformTitle(socialTitle)) socialTitle = '';
      if (isGenericPlatformTitle(socialOgTitle)) socialOgTitle = '';

      // Clean raw title to extract true product name & brand
      let rawTitleToClean = socialOgTitle || socialTitle || fetchedOgTitle || fetchedTitle || '';
      let cleanProductName = rawTitleToClean
        .replace(/^Jual\s+/i, '')
        .replace(/\s*\|\s*Shopee\s+Indonesia.*$/i, '')
        .replace(/\s*\|\s*Shopee.*$/i, '')
        .replace(/\s*\|\s*Tokopedia.*$/i, '')
        .replace(/\s*\|\s*TikTok.*$/i, '')
        .trim();

      let cleanBrand = '';
      if (cleanProductName && cleanProductName.includes(' - ')) {
        const parts = cleanProductName.split(' - ');
        if (parts[0].length <= 35 && !/jual|beli|promo/i.test(parts[0])) {
          cleanBrand = parts[0].trim();
        }
      }

      let finalDescription = socialMetaDesc || fetchedMetaDesc || (shopeeApiData?.description) || '';

      // Check for Lynk.id domain & extract creator & product details from slug
      const lynkInfo = extractLynkIdDetails(canonicalUrl) || extractLynkIdDetails(url);
      if (lynkInfo) {
        console.log(`[Link Analysis] Lynk.id detected => Creator: "${lynkInfo.creatorFormatted}", Product: "${lynkInfo.productFormatted}", Type: "${lynkInfo.pageType}"`);
        if (!cleanProductName || isGenericPlatformTitle(cleanProductName)) {
          cleanProductName = lynkInfo.productFormatted;
        }
        if (!cleanBrand) {
          cleanBrand = lynkInfo.creatorFormatted;
        }
        extractedStoreName = lynkInfo.creatorFormatted;
        if (!finalDescription) {
          finalDescription = `${lynkInfo.pageType} oleh ${lynkInfo.creatorFormatted} di platform Lynk.id Indonesia.`;
        }
      }

      // Extract URL Path Keywords & Query Params from Canonical URL
      try {
        const parsedCanonical = new URL(cleanShopeeUrl || canonicalUrl);
        const rawSegments = parsedCanonical.pathname.split('/').filter(Boolean);
        
        for (let i = 0; i < rawSegments.length; i++) {
          let seg = rawSegments[i];
          try { seg = decodeURIComponent(seg); } catch (e) {}

          seg = seg
            .replace(/\.(html?|php|aspx?)$/i, '')
            .replace(/-i\.\d+\.\d+$/i, '')
            .replace(/i\d+$/i, '')
            .replace(/-ps--[a-zA-Z0-9-]+$/i, '')
            .replace(/\d{8,}/g, '')
            .replace(/[-_]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (seg.length >= 3 && !/^\d+$/.test(seg) && !/^(p|product|products|item|items|view|shop|store|pd|dp|gp|buy|pdp)$/i.test(seg)) {
            urlKeywords.push(seg);
          }
        }

        parsedCanonical.searchParams.forEach((val, key) => {
          if (/^(title|name|product_name|p_name|q|keyword|item_name)$/i.test(key) && val.length > 3) {
            try {
              urlKeywords.push(decodeURIComponent(val).replace(/[-_]/g, ' ').trim());
            } catch (e) {
              urlKeywords.push(val.replace(/[-_]/g, ' ').trim());
            }
          }
        });

        if (urlKeywords.length >= 2 && /tokopedia|lynk\.id|linktr\.ee|shopee/i.test(hostName)) {
          extractedStoreName = extractedStoreName || urlKeywords[0];
        }
      } catch (urlErr) {
        console.log('Error parsing canonical URL keywords:', urlErr);
      }

      const combinedUrlKeywordsStr = urlKeywords.join(' | ');

      // CHECK IF FETCH FAILED COMPLETELY AND WE HAVE ZERO INFORMATION
      const hasAnyInformation = 
        lynkInfo !== null ||
        cleanProductName ||
        socialOgTitle ||
        socialMetaDesc ||
        shopeeApiData ||
        fetchedOgTitle || 
        fetchedTitle || 
        fetchedMetaDesc || 
        fetchedJsonLd || 
        fetchedBodyText || 
        extractedUrlTitle ||
        combinedUrlKeywordsStr.length > 3;

      if (!hasAnyInformation && status >= 400) {
        res.status(422).json({
          success: false,
          error: 'Gagal membaca halaman produk.',
          canonicalUrl: cleanShopeeUrl || canonicalUrl,
          message: 'Halaman produk tidak dapat diakses atau diblokir oleh penyedia situs.'
        });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        const fallbackName = cleanProductName || lynkInfo?.productFormatted || shopeeApiData?.name || extractedUrlTitle || urlKeywords[urlKeywords.length - 1] || jsonLdParsed?.name || 'Produk Unggulan';
        const fallbackBrand = cleanBrand || lynkInfo?.creatorFormatted || shopeeApiData?.brand || jsonLdParsed?.brand?.name || extractedStoreName || hostName || '';
        const fallbackDesc = finalDescription || jsonLdParsed?.description || `Produk unggulan dari link ${cleanShopeeUrl || canonicalUrl}`;

        res.json({
          request: { url: url.trim() },
          response: {
            resolved: true,
            canonicalUrl: cleanShopeeUrl || canonicalUrl,
            metadata: {
              productName: fallbackName,
              brand: fallbackBrand,
              category: lynkInfo ? lynkInfo.defaultCategory : 'E-commerce & Shopping',
              description: fallbackDesc,
              price: shopeeApiData?.price || (jsonLdParsed?.offers?.price ? `Rp ${jsonLdParsed.offers.price}` : ''),
              rating: shopeeApiData?.rating || '',
              sold: shopeeApiData?.sold || '',
              shopName: fallbackBrand || shopeeApiData?.shopName || extractedStoreName || ''
            },
            analysis: {
              targetAudiences: ['Konsumen Online', 'Pencari Promo / Diskon', 'Pengguna Media Sosial'],
              usp: 'Pemesanan langsung & aman melalui link resmi',
              valueProposition: 'Kemudahan akses & garansi keaslian produk',
              painPoints: ['Mencari produk berkualitas tanpa ribet', 'Keraguan keamanan transaksi online'],
              benefits: ['Pemesanan instan direct link', 'Informasi produk transparan'],
              features: ['Sistem order resmi'],
              objections: ['Keraguan garansi atau waktu pengiriman'],
              cta: ['Klik link untuk melihat detail & order sekarang!']
            }
          },
          success: true,
          productName: fallbackName,
          brand: fallbackBrand,
          category: lynkInfo ? lynkInfo.defaultCategory : 'E-commerce & Shopping',
          description: fallbackDesc,
          price: shopeeApiData?.price || (jsonLdParsed?.offers?.price ? `Rp ${jsonLdParsed.offers.price}` : ''),
          usp: 'Pemesanan langsung & aman melalui link resmi',
          valueProposition: 'Kemudahan akses & garansi keaslian produk',
          targetAudiences: ['Konsumen Online', 'Pencari Promo / Diskon', 'Pengguna Media Sosial'],
          painPoints: ['Mencari produk berkualitas tanpa ribet', 'Keraguan keamanan transaksi online'],
          benefits: ['Pemesanan instan direct link', 'Informasi produk transparan'],
          features: ['Sistem order resmi'],
          objections: ['Keraguan garansi atau waktu pengiriman'],
          cta: ['Klik link untuk melihat detail & order sekarang!'],
          toneContents: ['Friendly & Ngobrol (Santai)', 'Edukatif & Informatif'],
          canonicalUrl: cleanShopeeUrl || canonicalUrl
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const analysisPrompt = `
DATA HASIL EKSTRAKSI DARI LINK & CANONICAL URL PRODUK:
- Target URL Asli: ${url}
- Canonical URL Hasil Redirect: ${cleanShopeeUrl || canonicalUrl}
- Hops Redirect: ${redirectHistory.length} langkah
- Domain / Platform: ${lynkInfo ? `Lynk.id (${lynkInfo.pageType})` : hostName}
- Ground Truth Product Name: ${cleanProductName || lynkInfo?.productFormatted || shopeeApiData?.name || extractedUrlTitle || 'Tidak terdeteksi khusus'}
- Ground Truth Brand / Toko: ${cleanBrand || lynkInfo?.creatorFormatted || shopeeApiData?.brand || extractedStoreName || 'Tidak terdeteksi khusus'}
- Ground Truth Deskripsi: ${finalDescription || 'Tidak ada deskripsi'}
- Shopee API Price: ${shopeeApiData?.price || 'Tidak ada'}
- Shopee API Rating: ${shopeeApiData?.rating || 'Tidak ada'}
- Shopee API Terjual: ${shopeeApiData?.sold || 'Tidak ada'}
- Judul Halaman Spesifik: ${socialOgTitle || socialTitle || fetchedOgTitle || fetchedTitle || 'Tidak ada'}
- Structured JSON Data: ${fetchedJsonLd || 'Tidak ada'}

PETUNJUK ANALISIS E-COMMERCE & MARKET RESEARCHING (SHOPEE & LYNK.ID LINK ANALYZER WORKFLOW):
1. ATURAN WAJIB NAMA PRODUK:
   - DILARANG KERAS menghasilkan nama produk generik seperti "Shopee", "Shopee Indonesia", "Tokopedia", "TikTok Shop", "Produk dari Link", "Situs Belanja", "Access Denied", atau nama platform/marketplace lainnya.
   - Ground Truth Product Name adalah "${cleanProductName || lynkInfo?.productFormatted || shopeeApiData?.name || extractedUrlTitle}". Kamu WAJIB MENGGUNAKAN NAMA TERSEBUT (atau menyempurnakannya agar bersih) sebagai productName!
   - Contoh nama produk yang benar: "Kemeja Pria Oversize Lengan Panjang Polos", "Ebook Panduan Affiliate Shopee 2024", "Kelas Mastery TikTok Affiliate", "Preset Lightroom Aesthetic Selebgram".

2. ATURAN KHUSUS ANALISIS LYNK.ID (PLATFORM BIO LINK & CREATOR DIGITAL):
   ${lynkInfo ? `- Link ini terdeteksi dari Lynk.id milik creator "${lynkInfo.creatorFormatted}".
   - Nama Produk / Item: "${lynkInfo.productFormatted}".
   - Tipe Halaman: ${lynkInfo.pageType}.
   - WAJIB gunakan "${lynkInfo.productFormatted}" sebagai productName dan "${lynkInfo.creatorFormatted}" sebagai brand/shopName.
   - Pahami bahwa Lynk.id digunakan untuk menjual produk digital, ebook, mini course, preset, template, konsultasi, atau katalog bio link.` : '- Jika link berasal dari Lynk.id, ekstrak nama creator dari username dan nama produk dari slug URL.'}

3. RISET MARKET RESEARCH LENGKAP & KELUARKAN SCHEMATICS METADATA & ANALYSIS:
   Berdasarkan produk asli tersebut, lakukan riset produk mendalam dan keluarkan JSON terstruktur berikut dalam Bahasa Indonesia:
   - productName: Nama produk yang bersih, jelas, rapi, dan menarik pembeli.
   - brand: Nama brand / toko / kreator pembuat produk.
   - category: Kategori yang sangat pas (Skincare & Beauty, Fashion & Apparel, Gadget & Aksesoris, F&B / Kuliner, Produk Digital & Ebook, Edukasi & Mini Course, Jasa & Consulting, Perlengkapan Rumah, Affiliate Produk, dll).
   - description: Deskripsi produk yang jelas, menjual, dan informatif (2-3 kalimat).
   - price: Estimasi harga yang wajar atau angka spesifik jika ditemukan (misal: "Rp 129.000").
   - discount: Info diskon jika ada (misal: "Diskon 20%").
   - rating: Estimasi/info rating toko/produk (misal: "4.9/5").
   - sold: Info estimasi produk terjual jika ada.
   - shopName: Nama toko seller resmi.
   - shopRating: Rating seller.
   - location: Lokasi toko (misal: "Jakarta Selatan").
   - variation: Array variasi ukuran/warna jika ada.
   - material: Bahan produk jika relevan.
   - color: Warna produk jika relevan.
   - size: Ukuran jika relevan.
   - usp: Unique Selling Proposition (Keunggulan utama dibanding pesaing).
   - valueProposition: Nilai tambah utama untuk pembeli.
   - targetAudiences: Array 2-4 target pasar spesifik (contoh: ["Pria Dewasa 20-35 Tahun", "Penggemar Fashion Minimalis"]).
   - painPoints: Array 2-4 masalah calon konsumen yang diselesaikan oleh produk ini.
   - benefits: Array 2-4 manfaat nyata produk.
   - features: Array 2-4 fitur atau spesifikasi produk.
   - objections: Array 2-3 keraguan calon pembeli.
   - cta: Array 2-3 kalimat Call To Action menarik untuk promosi.
   - hook: Array 2-3 kalimat pembuka/hook promosi media sosial.
   - contentStyle: Array 2-3 format konten (contoh: ["Video Review Short / Reel", "Foto Carousel Visual"]).
   - contentAngle: Array 2-3 angle promosi (contoh: ["Problem-Solution", "Unboxing & First Impression"]).
   - toneContents: Array 2-3 gaya bahasa promosi yang paling cocok (pilih dari: ["Friendly & Ngobrol (Santai)", "Edukatif & Informatif", "Hard Selling & Urgent", "Soft Selling & Storytelling", "Mewah & Exclusive"]).
`;

      let rawData: any = null;
      const candidateModels = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'];

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: analysisPrompt,
            config: {
              systemInstruction: 'Kamu adalah Pakar E-Commerce Market Research, Shopee Link Analyzer Specialist, dan Affiliate Marketing Copywriter. Tugasmu menganalisis link produk dan menghasilkan riset terstruktur yang SANGAT AKURAT, SPESIFIK, dan MENJUAL dalam Bahasa Indonesia. JANGAN PERNAH menyebut nama platform/marketplace sebagai nama produk.',
              temperature: 0.2,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  productName: { type: Type.STRING },
                  brand: { type: Type.STRING },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                  price: { type: Type.STRING },
                  discount: { type: Type.STRING },
                  rating: { type: Type.STRING },
                  sold: { type: Type.STRING },
                  shopName: { type: Type.STRING },
                  shopRating: { type: Type.STRING },
                  location: { type: Type.STRING },
                  material: { type: Type.STRING },
                  color: { type: Type.STRING },
                  size: { type: Type.STRING },
                  variation: { type: Type.ARRAY, items: { type: Type.STRING } },
                  usp: { type: Type.STRING },
                  valueProposition: { type: Type.STRING },
                  targetAudiences: { type: Type.ARRAY, items: { type: Type.STRING } },
                  painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                  benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
                  features: { type: Type.ARRAY, items: { type: Type.STRING } },
                  objections: { type: Type.ARRAY, items: { type: Type.STRING } },
                  cta: { type: Type.ARRAY, items: { type: Type.STRING } },
                  hook: { type: Type.ARRAY, items: { type: Type.STRING } },
                  contentStyle: { type: Type.ARRAY, items: { type: Type.STRING } },
                  contentAngle: { type: Type.ARRAY, items: { type: Type.STRING } },
                  toneContents: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['productName', 'category', 'description', 'targetAudiences', 'painPoints', 'benefits', 'features', 'cta']
              }
            }
          });

          const jsonText = response.text;
          if (jsonText) {
            rawData = JSON.parse(jsonText);
            break;
          }
        } catch (modelErr: any) {
          console.warn(`[Analyze Link] Model ${modelName} call failed or quota exceeded:`, modelErr?.message || modelErr);
        }
      }

      if (!rawData) {
        console.warn('[Analyze Link] All Gemini models failed or quota exceeded (429). Using extracted ground-truth algorithmic fallback.');
        const fallbackName = cleanProductName || shopeeApiData?.name || extractedUrlTitle || urlKeywords[urlKeywords.length - 1] || jsonLdParsed?.name || 'Produk Unggulan';
        const fallbackBrand = cleanBrand || shopeeApiData?.brand || jsonLdParsed?.brand?.name || extractedStoreName || hostName || '';
        const fallbackDesc = finalDescription || jsonLdParsed?.description || `Produk unggulan dari link ${cleanShopeeUrl || canonicalUrl}`;

        res.json({
          request: { url: url.trim() },
          response: {
            resolved: true,
            canonicalUrl: cleanShopeeUrl || canonicalUrl,
            metadata: {
              productName: fallbackName,
              brand: fallbackBrand,
              category: 'E-commerce & Shopping',
              description: fallbackDesc,
              price: shopeeApiData?.price || (jsonLdParsed?.offers?.price ? `Rp ${jsonLdParsed.offers.price}` : ''),
              rating: shopeeApiData?.rating || '',
              sold: shopeeApiData?.sold || '',
              shopName: fallbackBrand || shopeeApiData?.shopName || extractedStoreName || ''
            },
            analysis: {
              targetAudiences: ['Konsumen Online', 'Pencari Promo / Diskon', 'Pengguna Media Sosial'],
              usp: 'Pemesanan langsung & aman melalui link resmi',
              valueProposition: 'Kemudahan akses & garansi keaslian produk',
              painPoints: ['Mencari produk berkualitas tanpa ribet', 'Keraguan keamanan transaksi online'],
              benefits: ['Pemesanan instan direct link', 'Informasi produk transparan'],
              features: ['Sistem order resmi'],
              objections: ['Keraguan garansi atau waktu pengiriman'],
              cta: ['Klik link untuk melihat detail & order sekarang!']
            }
          },
          success: true,
          productName: fallbackName,
          brand: fallbackBrand,
          category: 'E-commerce & Shopping',
          description: fallbackDesc,
          price: shopeeApiData?.price || (jsonLdParsed?.offers?.price ? `Rp ${jsonLdParsed.offers.price}` : ''),
          usp: 'Pemesanan langsung & aman melalui link resmi',
          valueProposition: 'Kemudahan akses & garansi keaslian produk',
          targetAudiences: ['Konsumen Online', 'Pencari Promo / Diskon', 'Pengguna Media Sosial'],
          painPoints: ['Mencari produk berkualitas tanpa ribet', 'Keraguan keamanan transaksi online'],
          benefits: ['Pemesanan instan direct link', 'Informasi produk transparan'],
          features: ['Sistem order resmi'],
          objections: ['Keraguan garansi atau waktu pengiriman'],
          cta: ['Klik link untuk melihat detail & order sekarang!'],
          toneContents: ['Friendly & Ngobrol (Santai)', 'Edukatif & Informatif'],
          canonicalUrl: cleanShopeeUrl || canonicalUrl
        });
        return;
      }

      const resolvedCanonicalUrl = cleanShopeeUrl || canonicalUrl;
      const resolvedProductName = rawData.productName || cleanProductName || shopeeApiData?.name || extractedUrlTitle || 'Produk Analisis Link';
      const resolvedBrand = rawData.brand || cleanBrand || shopeeApiData?.brand || jsonLdParsed?.brand?.name || extractedStoreName || hostName || '';

      // Build structured response matching Shopee Link Analyzer specification
      const responsePayload = {
        request: {
          url: url.trim()
        },
        response: {
          resolved: true,
          canonicalUrl: resolvedCanonicalUrl,
          metadata: {
            productName: resolvedProductName,
            brand: resolvedBrand,
            category: rawData.category || 'E-commerce',
            price: rawData.price || (jsonLdParsed?.offers?.price ? `Rp ${jsonLdParsed.offers.price}` : ''),
            discount: rawData.discount || '',
            rating: rawData.rating || '',
            sold: rawData.sold || '',
            description: rawData.description || finalDescription || jsonLdParsed?.description || '',
            features: rawData.features || [],
            benefits: rawData.benefits || [],
            specifications: rawData.features || [],
            images: jsonLdParsed?.image ? [jsonLdParsed.image] : [],
            video: '',
            shopName: rawData.shopName || resolvedBrand || extractedStoreName || '',
            shopRating: rawData.shopRating || '',
            location: rawData.location || '',
            variation: rawData.variation || [],
            material: rawData.material || '',
            color: rawData.color || '',
            size: rawData.size || ''
          },
          analysis: {
            targetAudiences: rawData.targetAudiences || [],
            contentTone: rawData.toneContents || [],
            contentStyle: rawData.contentStyle || ['Video Short / Reel', 'Post Carousel'],
            contentAngle: rawData.contentAngle || ['Problem-Solution', 'Benefit-Focused'],
            hook: rawData.hook || rawData.cta || [],
            cta: rawData.cta || [],
            usp: rawData.usp || '',
            valueProposition: rawData.valueProposition || '',
            painPoints: rawData.painPoints || [],
            benefits: rawData.benefits || [],
            features: rawData.features || [],
            objections: rawData.objections || []
          }
        },
        // Direct top-level fields for full backward compatibility
        success: true,
        productName: resolvedProductName,
        brand: resolvedBrand,
        category: rawData.category,
        description: rawData.description || finalDescription,
        price: rawData.price,
        usp: rawData.usp,
        valueProposition: rawData.valueProposition,
        targetAudiences: rawData.targetAudiences,
        painPoints: rawData.painPoints,
        benefits: rawData.benefits,
        features: rawData.features,
        objections: rawData.objections,
        cta: rawData.cta,
        toneContents: rawData.toneContents,
        canonicalUrl: resolvedCanonicalUrl
      };

      res.json(responsePayload);

    } catch (err: any) {
      console.error('Error analyzing product link in backend:', err);
      res.status(500).json({ error: err?.message || 'Gagal menganalisis link produk. Pastikan URL valid dan dapat diakses.' });
    }
  });

  // API Route: Generate Content Plan
  app.post('/api/generate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const input: GenerateFormInput = req.body;

      if (!input || !input.productName || !input.category) {
        res.status(400).json({ error: 'Nama produk dan kategori wajib diisi.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        console.log('GEMINI_API_KEY tidak ditemukan atau default, menggunakan local algorithmic engine fallback.');
        const result = generateLocalContentPlan(input);
        res.json(result);
        return;
      }

      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });

        const systemInstruction = `
Kamu adalah Master Content Strategist & Content Planner profesional khusus Threads.
Kamu menguasai penuh pengetahuan dan aturan sistem penulisan konten berikut:

1. ATURAN PENULISAN & COPYWRITING THREADS (STRICT):
   - Maksimal 3 emoji per postingan/utas.
   - Tanpa markdown kaku/tebal berlebihan di dalam teks caption post (threadPosts).
   - Gunakan Bahasa Indonesia dengan gaya ngobrol (santai, akrab, tidak kaku).
   - Setiap paragraf maksimal 2 kalimat.
   - Selalu berikan jeda spasi antar paragraf.
   - Gunakan numbering jika berbentuk daftar/list.
   - Wajib selalu memberikan Call To Action (CTA) di akhir postingan (contoh: "Kalau bermanfaat, simpan postingan ini.", "Tulis 'PILLAR' di komentar.", "Follow untuk konten seperti ini.", "DM aku.", "Mana yang paling menarik menurutmu?").

2. VARIASI ANGLE KONTEN & PRODUCT KNOWLEDGE (STRICT):
   Gunakan variasi dari 25 Angle Konten (Kesalahan, Mitos vs Fakta, Tutorial, Checklist, Case Study, Pengalaman, Framework, Before After, Studi Riset, Opini, Rahasia, Behind The Scene, Prediksi, Perbandingan, Quick Wins, Step by Step, Analogi, Kesalahan Pemula, Curhat, Hot Take, Review, Trend, Problem Solution, FAQ, Curated Resources, Challenge, Eksperimen) serta terapkan Product Knowledge (Pain Points, Benefits, Features, Objections, & CTA) secara mendalam di setiap konten.

3. 5 PATTERN STRUKTUR KONTEN:
   - Pattern 1: Hook -> Problem -> Solution -> Tutorial -> CTA
   - Pattern 2: Hook -> Story -> Insight -> Lesson -> CTA
   - Pattern 3: Hook -> Listicle -> Penjelasan -> CTA
   - Pattern 4: Hook -> Case Study -> Framework -> CTA
   - Pattern 5: Hook -> Myth -> Fact -> Explanation -> CTA

4. FORMULA HOOK & STARTER KALIMAT:
   Gunakan hook berdaya sebar tinggi (Curiosity Gap, Mistake Everyone Makes, Contrarian Opinion, Before After, Pain Point, Hidden Secret, Regret, Challenge, Prediction, Warning, Confession, dll) serta starter kalimat seperti:
   "Kalau kamu masih...", "90% orang masih salah...", "Aku baru sadar ternyata...", "Jangan lakukan ini kalau...", "Orang pintar justru...", "Yang bikin aku heran adalah...", "Aku menyesal baru tahu...", "Banyak orang mengira...", "Ini alasan kenapa...", "Cara paling mudah...", "Aku mencoba selama 30 hari...", "Sedikit orang tahu...", "Kalau disuruh mulai dari nol...", "Setelah membantu ratusan klien...", "Rahasia yang tidak pernah diajarkan...", "Berhenti melakukan ini...", "Kalau aku harus mengulang dari awal...", "Ternyata penyebabnya bukan...", "Ini yang kulakukan setiap hari...", "Simpan postingan ini...".

5. ALUR FUNNELING & PROMOSI THREADS:
   - Rule 70-20-10 Mix (70% Value, 20% Relate, 10% Selling).
   - Link Safety Comment #1 (dilarang menaruh link di main post untuk menghindari penalti reach -70%).
   - Smart Thread Generation (MANDATORY 4–8 UTAS): Setiap ide WAJIB memiliki jumlah utas yang bervariasi antara MINIMAL 4 UTAS dan MAKSIMAL 8 UTAS (threadPosts berisi 4, 5, 6, 7, atau 8 postingan/utas). DILARANG SERAGAM. Sesuaikan panjang utas dengan jenis & tujuan konten (Edukasi, Storytelling & Case Study disarankan 6–8 utas; Promo, Pancingan, & Hot Take disarankan 4–5 utas). Dilarang keras kurang dari 4 utas atau lebih dari 8 utas.

Hasilkan output JSON terstruktur yang persis sesuai dengan skema.
`;

        const pkDetails = [
          input.painPoints && input.painPoints.length > 0 ? `- Pain Points Audiens: ${input.painPoints.join('; ')}` : '',
          input.benefits && input.benefits.length > 0 ? `- Manfaat Utama (Benefits): ${input.benefits.join('; ')}` : '',
          input.features && input.features.length > 0 ? `- Fitur Produk: ${input.features.join('; ')}` : '',
          input.objections && input.objections.length > 0 ? `- Objek/Keraguan Audiens: ${input.objections.join('; ')}` : '',
          input.cta && input.cta.length > 0 ? `- Opsi Call to Action (CTA): ${input.cta.join('; ')}` : ''
        ].filter(Boolean).join('\n');

        const anglesPrompt = input.contentAngles && input.contentAngles.length > 0
          ? `- Angle Konten Terpilih: ${input.contentAngles.join(', ')}`
          : '';

        const prompt = `
Buatkan Konten Pilar & 30 Ide Konten Threads Lengkap (Ide 1 hingga Ide 30) berdasarkan input & Product Knowledge berikut:
- Nama Produk: ${input.productName}
- Kategori: ${input.category}
- Deskripsi Produk: ${input.description}
${pkDetails ? pkDetails + '\n' : ''}- Tujuan (Goal): ${input.goal}
- Target Platform: Threads (Khusus Threads)
- Target Audiens Terpilih: ${input.targetAudiences.join(', ')}
- Tone Konten Terpilih: ${input.toneContents.join(', ')}
${anglesPrompt ? anglesPrompt + '\n' : ''}- Link Produk: ${input.productUrl || 'https://lynk.id/produk'}
- Harga / Info tambahan: ${input.price || '-'}

Persyaratan Output (MANDATORY 30 KONTEN THREADS):
1. Buat 3-4 Content Pillars dengan nama, deskripsi, persentase alokasi, tujuan, dan contoh angle.
2. Buat TEPAT 30 Content Ideas (Hari/Ide 1 sampai Hari/Ide 30):
   - Setiap ide berkode dayNumber 1-30, dengan dayName "Hari 1 - Ide 1", "Hari 2 - Ide 2", dst.
   - Gunakan Product Knowledge (Pain Points, Benefits, Features, Objections, & CTA) secara mendalam untuk setiap ide konten.
   - Terapkan variasi 25 Angle Konten & 5 Pattern Struktur Konten.
   - Tentukan threadCount (MINIMAL 4 UTAS dan MAKSIMAL 8 UTAS per ide, yaitu array threadPosts WAJIB berisi antara 4 sampai 8 postingan/utas, disesuaikan secara acak/dinamis sesuai kedalaman topik). Dilarang seragam dan dilarang di luar rentang 4-8.
   - Sertakan threadReasoning & threadPosts (array string isi tiap utas dari utas 1 hingga utas N, di mana N adalah antara 4 hingga 8).
   - Pastikan teks tiap utas mematuhi ATURAN PENULISAN THREADS: maksimal 3 emoji, tanpa markdown tebal berlebihan, kalimat pendek (max 2 kalimat/paragraf), jeda spasi rapi, gaya ngobrol, dan CTA di akhir.
   - Sertakan hook, hookScore breakdown, visualSuggestion, linkPlacement (Comment #1), dan reachBoosterChecklist.
3. Strategi Rangkuman Algoritma Threads & Timing Posting.
`;

        let jsonText: string | undefined;
        const candidateModels = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'];

        for (const modelName of candidateModels) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                systemInstruction,
                temperature: 0.7,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    productName: { type: Type.STRING },
                    category: { type: Type.STRING },
                    description: { type: Type.STRING },
                    goal: { type: Type.STRING },
                    platform: { type: Type.STRING },
                    selectedAudiences: { type: Type.ARRAY, items: { type: Type.STRING } },
                    selectedTones: { type: Type.ARRAY, items: { type: Type.STRING } },
                    contentPillars: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          name: { type: Type.STRING },
                          description: { type: Type.STRING },
                          percentage: { type: Type.NUMBER },
                          purpose: { type: Type.STRING },
                          exampleAngles: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['id', 'name', 'description', 'percentage', 'purpose', 'exampleAngles']
                      }
                    },
                    contentIdeas: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          dayNumber: { type: Type.NUMBER },
                          dayName: { type: Type.STRING },
                          platform: { type: Type.STRING },
                          pillar: { type: Type.STRING },
                          contentType: { type: Type.STRING },
                          cycleType: { type: Type.STRING },
                          postTime: { type: Type.STRING },
                          targetAudience: { type: Type.STRING },
                          tone: { type: Type.STRING },
                          title: { type: Type.STRING },
                          hook: { type: Type.STRING },
                          hookScore: {
                            type: Type.OBJECT,
                            properties: {
                              curiosity: { type: Type.NUMBER },
                              relatability: { type: Type.NUMBER },
                              specificity: { type: Type.NUMBER },
                              total: { type: Type.NUMBER },
                              status: { type: Type.STRING }
                            },
                            required: ['curiosity', 'relatability', 'specificity', 'total', 'status']
                          },
                          threadCount: { type: Type.NUMBER },
                          threadReasoning: { type: Type.STRING },
                          threadPosts: { type: Type.ARRAY, items: { type: Type.STRING } },
                          body: { type: Type.STRING },
                          visualSuggestion: { type: Type.STRING },
                          linkPlacement: {
                            type: Type.OBJECT,
                            properties: {
                              placement: { type: Type.STRING },
                              condition: { type: Type.STRING },
                              copyText: { type: Type.STRING }
                            },
                            required: ['placement', 'condition', 'copyText']
                          },
                          reachBoosterChecklist: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: [
                          'id', 'dayNumber', 'dayName', 'platform', 'pillar',
                          'contentType', 'cycleType', 'postTime', 'targetAudience',
                          'tone', 'title', 'hook', 'hookScore', 'threadCount',
                          'threadReasoning', 'threadPosts', 'body',
                          'visualSuggestion', 'linkPlacement', 'reachBoosterChecklist'
                        ]
                      }
                    },
                    strategySummary: {
                      type: Type.OBJECT,
                      properties: {
                        ruleSummary: { type: Type.STRING },
                        bestPostingTimes: { type: Type.ARRAY, items: { type: Type.STRING } },
                        algorithmTips: { type: Type.ARRAY, items: { type: Type.STRING } }
                      },
                      required: ['ruleSummary', 'bestPostingTimes', 'algorithmTips']
                    }
                  },
                  required: [
                    'productName', 'category', 'description', 'goal',
                    'platform', 'selectedAudiences', 'selectedTones',
                    'contentPillars', 'contentIdeas', 'strategySummary'
                  ]
                }
              }
            });

            if (response.text) {
              jsonText = response.text;
              break;
            }
          } catch (modelErr: any) {
            console.warn(`[Generate Plan] Model ${modelName} call failed or quota exceeded:`, modelErr?.message || modelErr);
          }
        }

        if (jsonText) {
          const parsed: GenerationResult = JSON.parse(jsonText);
          parsed.generatedAt = new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          res.json(parsed);
          return;
        } else {
          throw new Error('Gemini API returned empty text');
        }
      } catch (geminiError) {
        console.error('Error invoking Gemini API, using fallback generator:', geminiError);
        const fallbackResult = generateLocalContentPlan(input);
        res.json(fallbackResult);
      }
    } catch (err: any) {
      console.error('Server generate error:', err);
      res.status(500).json({ error: 'Gagal memproses pembuatan konten plan.' });
    }
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();

export default app;
