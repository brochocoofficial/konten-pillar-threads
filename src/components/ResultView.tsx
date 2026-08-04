import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowLeft, 
  Download, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  Calendar, 
  Layers, 
  Zap,
  TrendingUp,
  Table,
  Grid,
  FileText
} from 'lucide-react';
import { GenerationResult, GenerateFormInput } from '../types';
import { generateContentPlanPDF } from '../utils/pdfGenerator';

interface ResultViewProps {
  result: GenerationResult;
  userInput?: GenerateFormInput | null;
  onBackToForm: () => void;
  onRegenerate: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  result,
  userInput,
  onBackToForm,
  onRegenerate
}) => {
  const [activeTab, setActiveTab] = useState<'pillars' | 'ideas' | 'copy_hub' | 'strategy'>('ideas');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<'ALL' | 'Threads' | 'X'>('ALL');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Single PDF Download
  const handleDownloadPDF = () => {
    generateContentPlanPDF(result, userInput);
  };

  // Filter ideas
  const filteredIdeas = result.contentIdeas.filter((idea) => {
    if (selectedPlatformFilter === 'ALL') return true;
    return idea.platform === selectedPlatformFilter;
  });

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-6 space-y-4 sm:space-y-6 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* ACTION BAR TOP */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 rounded-2xl shadow-xs">
        <button
          onClick={onBackToForm}
          className="flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-rose-400" />
          <span>&larr; Kembali ke Form / Edit Input</span>
        </button>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onRegenerate}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-colors cursor-pointer min-h-[44px]"
          >
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Regenerate</span>
          </button>

          {/* SINGLE PDF DOWNLOAD BUTTON */}
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-black text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-rose-500 hover:from-indigo-700 hover:to-rose-600 rounded-xl shadow-xs transition-all cursor-pointer min-h-[44px]"
            title="Download Dokumen Perencanaan Konten PDF"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* OVERVIEW SUMMARY CARD */}
      <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/80 text-rose-600 dark:text-rose-300">
                {result.category}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Dibuat pada: {result.generatedAt}</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {result.productName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              {result.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 w-full md:w-auto">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Tujuan:</span>
              <span className="font-extrabold text-indigo-700 dark:text-rose-400">{result.goal}</span>
            </div>
            <div className="border-l border-slate-200 dark:border-slate-700 pl-2.5">
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Platform:</span>
              <span className="font-extrabold text-sky-700 dark:text-sky-400 uppercase">{result.platform}</span>
            </div>
          </div>
        </div>

        {/* Selected Audiences and Tones Badges */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Audiences:</span>
          {result.selectedAudiences.map((aud) => (
            <span key={aud} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-medium">
              {aud}
            </span>
          ))}
          <span className="text-slate-300 dark:text-slate-700 mx-0.5">|</span>
          <span className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Tones:</span>
          {result.selectedTones.map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/80 text-rose-600 dark:text-rose-300 text-[10px] font-medium">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTab('ideas')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'ideas'
              ? 'border-indigo-600 text-indigo-600 dark:border-rose-400 dark:text-rose-400 bg-indigo-50/50 dark:bg-slate-800/80'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>7 Ide Konten & Post Planner</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 dark:bg-rose-950 text-indigo-700 dark:text-rose-300 font-mono font-bold">
            {result.contentIdeas.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pillars')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'pillars'
              ? 'border-indigo-600 text-indigo-600 dark:border-rose-400 dark:text-rose-400 bg-indigo-50/50 dark:bg-slate-800/80'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Konten Pilar ({result.contentPillars.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('copy_hub')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'copy_hub'
              ? 'border-indigo-600 text-indigo-600 dark:border-rose-400 dark:text-rose-400 bg-indigo-50/50 dark:bg-slate-800/80'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Copy className="w-4 h-4" />
          <span>Copy & Hook Hub</span>
        </button>

        <button
          onClick={() => setActiveTab('strategy')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'strategy'
              ? 'border-indigo-600 text-indigo-600 dark:border-rose-400 dark:text-rose-400 bg-indigo-50/50 dark:bg-slate-800/80'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Aturan Algoritma & Checklist</span>
        </button>
      </div>

      {/* TAB 1: 7 IDE KONTEN & POST PLANNER */}
      {activeTab === 'ideas' && (
        <div className="space-y-6">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/90 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Filter Platform:</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setSelectedPlatformFilter('ALL')}
                  className={`px-3 py-1 text-xs rounded-md font-semibold transition-colors cursor-pointer ${
                    selectedPlatformFilter === 'ALL' ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Semua ({result.contentIdeas.length})
                </button>
                <button
                  onClick={() => setSelectedPlatformFilter('Threads')}
                  className={`px-3 py-1 text-xs rounded-md font-semibold transition-colors cursor-pointer ${
                    selectedPlatformFilter === 'Threads' ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Threads
                </button>
                <button
                  onClick={() => setSelectedPlatformFilter('X')}
                  className={`px-3 py-1 text-xs rounded-md font-semibold transition-colors cursor-pointer ${
                    selectedPlatformFilter === 'X' ? 'bg-sky-600 dark:bg-sky-500 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  X (Twitter)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  viewMode === 'card' ? 'bg-indigo-50 dark:bg-slate-800 border-indigo-400 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
                title="Tampilan Kartu"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-indigo-50 dark:bg-slate-800 border-indigo-400 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
                title="Tampilan Tabel"
              >
                <Table className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* VIEW MODE: CARDS */}
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredIdeas.map((idea) => {
                const isThreads = idea.platform === 'Threads';

                return (
                  <div
                    key={idea.id}
                    className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between transition-all"
                  >
                    <div className="space-y-4">
                      {/* Top Header Badge */}
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900 dark:text-white">
                            {idea.dayName}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            isThreads 
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' 
                              : 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300'
                          }`}>
                            {idea.platform}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          ⏰ {idea.postTime}
                        </span>
                      </div>

                      {/* Content Type & Pillar & Smart Thread Badge */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-bold border border-slate-200 dark:border-slate-700">
                          {idea.contentType}
                        </span>
                        <span className="bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-rose-400 border border-indigo-200 dark:border-slate-700 px-2.5 py-1 rounded-lg font-bold">
                          Pilar: {idea.pillar}
                        </span>
                        <span className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                          💬 {idea.threadCount || 1} Utas (Smart Length)
                        </span>
                      </div>

                      {/* Smart Thread Reasoning Banner */}
                      {idea.threadReasoning && (
                        <div className="bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 rounded-xl p-3 text-[11px] text-rose-900 dark:text-rose-200 flex items-start gap-2">
                          <span className="shrink-0 font-extrabold text-rose-600 dark:text-rose-400">🧠 Analyst AI:</span>
                          <span className="leading-relaxed">{idea.threadReasoning}</span>
                        </div>
                      )}

                      {/* Hook Section & Score */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>Hook Text (Stop-Scroll):</span>
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded">
                            Hook Score: {idea.hookScore.total}/10 ({idea.hookScore.status})
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 italic">
                          "{idea.hook}"
                        </p>
                        {/* Hook score breakdown */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400">
                          <div>Curiosity: <strong className="text-slate-800 dark:text-slate-200">{idea.hookScore.curiosity}/10</strong></div>
                          <div>Relatability: <strong className="text-slate-800 dark:text-slate-200">{idea.hookScore.relatability}/10</strong></div>
                          <div>Specificity: <strong className="text-slate-800 dark:text-slate-200">{idea.hookScore.specificity}/10</strong></div>
                        </div>
                      </div>

                      {/* Thread Posts Sequence */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span className="flex items-center gap-1">
                            <span>Rangkaian Utas ({idea.threadPosts?.length || idea.threadCount || 1} Post):</span>
                          </span>
                          <button
                            onClick={() => handleCopy(idea.body, idea.id)}
                            className="flex items-center gap-1 text-[11px] text-indigo-700 dark:text-rose-300 hover:text-indigo-900 bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-slate-700 transition-colors cursor-pointer font-bold"
                          >
                            {copiedId === idea.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedId === idea.id ? 'Tersalin All!' : 'Salin Semua Utas'}</span>
                          </button>
                        </div>

                        {idea.threadPosts && idea.threadPosts.length > 0 ? (
                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {idea.threadPosts.map((postText, pIdx) => (
                              <div key={pIdx} className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-1.5 relative">
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 pb-1 border-b border-slate-200/80 dark:border-slate-700">
                                  <span className="text-indigo-600 dark:text-rose-400 uppercase tracking-wider font-black">
                                    {idea.threadPosts.length === 1 ? 'Post Utama (Utas 1/1)' : `Utas ${pIdx + 1} dari ${idea.threadPosts.length}`}
                                  </span>
                                  <button
                                    onClick={() => handleCopy(postText, `${idea.id}_post_${pIdx}`)}
                                    className="text-[10px] text-indigo-700 dark:text-indigo-300 flex items-center gap-1 bg-white dark:bg-slate-900 hover:bg-indigo-50 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                                  >
                                    {copiedId === `${idea.id}_post_${pIdx}` ? (
                                      <span className="text-emerald-500 flex items-center gap-0.5"><Check className="w-3 h-3" /> Tersalin!</span>
                                    ) : (
                                      <span className="flex items-center gap-0.5"><Copy className="w-3 h-3" /> Salin Utas Ini</span>
                                    )}
                                  </button>
                                </div>
                                <p className="text-xs text-slate-800 dark:text-slate-100 font-sans whitespace-pre-line leading-relaxed">
                                  {postText}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-xs text-slate-800 dark:text-slate-100 font-sans whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                            {idea.body}
                          </div>
                        )}
                      </div>

                      {/* Visual Suggestion */}
                      <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl flex items-start gap-2">
                        <span className="font-bold text-indigo-700 dark:text-rose-400 shrink-0">🎨 Visual:</span>
                        <span>{idea.visualSuggestion}</span>
                      </div>

                      {/* Link Placement Box */}
                      <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                        isThreads 
                          ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900' 
                          : 'bg-sky-50/60 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900'
                      }`}>
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <span>Penempatan Link ({idea.linkPlacement.placement})</span>
                          </span>
                          <button
                            onClick={() => handleCopy(idea.linkPlacement.copyText, `link_${idea.id}`)}
                            className="text-[10px] text-indigo-700 dark:text-rose-300 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                          >
                            {copiedId === `link_${idea.id}` ? 'Tersalin!' : 'Copy Link Text'}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{idea.linkPlacement.condition}</p>
                        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg text-[11px] font-mono text-indigo-900 dark:text-indigo-200 border border-indigo-100 dark:border-slate-800 whitespace-pre-line">
                          {idea.linkPlacement.copyText}
                        </div>
                      </div>
                    </div>

                    {/* Reach Booster Checklist */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                      <div className="font-bold text-slate-700 dark:text-slate-300">⚡ Reach Booster Checklist:</div>
                      <ul className="space-y-1 text-slate-500 dark:text-slate-400 pl-1">
                        {idea.reachBoosterChecklist.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-emerald-500 shrink-0 stroke-[3]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* VIEW MODE: TABLE */
            <div className="overflow-x-auto bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold border-b border-slate-200 dark:border-slate-700 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Hari & Platform</th>
                    <th className="p-3.5">Pilar & Utas</th>
                    <th className="p-3.5">Hook (Score)</th>
                    <th className="p-3.5">Body Preview</th>
                    <th className="p-3.5">Penempatan Link</th>
                    <th className="p-3.5">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredIdeas.map((idea) => (
                    <tr key={idea.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <div>{idea.dayName}</div>
                        <div className="text-[10px] text-indigo-600 dark:text-rose-400 mt-0.5 font-bold">{idea.platform} &bull; {idea.postTime}</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap space-y-1">
                        <div>
                          <span className="px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium border border-slate-200 dark:border-slate-700">
                            {idea.contentType}
                          </span>
                        </div>
                        <span className="inline-block px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-900">
                          💬 {idea.threadCount || 1} Utas
                        </span>
                      </td>
                      <td className="p-3.5 max-w-xs">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 italic line-clamp-2">"{idea.hook}"</div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                          Score: {idea.hookScore.total}/10
                        </div>
                      </td>
                      <td className="p-3.5 max-w-xs line-clamp-3 text-slate-600 dark:text-slate-400">
                        {idea.body}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-[11px] font-bold text-indigo-700 dark:text-rose-400">
                        {idea.linkPlacement.placement}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <button
                          onClick={() => handleCopy(idea.body, idea.id)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 text-indigo-700 dark:text-rose-300 rounded hover:bg-indigo-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          {copiedId === idea.id ? 'Tersalin!' : 'Salin Copy'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KONTEN PILAR */}
      {activeTab === 'pillars' && (
        <div className="space-y-6">
          <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-rose-400" />
              <span>Struktur Pilar Konten Strategis ({result.productName})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilar konten membagi porsi topik agar audiens tidak merasa terus-menerus di-hardsell.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.contentPillars.map((pillar) => (
              <div
                key={pillar.id}
                className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 hover:border-indigo-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{pillar.name}</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-50 dark:bg-rose-950/50 text-indigo-700 dark:text-rose-300 border border-indigo-200 dark:border-rose-900">
                    Alokasi: {pillar.percentage}%
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {pillar.description}
                </p>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs space-y-1">
                  <span className="font-bold text-indigo-700 dark:text-rose-400">Tujuan Utama:</span>
                  <p className="text-slate-600 dark:text-slate-300">{pillar.purpose}</p>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Contoh Angle Post:</span>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pl-1">
                    {pillar.exampleAngles.map((angle, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold">&bull;</span>
                        <span>{angle}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: COPY & HOOK HUB */}
      {activeTab === 'copy_hub' && (
        <div className="space-y-6">
          <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Copy className="w-5 h-5 text-indigo-600 dark:text-rose-400" />
              <span>Copywriting & Hook Quick Copy Hub</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kumpulan semua hook dan body copywriting siap salin untuk jadwalkan postingan harianmu.
            </p>
          </div>

          <div className="space-y-4">
            {result.contentIdeas.map((idea) => (
              <div
                key={idea.id}
                className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-indigo-700 dark:text-rose-400">
                      {idea.dayName} [{idea.platform}] - {idea.contentType}
                    </span>
                    <span className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 px-2 py-0.5 rounded font-bold text-[10px]">
                      💬 {idea.threadCount || 1} Utas
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(`${idea.hook}\n\n${idea.body}`, idea.id)}
                    className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    {copiedId === idea.id ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === idea.id ? 'Tersalin!' : 'Salin Seluruh Utas'}</span>
                  </button>
                </div>

                {idea.threadReasoning && (
                  <p className="text-[11px] text-rose-900 dark:text-rose-200 bg-rose-50/60 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-100 dark:border-rose-900/40">
                    🧠 <strong>Alasan AI ({idea.threadCount || 1} Utas):</strong> {idea.threadReasoning}
                  </p>
                )}

                <div className="space-y-2">
                  {idea.threadPosts && idea.threadPosts.length > 0 ? (
                    <div className="space-y-2">
                      {idea.threadPosts.map((postText, pIdx) => (
                        <div key={pIdx} className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-1 relative">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 pb-1 border-b border-slate-200/80 dark:border-slate-700">
                            <span className="text-indigo-600 dark:text-rose-400 uppercase tracking-wider font-black">
                              {idea.threadPosts.length === 1 ? 'Post Utama (Utas 1/1)' : `Utas ${pIdx + 1} dari ${idea.threadPosts.length}`}
                            </span>
                            <button
                              onClick={() => handleCopy(postText, `hub_${idea.id}_p${pIdx}`)}
                              className="text-[10px] text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 flex items-center gap-1 bg-white dark:bg-slate-900 hover:bg-indigo-50 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                            >
                              {copiedId === `hub_${idea.id}_p${pIdx}` ? (
                                <span className="text-emerald-500 flex items-center gap-0.5"><Check className="w-3 h-3" /> Tersalin!</span>
                              ) : (
                                <span className="flex items-center gap-0.5"><Copy className="w-3 h-3" /> Salin Utas Ini</span>
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-slate-800 dark:text-slate-100 font-sans whitespace-pre-line leading-relaxed">
                            {postText}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 font-sans whitespace-pre-line leading-relaxed">
                      <span className="font-bold text-slate-900 dark:text-white block mb-1 text-sm italic">"{idea.hook}"</span>
                      {idea.body}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STRATEGI & ALGORITMA CHECKLIST */}
      {activeTab === 'strategy' && (
        <div className="space-y-6">
          <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-rose-400" />
              <span>Rangkuman Strategi & Formulasi Algoritma</span>
            </h2>

            <div className="bg-indigo-50/60 dark:bg-indigo-950/40 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 space-y-1.5 text-xs">
              <div className="font-bold text-indigo-800 dark:text-indigo-300 text-sm">Formula Strategi Terpilih:</div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{result.strategySummary.ruleSummary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-3">
                <div className="font-bold text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  ⏰ Rekomendasi Jam Posting Terbaik:
                </div>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {result.strategySummary.bestPostingTimes.map((time, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{time}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-3">
                <div className="font-bold text-xs text-indigo-700 dark:text-rose-400 uppercase tracking-wider">
                  ⚡ Tips Algoritma & Penalti Reach:
                </div>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {result.strategySummary.algorithmTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
