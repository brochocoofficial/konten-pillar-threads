import React, { useState } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { FormInput } from './components/FormInput';
import { ResultView } from './components/ResultView';
import { SystemInstructionsModal } from './components/SystemInstructionsModal';
import { HistoryModal } from './components/HistoryModal';
import { LoginPage } from './components/LoginPage';
import { GenerateFormInput, GenerationResult, HistoryItem } from './types';
import { generateLocalContentPlan } from './data/generatorEngine';
import { saveToHistory } from './utils/historyManager';
import { useAuth } from './context/AuthContext';
import { Zap } from 'lucide-react';

export default function App() {
  const { user, token, isLoading: isAuthLoading } = useAuth();

  const [currentScreen, setCurrentScreen] = useState<'form' | 'results'>('form');
  const [activeTab, setActiveTab] = useState<'generator' | 'history' | 'rules'>('generator');
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [lastInput, setLastInput] = useState<GenerateFormInput | null>(null);

  // 1. Loading Screen while checking session
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-rose-500 flex items-center justify-center animate-pulse shadow-lg shadow-rose-500/20">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-extrabold tracking-wide">PILLARFLOW AI</p>
          <p className="text-xs text-slate-400">Memvalidasi Sesi Login & Perangkat...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated -> Show Login & Invite Registration View
  if (!user) {
    return <LoginPage />;
  }

  // 3. Authenticated -> Render Main Application
  const handleGenerate = async (input: GenerateFormInput) => {
    setIsLoading(true);
    setLastInput(input);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(input)
      });

      if (response.ok) {
        const data: GenerationResult = await response.json();
        setGenerationResult(data);
        saveToHistory(input, data);
        setCurrentScreen('results');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        console.warn('API response error, falling back to local engine...');
        const localData = generateLocalContentPlan(input);
        setGenerationResult(localData);
        saveToHistory(input, localData);
        setCurrentScreen('results');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Error contacting backend, using local fallback:', err);
      const localData = generateLocalContentPlan(input);
      setGenerationResult(localData);
      saveToHistory(input, localData);
      setCurrentScreen('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setGenerationResult(item.result);
    setLastInput(item.input);
    setCurrentScreen('results');
    setActiveTab('generator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToForm = () => {
    setCurrentScreen('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setGenerationResult(null);
    setCurrentScreen('form');
    setActiveTab('generator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegenerate = () => {
    if (lastInput) {
      handleGenerate(lastInput);
    }
  };

  const handleTabChange = (tab: 'generator' | 'history' | 'rules') => {
    setActiveTab(tab);
    if (tab === 'generator') {
      // Keep current screen
    } else if (tab === 'history') {
      setIsHistoryOpen(true);
    } else if (tab === 'rules') {
      setIsRulesOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-rose-500 selection:text-white antialiased flex flex-col transition-colors duration-200">
      {/* Main Top Navigation Header */}
      <Header
        currentScreen={currentScreen}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onReset={handleReset}
      />

      {/* Main Content View */}
      <main className="flex-1 pb-20 md:pb-8">
        {currentScreen === 'form' || !generationResult ? (
          <FormInput onSubmit={handleGenerate} isLoading={isLoading} />
        ) : (
          <ResultView
            result={generationResult}
            userInput={lastInput}
            onBackToForm={handleBackToForm}
            onRegenerate={handleRegenerate}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 mt-auto">
        <p className="font-extrabold text-slate-700 dark:text-slate-300">PILLARFLOW AI Content Generator</p>
        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
          Akses Terproteksi RBAC & Single Device Session Enforcement
        </p>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentScreen={currentScreen}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onReset={handleReset}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Framework & System Rules Modal */}
      <SystemInstructionsModal
        isOpen={isRulesOpen}
        onClose={() => {
          setIsRulesOpen(false);
          setActiveTab('generator');
        }}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setActiveTab('generator');
        }}
        onSelectHistoryItem={handleSelectHistoryItem}
      />
    </div>
  );
}
