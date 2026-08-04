export type PlatformType = 'threads' | 'x' | 'both';

export type UserRole = 'owner' | 'user';
export type AccountStatus = 'active' | 'disabled';

export interface DeviceInfo {
  device: string;
  browser: string;
  os: string;
  ip?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  currentDeviceInfo: DeviceInfo | null;
  currentSessionId?: string | null;
  isOnline?: boolean;
}

export interface InviteLink {
  id: string;
  token: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  expiresAt: string;
  maxUses: number; // e.g. 1, 5, 10 or 0 for unlimited
  usedCount: number;
  status: 'active' | 'expired' | 'exhausted';
  usedByUsers: string[];
}

export interface TargetAudienceOption {
  id: string;
  platform: 'threads' | 'x';
  name: string;
  age: string;
  vibe: string;
  ciri: string;
  masalah: string;
  toneWork: string;
}

export interface ToneOption {
  id: string;
  platform: 'threads' | 'x';
  name: string;
  description: string;
  vocab: string[];
  vibe: string;
}

export interface PresetData {
  id: string;
  title: string;
  productName: string;
  category: string;
  description: string;
  goal: string;
  platform: PlatformType;
  targetAudiences: string[];
  toneContents: string[];
  productUrl?: string;
  price?: string;
  duration?: string;
}

export interface ContentPillar {
  id: string;
  name: string;
  description: string;
  percentage: number;
  purpose: string;
  exampleAngles: string[];
}

export interface HookScoreBreakdown {
  curiosity: number; // 1-10
  relatability: number; // 1-10
  specificity: number; // 1-10
  total: number; // Formula: (curiosity * 0.4) + (relatability * 0.3) + (specificity * 0.3)
  status: 'APPROVED' | 'REJECTED' | 'BEST_OF_3';
}

export interface LinkPlacement {
  placement: 'COMMENT_1' | 'REPLY_1' | 'THREAD_2' | 'BIO' | 'HOLD';
  condition: string;
  copyText: string;
}

export interface ContentIdea {
  id: string;
  dayNumber: number;
  dayName: string;
  platform: 'Threads' | 'X';
  pillar: string;
  contentType: 'Edukasi' | 'Problem' | 'Demo' | 'Testimoni' | 'Personal' | 'Pancing' | 'Offer';
  cycleType: 'Value' | 'Soft Promo' | 'Hard Promo' | 'Relate' | 'Engagement';
  postTime: string;
  targetAudience: string;
  tone: string;
  title: string;
  hook: string;
  hookScore: HookScoreBreakdown;
  threadCount: number; // 1 to 5 smartly determined by AI
  threadReasoning?: string; // AI decision breakdown
  threadPosts: string[]; // List of post strings in thread sequence
  body: string; // Joined full thread body text
  visualSuggestion: string;
  linkPlacement: LinkPlacement;
  reachBoosterChecklist: string[];
}

export interface StrategySummary {
  ruleSummary: string; // e.g. "70-20-10 Mix (Threads) & 4-1-1 Cycle (X)"
  bestPostingTimes: string[];
  algorithmTips: string[];
}

export interface GenerationResult {
  productName: string;
  category: string;
  description: string;
  goal: string;
  platform: PlatformType;
  selectedAudiences: string[];
  selectedTones: string[];
  contentPillars: ContentPillar[];
  contentIdeas: ContentIdea[];
  strategySummary: StrategySummary;
  generatedAt: string;
}

export interface GenerateFormInput {
  productName: string;
  category: string;
  description: string;
  goal: string;
  platform: PlatformType;
  targetAudiences: string[];
  toneContents: string[];
  productUrl?: string;
  price?: string;
  misconception?: string;
  duration?: string;
  mistakes?: string[];
}

export interface HistoryItem {
  id: string;
  userId?: string;
  createdAt: string;
  productName: string;
  category: string;
  platform: PlatformType;
  input: GenerateFormInput;
  result: GenerationResult;
}
