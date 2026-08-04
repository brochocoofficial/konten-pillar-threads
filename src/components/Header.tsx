import React, { useState } from 'react';
import { Sparkles, BookOpen, History, Sun, Moon, Zap, Crown, LogOut, ShieldCheck, User as UserIcon, Menu, X, ChevronDown, Link as LinkIcon, Check, Copy } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { OwnerPanelModal } from './OwnerPanelModal';

interface HeaderProps {
  onOpenRules: () => void;
  onOpenHistory: () => void;
  onReset: () => void;
  currentScreen: 'form' | 'results';
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRules,
  onOpenHistory,
  onReset,
  currentScreen
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, getCopyableUserAccessLink } = useAuth();

  const [isOwnerPanelOpen, setIsOwnerPanelOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copyNotification, setCopyNotification] = useState<string | null>(null);

  const handleCopyUserAccessLink = async () => {
    try {
      const link = await getCopyableUserAccessLink();
      await navigator.clipboard.writeText(link);
      setCopyNotification('Link Akses User terenkripsi berhasil disalin!');
      setTimeout(() => setCopyNotification(null), 3500);
    } catch (e) {
      const link = await getCopyableUserAccessLink();
      alert(`Link Akses User:\n${link}`);
    }
  };

  return (
    <>
      {copyNotification && (
        <div className="fixed top-3 right-3 sm:top-5 sm:right-5 z-50 bg-slate-900 text-white border border-emerald-500/50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-bounce-short">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-extrabold text-emerald-200">{copyNotification}</span>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          
          {/* Brand / Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer group shrink-0"
            onClick={onReset}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 flex items-center justify-center text-white font-black shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  PILLAR<span className="text-indigo-600 dark:text-rose-400">FLOW</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/80 text-rose-600 dark:text-rose-300 rounded-full">
                  AI
                </span>
              </div>
            </div>
          </div>

          {/* Desktop User Info & Actions */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3">
            
            {/* Logged in User Badge & Role */}
            {user && (
              <div className="flex items-center gap-2 pl-2 pr-3 py-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-rose-500 flex items-center justify-center text-white text-[10px] font-black uppercase">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left text-xs leading-tight">
                  <div className="font-black text-slate-900 dark:text-white truncate max-w-[110px]">{user.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                    <span>@{user.username}</span>
                    <span
                      className={`px-1 py-0.2 text-[9px] font-black uppercase rounded ${
                        user.role === 'owner'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Owner Actions (Only for Owner role) */}
            {user?.role === 'owner' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyUserAccessLink}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-black text-white bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-500 rounded-xl transition-all cursor-pointer shadow-md"
                  title="Salin Link Akses Khusus User (dengan Access Key Terenkripsi)"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-white" />
                  <span>{copyNotification ? 'Link Disalin!' : 'Salin Link Akses User'}</span>
                </button>

                <button
                  onClick={() => setIsOwnerPanelOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-black text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/70 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 rounded-xl transition-all cursor-pointer"
                  title="Buka Panel Owner Administration"
                >
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="hidden sm:inline">Owner Panel</span>
                </button>
              </div>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
              title={theme === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-semibold">Dark</span>
                </>
              )}
            </button>

            {/* History Button */}
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Lihat Riwayat Konten Saved"
            >
              <History className="w-4 h-4 text-indigo-600 dark:text-rose-400" />
              <span>Riwayat</span>
            </button>

            {/* Rules Button */}
            <button
              onClick={onOpenRules}
              className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Lihat Framework & Aturan Algoritma"
            >
              <BookOpen className="w-4 h-4 text-indigo-600 dark:text-rose-400" />
              <span>Framework</span>
            </button>

            {/* Create New Content Button */}
            {currentScreen === 'results' && (
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Buat Baru</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={logout}
              className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-slate-200/80 dark:border-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              title="Keluar / Logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>

          </div>

          {/* Mobile Right Bar: Avatar & Menu Trigger */}
          <div className="flex md:hidden items-center gap-1.5">
            {/* Create New button on mobile if in results */}
            {currentScreen === 'results' && (
              <button
                onClick={onReset}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-extrabold text-white bg-indigo-600 rounded-lg shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Baru</span>
              </button>
            )}

            {/* User Profile / Menu Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-rose-500 flex items-center justify-center text-white text-xs font-black uppercase">
                {user?.name ? user.name.charAt(0) : <UserIcon className="w-4 h-4" />}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xl animate-fadeIn">
            {/* User Summary Card */}
            {user && (
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-rose-500 flex items-center justify-center text-white text-sm font-black uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white">{user.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</div>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md border ${
                    user.role === 'owner'
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                      : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                  }`}
                >
                  {user.role}
                </span>
              </div>
            )}

            {/* Quick Action Links */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {user?.role === 'owner' && (
                <div className="col-span-2 space-y-2">
                  <button
                    onClick={() => { handleCopyUserAccessLink(); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 p-2.5 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white rounded-xl cursor-pointer font-extrabold text-xs shadow-md"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span>{copyNotification ? 'Link Disalin!' : 'Salin Link Akses User'}</span>
                  </button>

                  <button
                    onClick={() => { setIsOwnerPanelOpen(true); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 p-2 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl cursor-pointer font-black text-xs"
                  >
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span>Buka Owner Admin Panel</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => { onOpenHistory(); setIsMobileMenuOpen(false); }}
                className="flex items-center justify-center gap-2 p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer"
              >
                <History className="w-4 h-4 text-indigo-500" />
                <span>Riwayat Saved</span>
              </button>

              <button
                onClick={() => { onOpenRules(); setIsMobileMenuOpen(false); }}
                className="flex items-center justify-center gap-2 p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>Framework</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              {/* Logout */}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 rounded-xl cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Owner Panel Modal */}
      {user?.role === 'owner' && (
        <OwnerPanelModal
          isOpen={isOwnerPanelOpen}
          onClose={() => setIsOwnerPanelOpen(false)}
        />
      )}
    </>
  );
};
