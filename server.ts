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
const DATA_DIR = path.join(__dirname, 'data');
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
}

// Password Hash Helper
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_pillarflow_salt_v2026').digest('hex');
}

// Database Initialization & Persistence Helper
function loadDatabase(): AuthDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading database file, reinitializing...', err);
  }

  // Seed default database with Owner Account
  const defaultOwner: StoredUser = {
    id: 'usr_owner_001',
    username: 'owner',
    name: 'Owner Admin',
    email: 'owner@pillarflow.com',
    passwordHash: hashPassword('ownerpassword123'),
    role: 'owner',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
    lastActiveAt: null,
    currentDeviceInfo: null
  };

  const initialDb: AuthDatabase = {
    users: [defaultOwner],
    sessions: [],
    invites: []
  };

  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: AuthDatabase) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database file:', err);
  }
}

// Global In-Memory Database
let db = loadDatabase();

// Extended Request Interface with Auth Info
interface AuthenticatedRequest extends Request {
  user?: StoredUser;
  sessionToken?: string;
}

async function startServer() {
  const app = express();
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

  // Middleware: Authentication & Single Device Session Validation
  const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Akses ditolak. Silakan login terlebih dahulu.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const session = db.sessions.find((s) => s.token === token);

    if (!session) {
      res.status(401).json({ error: 'Sesi tidak valid atau telah berakhir. Silakan login kembali.' });
      return;
    }

    const user = db.users.find((u) => u.id === session.userId);
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

    // Single Device Enforcement Check
    if (user.currentSessionId && user.currentSessionId !== token) {
      res.status(401).json({
        code: 'SESSION_KICKED',
        error: 'Akun Anda telah digunakan untuk login di perangkat lain. Demi keamanan, sesi pada perangkat ini telah berakhir.'
      });
      return;
    }

    // Update last activity
    const nowIso = new Date().toISOString();
    user.lastActiveAt = nowIso;
    session.lastActiveAt = nowIso;
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

  // Login Endpoint
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password, deviceInfo } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username/email dan password wajib diisi.' });
      return;
    }

    const target = username.trim().toLowerCase();
    const user = db.users.find(
      (u) => u.username.toLowerCase() === target || u.email.toLowerCase() === target
    );

    if (!user) {
      res.status(401).json({ error: 'Username/email atau password salah.' });
      return;
    }

    if (user.status === 'disabled') {
      res.status(403).json({ error: 'Akun Anda telah dinonaktifkan oleh Owner.' });
      return;
    }

    const inputHash = hashPassword(password);
    if (inputHash !== user.passwordHash) {
      res.status(401).json({ error: 'Username/email atau password salah.' });
      return;
    }

    // SINGLE DEVICE LOGIN ENFORCEMENT:
    // Generate new session token & replace currentSessionId
    const newToken = crypto.randomBytes(32).toString('hex');
    const nowIso = new Date().toISOString();

    user.currentSessionId = newToken;
    user.lastLoginAt = nowIso;
    user.lastActiveAt = nowIso;
    user.currentDeviceInfo = deviceInfo || { device: 'Perangkat Web', browser: 'Browser', os: 'OS' };

    // Remove old sessions for this user from sessions list
    db.sessions = db.sessions.filter((s) => s.userId !== user.id);

    // Add new session
    db.sessions.push({
      token: newToken,
      userId: user.id,
      createdAt: nowIso,
      lastActiveAt: nowIso,
      deviceInfo: user.currentDeviceInfo
    });

    saveDatabase(db);

    res.json({
      token: newToken,
      user: sanitizeUser(user)
    });
  });

  // Get Current Session Profile
  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
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
    const newToken = crypto.randomBytes(32).toString('hex');

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
      deviceInfo: newUser.currentDeviceInfo!
    });

    saveDatabase(db);

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
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
