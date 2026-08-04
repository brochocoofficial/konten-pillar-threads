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
      res.status(401).json({ error: 'PIN Owner salah. Silakan coba lagi.' });
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

    if (accessKey.trim().toUpperCase() !== activeKey.trim().toUpperCase()) {
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
Kamu adalah Master Content Strategist & Content Planner profesional khusus Threads dan X (Twitter).
Kamu sangat menguasai dokumen acuan utama:
1. THREADS SYSTEM INSTRUCTIONS:
   - Rule 70-20-10 Mix (70% Value, 20% Relate, 10% Selling).
   - Link Safety First: Dilarang keras menaruh link di main post (penalti reach -70%). Link hanya di Comment 1 setelah >= 500 views.
   - Hook Virality Score: (Curiosity * 0.4) + (Relatability * 0.3) + (Specificity * 0.3). Minimal Score 7.0.
2. X (TWITTER) SYSTEM INSTRUCTIONS:
   - Rule 4-1-1 Mix Cycle (4 Value, 1 Soft Promo, 1 Hard Promo).
   - Link Placement: Dilarang di main post (penalti reach ~30-50%). Link hanya di Reply Pertama, Thread ke-2, atau arahkan ke Bio.
3. SMART THREAD GENERATION (ATURAN PEMBUATAN UTAS):
   - JANGAN PERNAH selalu menghasilkan 2 utas atau mematok jumlah utas yang sama untuk seluruh postingan!
   - Tentukan secara mandiri jumlah utas ideal (antara 1 hingga 5 utas) untuk setiap ide konten berdasarkan evaluasi SMART DECISION RULES.
   - Variasikan jumlah utas di antara ke-7 ide konten.

Hasilkan output JSON terstruktur yang persis sesuai dengan skema.
`;

        const prompt = `
Buatkan Konten Pilar & 7 Ide Konten Lengkap berdasarkan input berikut:
- Nama Produk: ${input.productName}
- Kategori: ${input.category}
- Deskripsi Produk: ${input.description}
- Tujuan (Goal): ${input.goal}
- Platform Target: ${input.platform}
- Target Audiens Terpilih: ${input.targetAudiences.join(', ')}
- Tone Konten Terpilih: ${input.toneContents.join(', ')}
- Link Produk: ${input.productUrl || 'https://link.produk.com'}
- Harga / Info tambahan: ${input.price || '-'}

Persyaratan Output:
1. Buat 3-4 Content Pillars dengan nama, deskripsi, persentase alokasi, tujuan, dan contoh angle.
2. Buat 7 Content Ideas (Hari 1-7 / Senin-Minggu):
   - Tentukan threadCount (1 hingga 5 utas) secara mandiri untuk masing-masing ide.
   - Sertakan threadReasoning (alasan pemilihan jumlah utas tersebut) & threadPosts (array string isi tiap utas dari utas 1 hingga utas N).
   - Pastikan body berisi gabungan seluruh threadPosts dalam format rapi.
   - Sertakan hook, hookScore breakdown, visualSuggestion, linkPlacement, dan reachBoosterChecklist.
3. Strategi Rangkuman Algoritma & Timing Posting.
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
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

        const jsonText = response.text;
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
