import React from 'react';
import { Sparkles, History, BookOpen, Sun, Moon, Crown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
  currentScreen?: 'form' | 'results';
  onReset?: () => void;
  onOpenHistory?: () => void;
  onOpenRules?: () => void;
  onOpenOwnerPanel?: () => void;
  historyCount?: number;
  activeTab?: string;
  setActiveTab?: (tab: 'generator' | 'history' | 'rules') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen = 'form',
  onReset,
  onOpenHistory,
  onOpenRules,
  onOpenOwnerPanel,
  historyCount = 0,
  activeTab,
  setActiveTab
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const handleGeneratorClick = () => {
    if (onReset) onReset();
    if (setActiveTab) setActiveTab('generator');
  };

  const handleHistoryClick = () => {
    if (onOpenHistory) onOpenHistory();
    if (setActiveTab) setActiveTab('history');
  };

  const handleRulesClick = () => {
    if (onOpenRules) onOpenRules();
    if (setActiveTab) setActiveTab('rules');
  };

  const isFormActive = currentScreen === 'form' || activeTab === 'generator';

  return (
    <div className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-md pointer-events-auto">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 flex items-center justify-around transition-all duration-200">
        {/* Generator Button */}
        <button
          onClick={handleGeneratorClick}
          className={`flex flex-1 flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer min-h-[48px] ${
            isFormActive
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1 tracking-tight">Planner</span>
        </button>

        {/* History Button */}
        <button
          onClick={handleHistoryClick}
          className={`relative flex flex-1 flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer min-h-[48px] ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1 tracking-tight">Riwayat</span>
          {historyCount > 0 && (
            <span className="absolute top-1 right-2.5 w-4 h-4 bg-indigo-600 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center border border-white dark:border-slate-900">
              {historyCount}
            </span>
          )}
        </button>

        {/* Rules / Framework Button */}
        <button
          onClick={handleRulesClick}
          className={`flex flex-1 flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer min-h-[48px] ${
            activeTab === 'rules'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1 tracking-tight">Rules</span>
        </button>

        {/* Owner Panel Button (if user is owner) */}
        {user?.role === 'owner' && onOpenOwnerPanel && (
          <button
            onClick={onOpenOwnerPanel}
            className="flex flex-1 flex-col items-center justify-center py-2 px-1 rounded-xl text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-all cursor-pointer min-h-[48px]"
            title="Owner Panel"
          >
            <Crown className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] font-extrabold mt-1 tracking-tight">Owner</span>
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex flex-1 flex-col items-center justify-center py-2 px-1 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer min-h-[48px]"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          )}
          <span className="text-[10px] font-bold mt-1 tracking-tight">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </div>
  );
};

