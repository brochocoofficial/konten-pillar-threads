import React from 'react';
import { X, CheckCircle, AlertTriangle, ShieldCheck, Zap, Sparkles } from 'lucide-react';

interface SystemInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemInstructionsModal: React.FC<SystemInstructionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-800 dark:text-slate-100">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Framework & Aturan Algoritma PILLARFLOW</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Algoritma, Formula Match, dan Penempatan Link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {/* Threads Rules */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-rose-400 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-rose-400" />
              <span>1. Formula Master Threads (Content Planner & Affiliate)</span>
            </div>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span><strong className="text-amber-800 dark:text-amber-300">LINK SAFETY FIRST:</strong> Dilarang keras menaruh link produk di body post utama (kena penalti reach -70%). Link HANYA boleh ditaruh di <strong>Comment #1</strong> setelah post mencapai &ge; 500 views.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[3]" />
                <span><strong>70-20-10 CONTENT MIX:</strong> 70% Value (Edukasi/Problem), 20% Relate (Demo/Story), 10% Selling (Testimoni/Offer).</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-indigo-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span><strong>FORMULA HOOK VIRALITY:</strong> Score = (Curiosity x 0.4) + (Relatability x 0.3) + (Specificity x 0.3). Minimal Score 7.0 untuk lolos.</span>
              </li>
            </ul>
          </div>

          {/* X (Twitter) Rules */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-bold text-sm">
              <Zap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>2. Formula Master X / Twitter (4-1-1 Rule)</span>
            </div>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[3]" />
                <span><strong>CYCLE 4-1-1:</strong> 4 Post Value (Edukasi, Tips, Poll, Hot Take) &rarr; 1 Soft Promo (Testimoni, BTS) &rarr; 1 Hard Promo (Demo + CTA).</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span><strong>LINK PLACEMENT X:</strong> Link di main post kena penalti reach ~30-50%. Link harus ditaruh di <strong>Reply Pertama</strong>, Thread ke-2, atau diarahkan ke Bio.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5 stroke-[3]" />
                <span><strong>BOOST ALGORITMA 2026:</strong> Reply memegang bobot tertinggi (&sim;13x Like). Selalu akhiri post value dengan pertanyaan terbuka untuk memancing kuis/reply.</span>
              </li>
            </ul>
          </div>

          {/* Target Audience & Tone */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-rose-400 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-rose-400" />
              <span>3. Target Audiens & Tone Matching Matrix</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="font-bold text-indigo-700 dark:text-rose-400 mb-1">Threads Audiences:</div>
                <p>&bull; Gen Z Overthinker (Raw curhat, self-deprecating)</p>
                <p>&bull; Ibu Muda Smart Buyer (Jujur, bun, hemat waktu)</p>
                <p>&bull; Cowok Praktis (To the point, &le; 3 baris)</p>
                <p>&bull; Pejuang Cuan (Blunt review, bandingin harga)</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="font-bold text-sky-700 dark:text-sky-400 mb-1">X (Twitter) Audiences:</div>
                <p>&bull; Tech & Founders (Insightful, data, frameworks)</p>
                <p>&bull; Gen Z Chillers (Hot takes, meme, edgy)</p>
                <p>&bull; Career Seekers (Actionable tips, bookmarking)</p>
                <p>&bull; Deal Hunters (Soft sell, value first)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-rose-500 hover:from-indigo-700 hover:to-rose-600 text-white font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
