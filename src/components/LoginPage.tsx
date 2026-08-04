import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, Lock, KeyRound, ShieldAlert, AlertTriangle, ArrowRight, Eye, EyeOff, Sparkles, Link, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithPin, sessionKickedMessage, clearSessionKickedMessage, accessKeyError, clearAccessKeyError } = useAuth();

  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!pin.trim()) {
      setLoginError('PIN yang Anda masukkan salah. Silakan coba lagi.');
      return;
    }

    setIsSubmitting(true);
    const res = await loginWithPin(pin.trim());
    setIsSubmitting(false);

    if (!res.success) {
      setLoginError('PIN yang Anda masukkan salah. Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-3 sm:p-6 relative overflow-x-hidden font-sans selection:bg-rose-500 selection:text-white">
      {/* Background Lighting & FX */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/10 to-rose-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-60 sm:w-80 h-60 sm:h-80 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-4 sm:space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-1.5 sm:space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 shadow-xl shadow-indigo-500/30 mb-1">
            <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-white stroke-[2.5]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>PILLAR<span className="text-rose-400">FLOW</span></span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Content AI
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
            Sistem Generasi Konten Affiliate & Manajemen Pilar Otomatis
          </p>
        </div>

        {/* ACCESS KEY ERROR ALERT (If User opens an invalid or disabled access_key link) */}
        {accessKeyError && (
          <div className="bg-rose-950/90 border border-rose-800/90 text-rose-200 p-4 rounded-2xl shadow-lg space-y-2.5 backdrop-blur-md animate-shake">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs leading-relaxed">
                <p className="font-extrabold text-rose-300 text-sm mb-0.5">Akses Tidak Valid</p>
                <p>{accessKeyError}</p>
              </div>
            </div>
            <button
              onClick={clearAccessKeyError}
              className="w-full py-1.5 text-center text-[11px] font-extrabold text-rose-300 hover:text-white bg-rose-900/60 hover:bg-rose-900 border border-rose-700/60 rounded-xl transition-colors cursor-pointer"
            >
              Tutup Peringatan
            </button>
          </div>
        )}

        {/* SESSION KICKED NOTIFICATION ALERT */}
        {sessionKickedMessage && (
          <div className="bg-rose-950/90 border border-rose-800/90 text-rose-200 p-4 rounded-2xl shadow-lg space-y-2.5 backdrop-blur-md animate-shake">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs leading-relaxed">
                <p className="font-extrabold text-rose-300 text-sm mb-0.5">Sesi Berakhir</p>
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

        {/* MAIN OWNER LOGIN CARD */}
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl space-y-5">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white">Owner Login</h2>
                <p className="text-[11px] text-slate-400">Masuk menggunakan PIN Khusus Owner</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Owner Mode
            </span>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>PIN Owner</span>
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  placeholder="Masukan PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-rose-500 text-white placeholder-slate-500 transition-colors min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-rose-500 hover:from-indigo-500 hover:to-rose-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? (
                <span>Verifikasi PIN...</span>
              ) : (
                <>
                  <span>Masuk sebagai Owner</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500 font-medium">
          Remix Affiliate Content Generator &copy; 2026 PillarFlow System
        </p>

      </div>
    </div>
  );
};

