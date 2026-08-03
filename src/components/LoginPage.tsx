import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, Lock, User, KeyRound, ShieldAlert, Sparkles, UserPlus, Mail, AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, registerWithInvite, sessionKickedMessage, clearSessionKickedMessage } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'invite'>('login');
  
  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invite Form State
  const [inviteToken, setInviteToken] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<{ createdByName?: string; expiresAt?: string } | null>(null);
  const [isValidatingInvite, setIsValidatingInvite] = useState(false);

  // Auto-detect invite token in URL query
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteParam = params.get('invite') || params.get('token');
    if (inviteParam) {
      setInviteToken(inviteParam);
      setActiveTab('invite');
      validateInviteToken(inviteParam);
    }
  }, []);

  const validateInviteToken = async (tokenVal: string) => {
    if (!tokenVal) return;
    setIsValidatingInvite(true);
    setInviteError(null);
    try {
      const res = await fetch(`/api/auth/invite-info?token=${encodeURIComponent(tokenVal)}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        setInviteInfo(data.invite);
      } else {
        setInviteError(data.error || 'Link undangan tidak valid atau kedaluwarsa.');
        setInviteInfo(null);
      }
    } catch (e) {
      setInviteError('Gagal memeriksa status token undangan.');
    } finally {
      setIsValidatingInvite(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!username || !password) {
      setLoginError('Mohon isi username/email dan password.');
      return;
    }

    setIsSubmitting(true);
    const res = await login(username, password);
    setIsSubmitting(false);

    if (!res.success) {
      setLoginError(res.error || 'Login gagal.');
    }
  };

  const handleInviteRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    if (!inviteToken || !regUsername || !regName || !regEmail || !regPassword) {
      setInviteError('Semua field wajib diisi.');
      return;
    }

    if (regPassword.length < 6) {
      setInviteError('Password minimal 6 karakter.');
      return;
    }

    setIsSubmitting(true);
    const res = await registerWithInvite(inviteToken, regUsername, regName, regEmail, regPassword);
    setIsSubmitting(false);

    if (!res.success) {
      setInviteError(res.error || 'Pendaftaran gagal.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-rose-500 selection:text-white">
      {/* Background Lighting & FX */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/10 to-rose-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 shadow-xl shadow-indigo-500/30 mb-2">
            <Zap className="w-8 h-8 text-white stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            PILLAR<span className="text-rose-400">FLOW</span> <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">AI App</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
            Sistem Perencanaan & Generator Konten Threads & X (Twitter)
          </p>
        </div>

        {/* SESSION KICKED / DISABLED NOTIFICATION ALERT */}
        {sessionKickedMessage && (
          <div className="bg-rose-950/80 border border-rose-800/90 text-rose-200 p-4 rounded-2xl shadow-lg space-y-2 backdrop-blur-md animate-shake">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs leading-relaxed">
                <p className="font-extrabold text-rose-300 text-sm mb-0.5">Sesi Berakhir / Single Device Enforcement</p>
                <p>{sessionKickedMessage}</p>
              </div>
            </div>
            <button
              onClick={clearSessionKickedMessage}
              className="w-full py-1.5 text-center text-[11px] font-extrabold text-rose-300 hover:text-white bg-rose-900/60 hover:bg-rose-900 border border-rose-700/60 rounded-xl transition-colors cursor-pointer"
            >
              Saya Mengerti
            </button>
          </div>
        )}

        {/* MAIN AUTH CARD */}
        <div className="bg-slate-800/90 border border-slate-700/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* TABS SWITCHER */}
          <div className="grid grid-cols-2 p-1 bg-slate-900/80 rounded-2xl border border-slate-700/60 text-xs font-bold">
            <button
              onClick={() => setActiveTab('login')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-indigo-600 to-rose-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Login Akun</span>
            </button>
            <button
              onClick={() => setActiveTab('invite')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'invite'
                  ? 'bg-gradient-to-r from-indigo-600 to-rose-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar Undangan</span>
            </button>
          </div>

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Username atau Email</span>
                </label>
                <input
                  type="text"
                  placeholder="Masukkan username atau email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-900/90 border border-slate-700 rounded-xl focus:outline-none focus:border-rose-500 text-white placeholder-slate-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-900/90 border border-slate-700 rounded-xl focus:outline-none focus:border-rose-500 text-white placeholder-slate-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-rose-500 hover:from-indigo-500 hover:to-rose-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Memproses Login...</span>
                ) : (
                  <>
                    <span>Masuk ke Aplikasi</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: INVITE REGISTER FORM */}
          {activeTab === 'invite' && (
            <form onSubmit={handleInviteRegisterSubmit} className="space-y-3.5">
              {inviteError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{inviteError}</span>
                </div>
              )}

              {inviteInfo && (
                <div className="p-3 bg-indigo-950/60 border border-indigo-800 text-indigo-200 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-indigo-400" />
                  <div>
                    <span className="font-bold">Undangan Valid</span> dari <span className="text-rose-300">{inviteInfo.createdByName || 'Owner'}</span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Kode / Token Link Undangan</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Masukkan token invite (misal: inv_xxx)"
                    value={inviteToken}
                    onChange={(e) => {
                      setInviteToken(e.target.value);
                      if (e.target.value.length > 8) validateInviteToken(e.target.value);
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl focus:outline-none focus:border-rose-500 text-white placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => validateInviteToken(inviteToken)}
                    disabled={isValidatingInvite || !inviteToken}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-colors"
                  >
                    {isValidatingInvite ? 'Cek...' : 'Cek Token'}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Nama Lengkap Anda</label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl focus:outline-none focus:border-rose-500 text-white placeholder-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Username Pilihan</label>
                <input
                  type="text"
                  placeholder="Contoh: budis"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl focus:outline-none focus:border-rose-500 text-white placeholder-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Alamat Email</label>
                <input
                  type="email"
                  placeholder="budi@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl focus:outline-none focus:border-rose-500 text-white placeholder-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Password Baru</label>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl focus:outline-none focus:border-rose-500 text-white placeholder-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-rose-500 hover:from-indigo-500 hover:to-rose-400 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <span>Mendaftarkan Akun...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Daftar & Langsung Masuk</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Security Notice Footer */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p className="font-semibold text-slate-400">Keamanan Akses Terjaga & Enforcement Perangkat Tunggal</p>
          <p>Hanya Owner yang berhak mengelola akun dan memberikan link undangan.</p>
        </div>

      </div>
    </div>
  );
};
