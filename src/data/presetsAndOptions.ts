import { TargetAudienceOption, ToneOption, PresetData } from '../types';

export const TARGET_AUDIENCES_THREADS: TargetAudienceOption[] = [
  {
    id: 'gen_z_overthinker',
    platform: 'threads',
    name: 'Gen Z Overthinker',
    age: '18-24 tahun',
    vibe: 'RAW CURHAT + SELF-DEPRECATING',
    ciri: 'Suka curhat, anxiety, relate, bahasa Inggris campur',
    masalah: 'Jerawat, insecure, dompet tipis, skripsi, karir',
    toneWork: 'Raw curhat, jujurly, overthinking, relate'
  },
  {
    id: 'ibu_muda_smart_buyer',
    platform: 'threads',
    name: 'Ibu Muda Smart Buyer',
    age: '25-34 tahun',
    vibe: 'JUJUR + SPILL + MAMA HACK',
    ciri: 'Butuh solusi cepat, anti ribet, butuh bukti nyata',
    masalah: 'Gak ada waktu, urus anak, bekas jerawat, budget keluarga',
    toneWork: 'Jujur, bun, hemat waktu, solusi simpel'
  },
  {
    id: 'cowok_praktis',
    platform: 'threads',
    name: 'Cowok Praktis',
    age: '20-35 tahun',
    vibe: 'TO THE POINT + LOGIC',
    ciri: 'Gak suka drama, to the point, butuh hasil nyata',
    masalah: 'Males ribet, pengen simpel, gak ngerti istilah rumit',
    toneWork: 'Gw, simpel, hasil langsung, max 3 baris'
  },
  {
    id: 'pejuang_cuan',
    platform: 'threads',
    name: 'Pejuang Cuan / Affiliate Hunter',
    age: '20-30 tahun',
    vibe: 'BLUNT REVIEW + BANDINGIN HARGA',
    ciri: 'Cari review jujur sebelum beli, sensitif harga & promo',
    masalah: 'Takut ketipu, suka bandingin produk, cari barang worth it',
    toneWork: 'Worth it, zonk, bukti foto, bandingin harga'
  }
];

export const TARGET_AUDIENCES_X: TargetAudienceOption[] = [
  {
    id: 'tech_founders_x',
    platform: 'x',
    name: 'Tech & Startup Enthusiast / Founders',
    age: '22-35 tahun',
    vibe: 'INSIGHTFUL + DATA & GROWTH',
    ciri: 'Suka produktivitas, AI tools, growth metrics, case study',
    masalah: 'Kerja tidak efektif, butuh otomatisasi, scaling bisnis',
    toneWork: 'Data-driven, breakdown, real talk, frameworks'
  },
  {
    id: 'gen_z_chillers_x',
    platform: 'x',
    name: 'Gen Z & Millennial Chillers',
    age: '18-28 tahun',
    vibe: 'EDGY + MEME + HOT TAKES',
    ciri: 'Scroll cepat, suka meme, frontal, respon cepat',
    masalah: 'Bosan, FOMO trend, cari hiburan bernilai',
    toneWork: 'Hot take, jujur, slightly assertive, anti-formal'
  },
  {
    id: 'career_seekers_x',
    platform: 'x',
    name: 'Professional & Career Seekers',
    age: '22-35 tahun',
    vibe: 'ACTIONABLE TIPS + STORYTELLING',
    ciri: 'Upgrade skill, suka thread panjang, bookmarking',
    masalah: 'Stagnan karir, butuh referensi & panduan praktis',
    toneWork: 'Conversational, case study, value-first'
  },
  {
    id: 'deal_hunters_x',
    platform: 'x',
    name: 'Deal & Promo Hunters',
    age: '18-34 tahun',
    vibe: 'VALUE FIRST + SOFT SELL',
    ciri: 'Suka spil promo, rekomendasi barang unik & terjangkau',
    masalah: 'Pengen barang bagus tapi tetep hemat',
    toneWork: 'Review singkat, jujur, spill link di reply'
  }
];

