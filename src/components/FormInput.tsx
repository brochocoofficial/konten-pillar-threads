import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Check, 
  Zap, 
  Sliders, 
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Tag,
  MousePointerClick
} from 'lucide-react';
import { 
  PlatformType, 
  GenerateFormInput, 
  PresetData 
} from '../types';
import { 
  TARGET_AUDIENCES_THREADS, 
  TARGET_AUDIENCES_X, 
  TONE_OPTIONS_THREADS, 
  TONE_OPTIONS_X, 
  CATEGORIES_LIST, 
  GOALS_LIST, 
  PRESETS_LIST 
} from '../data/presetsAndOptions';

interface FormInputProps {
  onSubmit: (data: GenerateFormInput) => void;
  isLoading: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({ onSubmit, isLoading }) => {
  // Form State
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState(GOALS_LIST[0]);
  const [platform, setPlatform] = useState<PlatformType>('both');
  const [targetAudiences, setTargetAudiences] = useState<string[]>([]);
  const [toneContents, setToneContents] = useState<string[]>([]);
  
  // Optional Fields
  const [productUrl, setProductUrl] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Preset Filter State for Quick Presets Section
  const [presetCategoryFilter, setPresetCategoryFilter] = useState<string>('Semua');

  // Loading Steps Animation
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    'Menganalisis Niche Produk & Karakter Audiens...',
    'Menghitung Virality Hook Score & Formula Penasaran...',
    'Menerapkan Link Safety & Rules Formulasi Algoritma...',
    'Menyusun Struktur 7-Day Planner & Rangkaian Utas...'
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Validation Error state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 1. Autofill Preset
  const handleSelectPreset = (preset: PresetData) => {
    setProductName(preset.productName);
    setCategory(preset.category);
    setCustomCategory('');
    setDescription(preset.description);
    setGoal(preset.goal);
    setPlatform(preset.platform);
    setTargetAudiences(preset.targetAudiences);
    setToneContents(preset.toneContents);
    if (preset.productUrl) setProductUrl(preset.productUrl);
    if (preset.price) setPrice(preset.price);
    if (preset.duration) setDuration(preset.duration);
    setErrors({});
  };

  // Helper for Audience Checkboxes
  const toggleAudience = (name: string) => {
    if (targetAudiences.includes(name)) {
      setTargetAudiences(targetAudiences.filter((item) => item !== name));
    } else {
      setTargetAudiences([...targetAudiences, name]);
    }
  };

  // Helper for Tone Checkboxes
  const toggleTone = (name: string) => {
    if (toneContents.includes(name)) {
      setToneContents(toneContents.filter((item) => item !== name));
    } else {
      setToneContents([...toneContents, name]);
    }
  };

  // Audience List based on Platform
  const getAvailableAudiences = () => {
    if (platform === 'threads') {
      return { threads: TARGET_AUDIENCES_THREADS, x: [] };
    }
    if (platform === 'x') {
      return { threads: [], x: TARGET_AUDIENCES_X };
    }
    return { threads: TARGET_AUDIENCES_THREADS, x: TARGET_AUDIENCES_X };
  };

  // Tone List based on Platform
  const getAvailableTones = () => {
    if (platform === 'threads') {
      return { threads: TONE_OPTIONS_THREADS, x: [] };
    }
    if (platform === 'x') {
      return { threads: [], x: TONE_OPTIONS_X };
    }
    return { threads: TONE_OPTIONS_THREADS, x: TONE_OPTIONS_X };
  };

  const handleSelectAllAudiences = () => {
    const { threads, x } = getAvailableAudiences();
    const all = [...threads.map((a) => a.name), ...x.map((a) => a.name)];
    setTargetAudiences(all);
  };

  const handleClearAudiences = () => {
    setTargetAudiences([]);
  };

  const handleSelectAllTones = () => {
    const { threads, x } = getAvailableTones();
    const all = [...threads.map((t) => t.name), ...x.map((t) => t.name)];
    setToneContents(all);
  };

  const handleClearTones = () => {
    setToneContents([]);
  };

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!productName.trim()) {
      newErrors.productName = 'Nama produk / Niche wajib diisi.';
    }

