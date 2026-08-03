import React from 'react';
import { Sparkles, BookOpen, History, Sun, Moon, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={onReset}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 flex items-center justify-center text-white font-black shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                PILLAR<span className="text-indigo-600 dark:text-rose-400">FLOW</span>
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/80 text-rose-600 dark:text-rose-300 rounded-full">
                AI Planner
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            title={theme === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline text-xs font-semibold">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600" />
                <span className="hidden md:inline text-xs font-semibold">Dark Mode</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenHistory}
            className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Lihat Riwayat Konten Saved"
          >
            <History className="w-4 h-4 text-indigo-600 dark:text-rose-400" />
            <span className="font-semibold hidden sm:inline">Riwayat</span>
          </button>

          <button
            onClick={onOpenRules}
            className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Lihat Framework & Aturan Algoritma"
          >
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-rose-400" />
            <span className="hidden lg:inline font-semibold">Framework & Rules</span>
            <span className="lg:hidden">Rules</span>
          </button>

          {currentScreen === 'results' && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Buat Baru</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
