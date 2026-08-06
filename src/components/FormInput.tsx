import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Check, 
  Zap, 
  Sliders, 
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Tag,
  MousePointerClick,
  Database,
  BookOpen,
  Layers,
  ShieldAlert,
  Target,
  Heart,
  X,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Globe,
  Loader2,
  AlertCircle,
  Plus,
  RotateCcw,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  PlatformType, 
  GenerateFormInput, 
  PresetData 
} from '../types';
import { 
  TARGET_AUDIENCES_THREADS, 
  TONE_OPTIONS_THREADS, 
  CATEGORIES_LIST, 
  GOALS_LIST, 
  PRESETS_LIST,
  CONTENT_ANGLES_LIST
} from '../data/presetsAndOptions';
import { 
  PRODUCT_KNOWLEDGE_BASE, 
  ProductKnowledgeItem 
} from '../data/productKnowledgeBase';

interface FormInputProps {
  onSubmit: (data: GenerateFormInput) => void;
  isLoading: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({ onSubmit, isLoading }) => {
  const { token } = useAuth();

  // Form State
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState(GOALS_LIST[0]);
  const [platform] = useState<PlatformType>('threads');
  const [targetAudiences, setTargetAudiences] = useState<string[]>([]);
  const [toneContents, setToneContents] = useState<string[]>([]);
  const [contentAngles, setContentAngles] = useState<string[]>(['Kesalahan Pemula', 'Tutorial & Step by Step', 'Problem Solution']);

  // Link Analysis State
  const [linkInput, setLinkInput] = useState('');
  const [isAnalyzingLink, setIsAnalyzingLink] = useState(false);
  const [analyzeSuccessMsg, setAnalyzeSuccessMsg] = useState<string | null>(null);
  const [analyzeErrorMsg, setAnalyzeErrorMsg] = useState<string | null>(null);
  const [analyzedLinkResult, setAnalyzedLinkResult] = useState<{
    productName?: string;
    brand?: string;
    category?: string;
    description?: string;
    price?: string;
    usp?: string;
    valueProposition?: string;
    targetAudiences?: string[];
    painPoints?: string[];
    benefits?: string[];
    features?: string[];
    objections?: string[];
    cta?: string[];
    toneContents?: string[];
  } | null>(null);
  
  // Product Knowledge Base State (including uploaded PKs)
  const [allPKs, setAllPKs] = useState<ProductKnowledgeItem[]>(() => {
    const saved = localStorage.getItem('custom_product_knowledge');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [...PRODUCT_KNOWLEDGE_BASE, ...parsed];
      } catch (err) {
        console.error('Failed to parse custom product knowledge:', err);
      }
    }
    return PRODUCT_KNOWLEDGE_BASE;
  });

  const [selectedPK, setSelectedPK] = useState<ProductKnowledgeItem | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Optional Fields
  const [productUrl, setProductUrl] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Loading Steps Animation
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    'Menganalisis Product Knowledge & Matrix Audiens Threads...',
    'Menghitung Virality Hook Score & Angle Konten...',
    'Menerapkan Rules Formulasi Algoritma Threads 2026...',
    'Menyusun 30 Utas Threads Berkelanjutan...'
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

  // Handle File Upload & Processing for Product Knowledge
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      let newPKItem: ProductKnowledgeItem;
      const fileNameClean = file.name.replace(/\.[^/.]+$/, "");

      try {
        // Try parsing JSON
        const parsed = JSON.parse(content);
        const pkObj = Array.isArray(parsed) ? parsed[0] : parsed;

        newPKItem = {
          id: pkObj.id || `PK_UPLOAD_${Date.now()}`,
          category: pkObj.category || 'Custom Product Knowledge',
          product_name: pkObj.product_name || pkObj.productName || fileNameClean,
          description: pkObj.description || 'Deskripsi otomatis dari file unggahan.',
          target_audience: Array.isArray(pkObj.target_audience) ? pkObj.target_audience : (pkObj.targetAudiences || ['Content Creator Pemula']),
          pain_points: Array.isArray(pkObj.pain_points) ? pkObj.pain_points : (pkObj.painPoints || []),
          benefits: Array.isArray(pkObj.benefits) ? pkObj.benefits : [],
          features: Array.isArray(pkObj.features) ? pkObj.features : [],
          objections: Array.isArray(pkObj.objections) ? pkObj.objections : [],
          cta: Array.isArray(pkObj.cta) ? pkObj.cta : [],
          price: pkObj.price || '',
          product_url: pkObj.product_url || pkObj.productUrl || ''
        };
      } catch {
        // Fallback for Plain Text / Markdown / CSV
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        newPKItem = {
          id: `PK_UPLOAD_${Date.now()}`,
          category: 'Document Reference',
          product_name: lines[0]?.substring(0, 60) || fileNameClean,
          description: content.substring(0, 500),
          target_audience: ['General Audience', 'Content Creator'],
          pain_points: lines.filter(l => l.toLowerCase().includes('masalah') || l.toLowerCase().includes('pain')).slice(0, 5),
          benefits: lines.filter(l => l.toLowerCase().includes('manfaat') || l.toLowerCase().includes('benefit')).slice(0, 5),
          features: lines.filter(l => l.toLowerCase().includes('fitur') || l.toLowerCase().includes('feature')).slice(0, 5),
          objections: [],
          cta: lines.filter(l => l.toLowerCase().includes('cta') || l.toLowerCase().includes('link')).slice(0, 5)
        };
      }

      // Add to state and localStorage
      setAllPKs((prev) => {
        const filtered = prev.filter(p => p.id !== newPKItem.id);
        const updated = [newPKItem, ...filtered];
        
        // Save user uploaded PKs to localStorage
        const customItems = updated.filter(p => p.id.startsWith('PK_UPLOAD'));
        localStorage.setItem('custom_product_knowledge', JSON.stringify(customItems));
        
        return updated;
      });

      // Auto select newly uploaded PK
      handleSelectPK(newPKItem);
      setUploadSuccessMsg(`✅ File "${file.name}" berhasil diproses & ditambahkan ke database Product Knowledge!`);

      // Clear input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  // Link Analysis Loading Step State
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [analysisStepLabel, setAnalysisStepLabel] = useState<string>('');
  const [showAnalysisFallback, setShowAnalysisFallback] = useState<boolean>(false);

  // Handle Auto Analysis of Product Link with 6-Step Workflow & Fallback
  const handleAnalyzeLink = async () => {
    if (!linkInput.trim()) {
      setAnalyzeErrorMsg('Silakan tempel URL link produk terlebih dahulu.');
      return;
    }

    setIsAnalyzingLink(true);
    setAnalyzeErrorMsg(null);
    setAnalyzeSuccessMsg(null);
    setShowAnalysisFallback(false);
    setAnalysisStep(1);
    setAnalysisStepLabel('Step 1: Validasi URL...');

    // Timer for realistic progress feedback across the 6-step pipeline
    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => {
        if (prev === 1) {
          setAnalysisStepLabel('Step 2: Mendeteksi Short Link & Redirect (301/302/JS)...');
          return 2;
        } else if (prev === 2) {
          setAnalysisStepLabel('Step 3: Membaca Canonical URL & Platform...');
          return 3;
        } else if (prev === 3) {
          setAnalysisStepLabel('Step 4: Ekstraksi Metadata (JSON-LD, Meta Tags, HTML)...');
          return 4;
        } else if (prev === 4) {
          setAnalysisStepLabel('Step 5: Menyusun Product Knowledge...');
          return 5;
        } else if (prev === 5) {
          setAnalysisStepLabel('Step 6: AI Market Research & Detail Produk...');
          return 6;
        }
        return prev;
      });
    }, 1200);

    try {
      const response = await fetch('/api/analyze-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ url: linkInput.trim() })
      });

      clearInterval(stepInterval);

      const data = await response.json();

      if (!response.ok || !data.success) {
        setShowAnalysisFallback(true);
        throw new Error(data.message || data.error || 'Gagal membaca halaman produk.');
      }

      // Auto-fill form fields based on AI analysis
      setAnalyzedLinkResult(data);

      if (data.productName) {
        setProductName(data.productName);
      }

      if (data.description) {
        setDescription(data.description);
      }

      if (data.category) {
        const catLower = data.category.toLowerCase();
        const foundCat = CATEGORIES_LIST.find(c => 
          c.toLowerCase() === catLower || 
          catLower.includes(c.toLowerCase()) || 
          c.toLowerCase().includes(catLower)
        );
        if (foundCat) {
          setCategory(foundCat);
          setCustomCategory('');
        } else {
          setCategory('Lainnya');
          setCustomCategory(data.category);
        }
      }

      if (data.targetAudiences && Array.isArray(data.targetAudiences) && data.targetAudiences.length > 0) {
        setTargetAudiences(data.targetAudiences.slice(0, 4));
      }

      if (data.toneContents && Array.isArray(data.toneContents) && data.toneContents.length > 0) {
        setToneContents(data.toneContents.slice(0, 3));
      }

      if (data.price) {
        setPrice(data.price);
      }

      setProductUrl(data.canonicalUrl || linkInput.trim());

      // Set active Product Knowledge from analyzed data
      const linkPK: ProductKnowledgeItem = {
        id: `PK_LINK_${Date.now()}`,
        product_name: data.productName || 'Produk Analisis Link',
        category: data.category || 'Hasil Analisis Link',
        description: data.description || '',
        target_audience: data.targetAudiences || [],
        usp: data.usp || '',
        value_proposition: data.valueProposition || '',
        pain_points: data.painPoints || [],
        benefits: data.benefits || [],
        features: data.features || [],
        objections: data.objections || [],
        cta: data.cta || [],
        tone_contents: data.toneContents || [],
        file_path: 'ANALYZED_LINK',
        created_at: new Date().toISOString()
      };

      setSelectedPK(linkPK);
      setAnalyzeSuccessMsg(`Berhasil menganalisis "${data.productName}" dari Canonical URL! Form telah terisi otomatis.`);
    } catch (err: any) {
      clearInterval(stepInterval);
      setAnalyzeErrorMsg(err.message || 'Gagal menganalisis link produk.');
      setShowAnalysisFallback(true);
    } finally {
      setIsAnalyzingLink(false);
      setAnalysisStep(0);
      setAnalysisStepLabel('');
    }
  };

  // Select Product Knowledge Item
  const handleSelectPK = (pkItem: ProductKnowledgeItem) => {
    setSelectedPK(pkItem);
    setProductName(pkItem.product_name);
    setCategory(pkItem.category);
    setCustomCategory('');
    setDescription(pkItem.description);
    
    // Auto select audience if match found
    if (pkItem.target_audience && pkItem.target_audience.length > 0) {
      setTargetAudiences(pkItem.target_audience.slice(0, 3));
    } else if (targetAudiences.length === 0) {
      setTargetAudiences(['Content Creator Pemula']);
    }
    
    if (toneContents.length === 0) {
      setToneContents(['Friendly & Ngobrol (Santai)', 'Edukatif & Step-by-Step']);
    }

    if (pkItem.price) setPrice(pkItem.price);
    if (pkItem.product_url) setProductUrl(pkItem.product_url);

    setErrors({});
  };

  // Clear Selected PK
  const handleClearPK = () => {
    setSelectedPK(null);
  };

  // 1. Autofill Preset
  const handleSelectPreset = (preset: PresetData) => {
    // Check if preset matches any PK
    const pkMatch = allPKs.find(pk => pk.id === preset.id || pk.product_name.toLowerCase() === preset.productName.toLowerCase());
    if (pkMatch) {
      setSelectedPK(pkMatch);
    } else {
      setSelectedPK(null);
    }

    setProductName(preset.productName);
    setCategory(preset.category);
    setCustomCategory('');
    setDescription(preset.description);
    setGoal(preset.goal);
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

  const handleSelectAllAudiences = () => {
    setTargetAudiences(TARGET_AUDIENCES_THREADS.map((a) => a.name));
  };

  const handleClearAudiences = () => {
    setTargetAudiences([]);
  };

  const handleSelectAllTones = () => {
    setToneContents(TONE_OPTIONS_THREADS.map((t) => t.name));
  };

  const handleClearTones = () => {
    setToneContents([]);
  };

  const handleSelectAllAngles = () => {
    setContentAngles([...CONTENT_ANGLES_LIST]);
  };

  const handleClearAngles = () => {
    setContentAngles([]);
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

    if (contentAngles.length === 0) {
      newErrors.contentAngles = 'Pilih minimal 1 angle konten.';
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
      platform: 'threads',
      targetAudiences,
      toneContents,
      contentAngles,
      productUrl: productUrl.trim() || undefined,
      price: price.trim() || undefined,
      duration: duration.trim() || undefined,
      productKnowledgeId: selectedPK?.id,
      painPoints: selectedPK?.pain_points,
      benefits: selectedPK?.benefits,
      features: selectedPK?.features,
      objections: selectedPK?.objections,
      cta: selectedPK?.cta
    });
  };

  // Uploaded Custom PKs list
  const customUploadedPKs = allPKs.filter(p => p.id.startsWith('PK_UPLOAD'));

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-3 sm:px-6 space-y-4 sm:space-y-8">
      {/* Hero Header Section */}
      <div className="text-center space-y-2.5 bg-gradient-to-b from-rose-500/10 via-indigo-500/5 to-transparent p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider shadow-2xs">
          <Zap className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>Formula Master Content Planner</span>
        </div>
        
        <h1 className="text-xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Perencanaan Pilar Konten & 30-Hari Utas Algoritmik
        </h1>
        
        <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed">
          Otomatisasi pilar konten, hook virality score, & 30 rangkaian utas siap pakai berbasis <span className="text-indigo-600 dark:text-rose-400 font-bold">Audience Matrix</span> & <span className="text-indigo-600 dark:text-indigo-400 font-bold">Rule Algoritma Threads 2026</span>.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Export PDF
          </span>
          <span className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Auto Product Knowledge
          </span>
          <span className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 4 - 8 Dynamic Utas / Konten
          </span>
        </div>
      </div>

      {/* LINK PRODUK (AUTO ANALYSIS AI) SECTION */}
      <div className="bg-gradient-to-r from-indigo-900/10 via-rose-900/10 to-indigo-900/10 dark:from-indigo-950/40 dark:via-rose-950/30 dark:to-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-indigo-100 dark:border-indigo-900/60">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <LinkIcon className="w-4 h-4 text-indigo-500" />
            <span>Link Produk (Auto Analysis AI)</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
            Auto-Fill Formulir Berbasis AI Reading
          </span>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            Link Produk
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Tempel link produk..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-2xs"
              />
            </div>
            <button
              type="button"
              onClick={handleAnalyzeLink}
              disabled={isAnalyzingLink}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
            >
              {isAnalyzingLink ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menganalisis Link...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-white/20" />
                  <span>Analisis Link</span>
                </>
              )}
            </button>
          </div>

          {/* Supported link examples */}
          <div className="pt-1 space-y-1.5">
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              Mendukung berbagai jenis URL publik:
            </p>
            <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
              <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/80">Shopee</span>
              <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/80">TikTok Shop</span>
              <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/80">Tokopedia</span>
              <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/80">Lazada</span>
              <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/80">Blibli</span>
              <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/80">Lynk.id</span>
              <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/80">Linktree</span>
              <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/80">Instagram Post</span>
              <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/80">Facebook Post</span>
              <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/80">Website Produk</span>
              <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/80">Landing Page</span>
            </div>
          </div>

          {/* 6-STEP PIPELINE LOADING ANIMATION */}
          {isAnalyzingLink && (
            <div className="p-4 bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
                  <span>{analysisStepLabel || 'Menganalisis Link Produk...'}</span>
                </span>
                <span className="text-[10px] font-black bg-indigo-200/80 dark:bg-indigo-900 px-2 py-0.5 rounded-full text-indigo-800 dark:text-indigo-200">
                  {Math.min(Math.round((analysisStep / 6) * 100), 100)}%
                </span>
              </div>
              <div className="w-full bg-indigo-200/60 dark:bg-indigo-900/60 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-rose-500 h-full transition-all duration-500 rounded-full" 
                  style={{ width: `${Math.min((analysisStep / 6) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Sistem membaca Short URL, mengikuti redirect HTTP, dan mengekstrak metadata produk asli sebelum riset AI.
              </p>
            </div>
          )}

          {/* FALLBACK UI IF ANALYSIS FAILS OR INACCESSIBLE */}
          {showAnalysisFallback && !isAnalyzingLink && (
            <div className="p-4 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-3">
              <div className="flex items-start gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-amber-950 dark:text-amber-100">Gagal membaca halaman produk.</p>
                  <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300 mt-0.5">
                    Link produk yang dimasukkan tidak dapat diakses publik atau dilindungi oleh sistem keamanan seller.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
                <button
                  type="button"
                  onClick={handleAnalyzeLink}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Coba Lagi</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLinkInput('');
                    setAnalyzeErrorMsg(null);
                    setShowAnalysisFallback(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Masukkan URL Lain</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('manual-product-form');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 cursor-pointer transition-all shadow-xs ml-auto"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Isi Detail Produk Secara Manual</span>
                </button>
              </div>
            </div>
          )}

          {/* DETAILED AI LINK ANALYSIS RESULT BREAKDOWN CARD */}
          {analyzedLinkResult && (
            <div className="mt-3 p-4 bg-white/95 dark:bg-slate-900/95 border border-indigo-200 dark:border-indigo-900/70 rounded-xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 font-extrabold text-xs text-indigo-700 dark:text-indigo-300">
                  <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-500" />
                  <span>Hasil Riset & Analisis Link AI</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAnalyzedLinkResult(null)}
                  className="text-[10px] font-bold text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                >
                  Tutup Riset
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-500 dark:text-slate-400">Nama Produk:</span>
                  <p className="font-extrabold text-slate-800 dark:text-slate-100">{analyzedLinkResult.productName || '-'}</p>
                </div>
                {analyzedLinkResult.brand && (
                  <div>
                    <span className="font-bold text-slate-500 dark:text-slate-400">Brand / Toko:</span>
                    <p className="font-extrabold text-slate-800 dark:text-slate-100">{analyzedLinkResult.brand}</p>
                  </div>
                )}
                <div>
                  <span className="font-bold text-slate-500 dark:text-slate-400">Kategori:</span>
                  <p className="font-extrabold text-indigo-600 dark:text-indigo-400">{analyzedLinkResult.category || '-'}</p>
                </div>
                {analyzedLinkResult.price && (
                  <div>
                    <span className="font-bold text-slate-500 dark:text-slate-400">Harga:</span>
                    <p className="font-extrabold text-emerald-600 dark:text-emerald-400">{analyzedLinkResult.price}</p>
                  </div>
                )}
              </div>

              {analyzedLinkResult.description && (
                <div className="text-xs">
                  <span className="font-bold text-slate-500 dark:text-slate-400">Deskripsi Ringkas:</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">{analyzedLinkResult.description}</p>
                </div>
              )}

              {analyzedLinkResult.usp && (
                <div className="text-xs p-2 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-lg">
                  <span className="font-extrabold text-indigo-800 dark:text-indigo-300">USP (Keunikan Utama):</span>
                  <p className="text-indigo-950 dark:text-indigo-200 mt-0.5">{analyzedLinkResult.usp}</p>
                </div>
              )}

              {/* Target Audiences */}
              {analyzedLinkResult.targetAudiences && analyzedLinkResult.targetAudiences.length > 0 && (
                <div className="text-xs space-y-1">
                  <span className="font-bold text-slate-500 dark:text-slate-400">Target Audiens:</span>
                  <div className="flex flex-wrap gap-1">
                    {analyzedLinkResult.targetAudiences.map((aud, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                        {aud}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits & Features */}
              {analyzedLinkResult.benefits && analyzedLinkResult.benefits.length > 0 && (
                <div className="text-xs space-y-1">
                  <span className="font-bold text-slate-500 dark:text-slate-400">Manfaat Utama:</span>
                  <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                    {analyzedLinkResult.benefits.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {selectedPK && (
            <div className="p-3 bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center justify-between gap-2 text-xs text-rose-950 dark:text-rose-100">
              <div className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Product Knowledge Aktif: {selectedPK.product_name}</span>
              </div>
              <button
                type="button"
                onClick={handleClearPK}
                className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Reset
              </button>
            </div>
          )}

          {/* Feedback messages */}
          {analyzeSuccessMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{analyzeSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setAnalyzeSuccessMsg(null)}
                className="text-emerald-700 dark:text-emerald-400 hover:underline text-[10px] shrink-0"
              >
                Tutup
              </button>
            </div>
          )}

          {analyzeErrorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{analyzeErrorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setAnalyzeErrorMsg(null)}
                className="text-rose-700 dark:text-rose-400 hover:underline text-[10px] shrink-0"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN FORM */}
      <form id="manual-product-form" onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="e.g. Produk Affiliate Shopee, Serum Skin Care"
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
              placeholder="Deskripsikan fungsi utama produk, keunggulan, dan masalah yang diselesaikan..."
              className={`w-full bg-white dark:bg-slate-800/80 border ${
                errors.description ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-600'
              } rounded-xl p-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-4 outline-none transition-all resize-none leading-relaxed`}
            />
            {errors.description && (
              <p className="text-xs text-rose-500 font-medium mt-1">{errors.description}</p>
            )}
          </div>
        </div>

        {/* SECTION 2: TUJUAN (GOAL) */}
        <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 font-extrabold text-xs">
              02
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>Tujuan Kampanye Threads</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300">
                  Platform: Threads Only
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tentukan tujuan utama konten Threads Anda
              </p>
            </div>
          </div>

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
        </div>

        {/* SECTION 3: TARGET AUDIENS (DROPDOWN FORMAT) */}
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
                <p className="text-xs text-slate-500 dark:text-slate-400">Pilih target audiens dari menu dropdown</p>
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

          {/* Dropdown Menu for Target Audience */}
          <div className="space-y-3">
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val && !targetAudiences.includes(val)) {
                  setTargetAudiences([...targetAudiences, val]);
                }
              }}
              value=""
              className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all cursor-pointer"
            >
              <option value="">-- Pilih Target Audiens (Klik untuk menambahkan) --</option>
              {TARGET_AUDIENCES_THREADS.map((aud) => (
                <option key={aud.id} value={aud.name}>
                  {aud.name} ({aud.age}) - {aud.vibe}
                </option>
              ))}
            </select>

            {/* Active Selected Tags */}
            <div className="flex flex-wrap gap-2">
              {targetAudiences.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Belum ada target audiens terpilih. Silakan pilih dari dropdown di atas.</span>
              ) : (
                targetAudiences.map((audName) => (
                  <span
                    key={audName}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold"
                  >
                    <span>{audName}</span>
                    <button
                      type="button"
                      onClick={() => toggleAudience(audName)}
                      className="p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full cursor-pointer transition-colors"
                    >
                      <X className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: CONTENT TONE & STYLE (DROPDOWN FORMAT) */}
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
                <p className="text-xs text-slate-500 dark:text-slate-400">Pilih gaya tone konten dari menu dropdown</p>
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

          {/* Dropdown Menu for Content Tone & Style */}
          <div className="space-y-3">
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val && !toneContents.includes(val)) {
                  setToneContents([...toneContents, val]);
                }
              }}
              value=""
              className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all cursor-pointer"
            >
              <option value="">-- Pilih Content Tone & Style (Klik untuk menambahkan) --</option>
              {TONE_OPTIONS_THREADS.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name} - {t.description}
                </option>
              ))}
            </select>

            {/* Active Selected Tone Tags */}
            <div className="flex flex-wrap gap-2">
              {toneContents.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Belum ada tone terpilih. Silakan pilih dari dropdown di atas.</span>
              ) : (
                toneContents.map((toneName) => (
                  <span
                    key={toneName}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold"
                  >
                    <span>{toneName}</span>
                    <button
                      type="button"
                      onClick={() => toggleTone(toneName)}
                      className="p-0.5 hover:bg-rose-200 dark:hover:bg-rose-800 rounded-full cursor-pointer transition-colors"
                    >
                      <X className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* SECTION 5: ANGLE KONTEN (DROPDOWN FORMAT) */}
        <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 font-extrabold text-xs">
                05
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                  Angle Konten <span className="text-rose-500">*</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pilih sudut pandang / angle pemicu interaksi dari dropdown</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs self-end sm:self-center">
              <button
                type="button"
                onClick={handleSelectAllAngles}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
              >
                Pilih Semua
              </button>
              <button
                type="button"
                onClick={handleClearAngles}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {errors.contentAngles && (
            <p className="text-xs text-rose-600 font-medium bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 p-3 rounded-xl">
              {errors.contentAngles}
            </p>
          )}

          {/* Dropdown Menu for Angle Konten */}
          <div className="space-y-3">
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val && !contentAngles.includes(val)) {
                  setContentAngles([...contentAngles, val]);
                }
              }}
              value=""
              className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all cursor-pointer"
            >
              <option value="">-- Pilih Angle Konten (Klik untuk menambahkan) --</option>
              {CONTENT_ANGLES_LIST.map((ang) => (
                <option key={ang} value={ang}>
                  {ang}
                </option>
              ))}
            </select>

            {/* Active Selected Angle Tags */}
            <div className="flex flex-wrap gap-2">
              {contentAngles.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Belum ada angle terpilih. Silakan pilih dari dropdown di atas.</span>
              ) : (
                contentAngles.map((angleName) => (
                  <span
                    key={angleName}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold"
                  >
                    <span>{angleName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setContentAngles(contentAngles.filter((item) => item !== angleName));
                      }}
                      className="p-0.5 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full cursor-pointer transition-colors"
                    >
                      <X className="w-3 h-3 text-amber-700 dark:text-amber-300" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* SECTION 6: ADVANCED / OPTIONAL DETAILS */}
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
              <span>Generate 30 Konten Threads (Content Pillars & Utas)</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <p className="text-center text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              Sistem akan memproses 30 Konten Threads lengkap dengan Pillar, Score Virality Hook, Angle Konten, & Rangkaian Utas (4-8 Utas/Konten) siap simpan PDF.
            </p>
          </div>
        )}
      </form>
    </div>
  );
};