    const finalCategory = category === 'Lainnya' ? customCategory : category;
    if (!finalCategory.trim()) {
      newErrors.category = 'Pilih atau ketik kategori produk.';
    }

    if (!description.trim()) {
      newErrors.description = 'Deskripsi produk wajib diisi.';
    }

    if (targetAudiences.length === 0) {
      newErrors.targetAudiences = 'Pilih minimal 1 target audiens (bisa pilih beberapa).';
    }

    if (toneContents.length === 0) {
      newErrors.toneContents = 'Pilih minimal 1 tone konten (bisa pilih beberapa).';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 200, behavior: 'smooth' });
      return;
    }

    setErrors({});
    onSubmit({
      productName: productName.trim(),
      category: finalCategory,
      description: description.trim(),
      goal,
      platform,
      targetAudiences,
      toneContents,
      productUrl: productUrl.trim() || undefined,
      price: price.trim() || undefined,
      duration: duration.trim() || undefined
    });
  };

  const availableAudiences = getAvailableAudiences();
  const availableTones = getAvailableTones();

  // Filter presets
  const filteredPresets = PRESETS_LIST.filter((p) => {
    if (presetCategoryFilter === 'Semua') return true;
    return p.category.toLowerCase().includes(presetCategoryFilter.toLowerCase());
  });

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-3 sm:px-6 space-y-4 sm:space-y-8">
      {/* Hero Header Section */}
      <div className="text-center space-y-2.5 bg-gradient-to-b from-rose-500/10 via-indigo-500/5 to-transparent p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider shadow-2xs">
          <Zap className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>Formula Master Content Planner</span>
        </div>
        
        <h1 className="text-xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Perencanaan Pilar Konten & 7-Hari Utas Algoritmik
        </h1>
        
        <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed">
          Otomatisasi pilar konten, hook virality score, & rangkaian utas siap pakai berbasis <span className="text-indigo-600 dark:text-rose-400 font-bold">Audience Matrix</span> & <span className="text-indigo-600 dark:text-indigo-400 font-bold">Rule Algoritma 2026</span>.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Export PDF
          </span>
          <span className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Saved to History
          </span>
          <span className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Hook Virality Score
          </span>
        </div>
      </div>

      {/* QUICK PRESETS (CONTOH CEPAT - MINIMALIST REDESIGN) */}
      <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            <MousePointerClick className="w-4 h-4 text-rose-500" />
            <span>Contoh Cepat (1-Click Autofill)</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Pilih preset untuk langsung mengisi formulir:
          </span>
        </div>

        {/* Minimalist Filter Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs touch-pan-x">
          {['Semua', 'Skincare', 'AI & Tech', 'F&B', 'Fashion'].map((catLabel) => (
            <button
              key={catLabel}
              type="button"
              onClick={() => setPresetCategoryFilter(catLabel)}
              className={`px-3 py-1 rounded-full font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                presetCategoryFilter === catLabel
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {catLabel}
            </button>
          ))}
        </div>

        {/* Compact Sleek Preset Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {filteredPresets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-rose-50/60 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/80 hover:border-rose-300 dark:hover:border-rose-800 transition-all duration-150 cursor-pointer group flex items-start justify-between gap-2.5"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    {preset.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                  {preset.description}
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-500 transition-all">
                Pilih
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: PRODUK & DESKRIPSI */}
        <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 font-extrabold text-xs">
              01
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                Identitas Produk & Niche
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Masukkan nama produk, kategori, dan deskripsi singkat
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nama Produk */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Produk / Brand / Niche <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. SaaS Marketing Tool, Serum Skin Care"
                className={`w-full bg-white dark:bg-slate-800/80 border ${
                  errors.productName ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-600'
                } rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-4 outline-none transition-all`}
              />
              {errors.productName && (
                <p className="text-xs text-rose-500 font-medium mt-1">{errors.productName}</p>
              )}
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Kategori <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full bg-white dark:bg-slate-800/80 border ${
                  errors.category ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-600'
                } rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:ring-4 outline-none transition-all cursor-pointer`}
              >
                <option value="">-- Pilih Kategori --</option>
                {CATEGORIES_LIST.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Lainnya">Lainnya (Ketik Manual)</option>
              </select>
              {category === 'Lainnya' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Masukkan nama kategori custom..."
                  className="w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                />
              )}
              {errors.category && (
                <p className="text-xs text-rose-500 font-medium mt-1">{errors.category}</p>
              )}
            </div>
          </div>

          {/* Deskripsi Produk */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Deskripsi Produk & Solusi Masalah <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsikan fungsi utama produk, keunggulan, dan masalah yang diselesaikan (e.g. Dashboard AI untuk memantau sentimen pelanggan secara real-time)..."
              className={`w-full bg-white dark:bg-slate-800/80 border ${
                errors.description ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-600'
              } rounded-xl p-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-4 outline-none transition-all resize-none leading-relaxed`}
            />
            {errors.description && (
              <p className="text-xs text-rose-500 font-medium mt-1">{errors.description}</p>
            )}
          </div>
        </div>

        {/* SECTION 2: TUJUAN (GOAL) & PLATFORM */}
        <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 font-extrabold text-xs">
              02
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                Tujuan Kampanye & Target Platform
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tentukan tujuan utama dan media yang ditargetkan
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tujuan */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Tujuan Utama Kampanye Konten <span className="text-rose-500">*</span>
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all cursor-pointer"
              >
                {GOALS_LIST.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Platform Choice */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Target Platform <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPlatform('threads')}
                  className={`py-3 px-2.5 rounded-xl border-2 text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer min-h-[44px] ${
                    platform === 'threads'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold">Threads</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">70-20-10</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPlatform('x')}
                  className={`py-3 px-2.5 rounded-xl border-2 text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer min-h-[44px] ${
                    platform === 'x'
                      ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold">X (Twitter)</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">4-1-1 Rule</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPlatform('both')}
                  className={`py-3 px-2.5 rounded-xl border-2 text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer min-h-[44px] ${
                    platform === 'both'
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold">Keduanya</span>
                  <span className="text-[10px] opacity-80 font-normal">Dual Strategy</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: TARGET AUDIENS (MULTI-SELECT) */}
        <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 font-extrabold text-xs">
                03
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                  Target Audience Matrix <span className="text-rose-500">*</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pilih audiens spesifik yang disasar</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs self-end sm:self-center">
              <button
                type="button"
                onClick={handleSelectAllAudiences}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
              >
                Pilih Semua
              </button>
              <button
                type="button"
                onClick={handleClearAudiences}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {errors.targetAudiences && (
            <p className="text-xs text-rose-600 font-medium bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 p-3 rounded-xl">
              {errors.targetAudiences}
            </p>
          )}

          {/* Threads Audiences */}
          {availableAudiences.threads.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-indigo-600 dark:text-rose-400 uppercase tracking-wider">
                Target Audiens Threads:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableAudiences.threads.map((aud) => {
                  const isChecked = targetAudiences.includes(aud.name);
                  return (
                    <div
                      key={aud.id}
                      onClick={() => toggleAudience(aud.name)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-indigo-600 dark:bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-xs flex items-center gap-2">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isChecked ? 'bg-white text-indigo-600 border-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 text-indigo-600 stroke-[3]" />}
                          </div>
                          <span className={isChecked ? 'text-white' : 'text-slate-900 dark:text-slate-100'}>{aud.name} ({aud.age})</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          isChecked ? 'bg-indigo-700 text-white' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        }`}>Threads</span>
                      </div>
                      <p className={`text-xs mt-1.5 pl-6 leading-normal ${isChecked ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        <strong>Tone:</strong> {aud.vibe}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* X Audiences */}
          {availableAudiences.x.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                Target Audiens X (Twitter):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableAudiences.x.map((aud) => {
                  const isChecked = targetAudiences.includes(aud.name);
                  return (
                    <div
                      key={aud.id}
                      onClick={() => toggleAudience(aud.name)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-xs flex items-center gap-2">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isChecked ? 'bg-white text-sky-600 border-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 text-sky-600 stroke-[3]" />}
                          </div>
                          <span className={isChecked ? 'text-white' : 'text-slate-900 dark:text-slate-100'}>{aud.name} ({aud.age})</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          isChecked ? 'bg-sky-700 text-white' : 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                        }`}>X</span>
                      </div>
                      <p className={`text-xs mt-1.5 pl-6 leading-normal ${isChecked ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        <strong>Vibe:</strong> {aud.vibe}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: TONE KONTEN (MULTI-SELECT) */}
        <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 font-extrabold text-xs">
                04
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                  Content Tone & Style <span className="text-rose-500">*</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pilih gaya tulisan yang diinginkan</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs self-end sm:self-center">
              <button
                type="button"
                onClick={handleSelectAllTones}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
              >
                Pilih Semua
              </button>
              <button
                type="button"
                onClick={handleClearTones}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {errors.toneContents && (
            <p className="text-xs text-rose-600 font-medium bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 p-3 rounded-xl">
              {errors.toneContents}
            </p>
          )}

          {/* Threads Tones */}
          {availableTones.threads.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-indigo-600 dark:text-rose-400 uppercase tracking-wider">Tone Threads:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableTones.threads.map((t) => {
                  const isChecked = toneContents.includes(t.name);
                  return (
                    <div
                      key={t.id}
                      onClick={() => toggleTone(t.name)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-xs flex items-center gap-2">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isChecked ? 'bg-white text-indigo-600 border-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 text-indigo-600 stroke-[3]" />}
                          </div>
                          <span className={isChecked ? 'text-white' : 'text-slate-900 dark:text-slate-100'}>{t.name}</span>
                        </div>
                      </div>
                      <p className={`text-xs mt-1.5 pl-6 leading-normal ${isChecked ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>{t.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* X Tones */}
          {availableTones.x.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Tone X (Twitter):</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableTones.x.map((t) => {
                  const isChecked = toneContents.includes(t.name);
                  return (
                    <div
                      key={t.id}
                      onClick={() => toggleTone(t.name)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-xs flex items-center gap-2">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isChecked ? 'bg-white text-sky-600 border-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 text-sky-600 stroke-[3]" />}
                          </div>
                          <span className={isChecked ? 'text-white' : 'text-slate-900 dark:text-slate-100'}>{t.name}</span>
                        </div>
                      </div>
                      <p className={`text-xs mt-1.5 pl-6 leading-normal ${isChecked ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'}`}>{t.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: ADVANCED / OPTIONAL DETAILS */}
        <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-rose-500" />
              <span>Detail Tambahan Produk (Opsional)</span>
            </span>
            <span className="text-rose-600 dark:text-rose-400 underline text-xs font-bold lowercase">
              {showAdvanced ? 'sembunyikan' : 'tampilkan detail'}
            </span>
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Link Produk (URL)
                </label>
                <input
                  type="text"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Harga / Promo
                </label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Rp 99.000"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Durasi Hasil
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 12 hari"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* LOADING ANIMATION OVERLAY / STATE */}
        {isLoading && (
          <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4 animate-pulse">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-rose-400" />
              <div>
                <h3 className="font-extrabold text-base sm:text-lg">Sedang Menyusun Perencanaan Konten...</h3>
                <p className="text-xs text-slate-300">Mohon tunggu sebentar, AI sedang menerapkan formula khusus.</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              {loadingSteps.map((stepMsg, sIdx) => (
                <div key={sIdx} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${sIdx <= loadingStep ? 'bg-rose-500' : 'bg-slate-700'}`} />
                  <span className={sIdx <= loadingStep ? 'text-white font-semibold' : 'text-slate-500'}>
                    {stepMsg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBMIT GENERATE BUTTON */}
        {!isLoading && (
          <div className="pt-2 sticky bottom-16 md:bottom-6 z-20 backdrop-blur-md bg-slate-50/80 dark:bg-slate-950/80 p-2 sm:p-0 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 sm:border-0 shadow-lg sm:shadow-none">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-rose-500 hover:from-indigo-700 hover:to-rose-600 shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/35 hover:scale-[1.005] active:scale-[0.995] flex items-center justify-center gap-2 sm:gap-3 transition-all duration-200 cursor-pointer min-h-[48px] sm:min-h-[52px]"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span>Generate Content Pillars & 7-Day Utas</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <p className="text-center text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              Sistem akan memproses Pilar Konten, Score Virality Hook, & Rangkaian Utas siap simpan PDF.
            </p>
          </div>
        )}
      </form>
    </div>
  );
};
