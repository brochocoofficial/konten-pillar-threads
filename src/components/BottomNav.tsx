import React from 'react';
import { Sparkles, History, BookOpen, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface BottomNavProps {
  currentScreen: 'form' | 'results';
  onReset: () => void;
  onOpenHistory: () => void;
  onOpenRules: () => void;
  historyCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onReset,
  onOpenHistory,
  onOpenRules,
  historyCount = 0
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl p-2 flex items-center justify-around transition-colors duration-200">
        {/* Generator Button */}
        <button
          onClick={onReset}
          className={`flex flex-col items-center justify-center py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
            currentScreen === 'form'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1">Planner</span>
        </button>

        {/* History Button */}
        <button
          onClick={onOpenHistory}
          className="relative flex flex-col items-center justify-center py-2 px-3.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1">Riwayat</span>
          {historyCount > 0 && (
            <span className="absolute top-1 right-2 w-4 h-4 bg-indigo-600 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center">
              {historyCount}
            </span>
          )}
        </button>

        {/* Rules Button */}
        <button
          onClick={onOpenRules}
          className="flex flex-col items-center justify-center py-2 px-3.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1">Rules</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center justify-center py-2 px-3.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          )}
          <span className="text-[10px] font-bold mt-1">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </div>
  );
};