export const TONE_OPTIONS_THREADS: ToneOption[] = [
  {
    id: 'curhat_raw',
    platform: 'threads',
    name: 'Curhat Raw & Relate (Gen Z)',
    description: 'Santai, huruf kecil, enter-enter, bahasa pergaulan sehari-hari',
    vocab: ['jujurly', 'relate', 'wkwk', 'spill', 'healing', 'bestie', 'overthinking'],
    vibe: 'Emosional, jujur, mengundang interaksi'
  },
  {
    id: 'temen_curhat_jujur',
    platform: 'threads',
    name: 'Temen Curhat Jujur & Mama Hack (Ibu Muda)',
    description: 'Solutif, hangat, tanpa istilah kaku',
    vocab: ['bun', 'jujur', 'hemat waktu', 'anak', 'btw', 'spill'],
    vibe: 'Edukatif & Solutif untuk smart buyer'
  },
  {
    id: 'to_the_point',
    platform: 'threads',
    name: 'To The Point & Logic (Cowok)',
    description: 'Ringkas, maksimal 3 baris, langsung ke hasil tanpa basa-basi',
    vocab: ['gw', 'simple', 'gak ribet', 'udah', 'hasilnya'],
    vibe: 'Praktis, to the point'
  },
  {
    id: 'review_blunt',
    platform: 'threads',
    name: 'Blunt Review & Bandingin Harga (Affiliate)',
    description: 'Bahas angka, foto bukti, perbandingan produk jujur tanpa melebih-lebihkan',
    vocab: ['worth it', 'zonk', 'rugi', 'bukti', 'bandingin'],
    vibe: 'Transparan & meyakinkan'
  }
];

export const TONE_OPTIONS_X: ToneOption[] = [
  {
    id: 'santai_assertive',
    platform: 'x',
    name: 'Santai + Slightly Assertive (Edukasi & Insight)',
    description: 'Memberi insight dengan percaya diri tanpa terkesan gurui',
    vocab: ['real talk', 'banyak yang salah paham', 'the fact that', 'worth it'],
    vibe: 'Informatif & Otoritatif'
  },
  {
    id: 'tegas_provokatif',
    platform: 'x',
    name: 'Tegas & Hot Takes (Opini & Diskusi)',
    description: 'Memicu diskusi tajam tapi tetap sopan',
    vocab: ['unpopular opinion', 'stop buat kesalahan ini', 'kenapa masih banyak yang...'],
    vibe: 'Memicu reply & retweet'
  },
  {
    id: 'authentic_humor',
    platform: 'x',
    name: 'Authentic & Self-Aware (Personal Branding)',
    description: 'Jujur, santai, dibumbui humor ringan ala tech-twitter',
    vocab: ['jujur ya', 'kemarin sempet', 'plot twist', 'sebagai orang yang'],
    vibe: 'Dekat & manusiawi'
  },
  {
    id: 'soft_sell_value',
    platform: 'x',
    name: 'Soft Sell + Value First (Marketing / Selling)',
    description: 'Bagikan 90% value terlebih dahulu sebelum arahkan ke link reply',
    vocab: ['breakdown', 'caranya simpel', 'detailnya di reply', 'spill'],
    vibe: 'High conversion'
  },
  {
    id: 'conversational_story',
    platform: 'x',
    name: 'Conversational + Emotional (Storytelling)',
    description: 'Bercerita seperti ngobrol langsung di Warkop / Kafe',
    vocab: ['kemarin gue ngerasain', 'awalnya bingung', 'ternyata sesimpel ini'],
    vibe: 'Menarik perhatian sejak baris pertama'
  }
];

export const CATEGORIES_LIST = [
  'Skincare & Beauty',
  'Fashion & Apparel',
  'F&B / Kuliner Local Brand',
  'AI & Tech Software / SaaS',
  'Produktivitas & Tools Kerja',
  'Keuangan & Edukasi Finansial',
  'Gadget & Elektronik',
  'Home & Living',
  'Jasa & Freelance / Agency',
  'Edukasi & Kursus Online'
];

export const GOALS_LIST = [
  'Edukasi & Soft Selling (Membangun Kepercayaan)',
  'Direct Sales & Promo Hard Sell (Konversi Link)',
  'Brand Awareness & Virality (Reach Maksimal)',
  'Engagement & Pancing Komen (Diskusi / Algoritma Boost)',
  'Lead Generation / Affiliate Cuan'
];

export const PRESETS_LIST: PresetData[] = [
  {
    id: 'preset_1',
    title: '🌸 Skincare - Serum Brightening Centella',
    productName: 'Serum Brightening Centella X',
    category: 'Skincare & Beauty',
    description: 'Serum pencerah bekas jerawat membandel dengan 3% Niacinamide + Centella Asiatica. Hasil pudar dalam 12 hari tanpa bikin kulit iritasi atau perih.',
    goal: 'Edukasi & Soft Selling (Membangun Kepercayaan)',
    platform: 'both',
    targetAudiences: ['Gen Z Overthinker', 'Ibu Muda Smart Buyer', 'Pejuang Cuan / Affiliate Hunter'],
    toneContents: ['Curhat Raw & Relate (Gen Z)', 'Temen Curhat Jujur & Mama Hack (Ibu Muda)', 'Blunt Review & Bandingin Harga (Affiliate)'],
    productUrl: 'https://shopee.co.id/serum-brightening-x',
    price: 'Rp 89.000 (Harga Promo)',
    duration: '12 hari'
  },
  {
    id: 'preset_2',
    title: '⚡ AI & Tech - Notionary Auto Note AI',
    productName: 'Notionary AI Note App',
    category: 'AI & Tech Software / SaaS',
    description: 'Aplikasi pencatatan otomatis berbasis AI untuk merangkum meeting, menyusun ide konten, dan auto-tagging catatan tanpa harus dirapikan manual.',
    goal: 'Brand Awareness & Virality (Reach Maksimal)',
    platform: 'x',
    targetAudiences: ['Tech & Startup Enthusiast / Founders', 'Professional & Career Seekers'],
    toneContents: ['Santai + Slightly Assertive (Edukasi & Insight)', 'Soft Sell + Value First (Marketing / Selling)'],
    productUrl: 'https://notionary.ai/get-started',
    price: 'Gratis Tier + Rp 99k/bln'
  },
  {
    id: 'preset_3',
    title: '☕ F&B - Kopi Susu Aren Literan Craft',
    productName: 'Kopi Susu Aren Literan "Kopi Senja"',
    category: 'F&B / Kuliner Local Brand',
    description: 'Kopi susu gula aren asli 1 Liter memakai 100% biji kopi Robusta-Arabika lokal house blend. Tahan 5 hari di kulkas tanpa mengurangi rasa gurih manisnya.',
    goal: 'Direct Sales & Promo Hard Sell (Konversi Link)',
    platform: 'threads',
    targetAudiences: ['Gen Z Overthinker', 'Cowok Praktis'],
    toneContents: ['Curhat Raw & Relate (Gen Z)', 'To The Point & Logic (Cowok)'],
    productUrl: 'https://tokopedia.link/kopi-literan-senja',
    price: 'Rp 65.000 / Liter'
  },
  {
    id: 'preset_4',
    title: '👗 Fashion - Oversized Hoodie Minimalis',
    productName: 'Dailyoversize Heavyweight Hoodie 330gsm',
    category: 'Fashion & Apparel',
    description: 'Hoodie bahan cotton fleece 330gsm tebal, adem di kulit, tidak gampang berbulu meski dicuci berulang kali. Potongan drop shoulder kekinian.',
    goal: 'Engagement & Pancing Komen (Diskusi / Algoritma Boost)',
    platform: 'both',
    targetAudiences: ['Gen Z Overthinker', 'Cowok Praktis', 'Deal & Promo Hunters'],
    toneContents: ['Curhat Raw & Relate (Gen Z)', 'To The Point & Logic (Cowok)', 'Authentic & Self-Aware (Personal Branding)'],
    productUrl: 'https://shopee.co.id/hoodie-heavyweight-330gsm',
    price: 'Rp 149.000'
  }
];
