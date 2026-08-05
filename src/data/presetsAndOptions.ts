import { TargetAudienceOption, ToneOption, PresetData } from '../types';

export const TARGET_AUDIENCES_THREADS: TargetAudienceOption[] = [
  {
    id: 'content_creator_pemula',
    platform: 'threads',
    name: 'Content Creator Pemula',
    age: '18-28 tahun',
    vibe: 'CURIOUS + CRAVING GROWTH',
    ciri: 'Kehabisan ide, tidak konsisten upload, views sedikit, tidak tahu cara buat hook, bingung menentukan niche',
    masalah: 'Ingin konsisten posting, konten viral, followers bertambah, dan mendapat penghasilan',
    toneWork: 'Relate, edukatif, kasih contoh nyata, bahasa ngobrol'
  },
  {
    id: 'pebisnis_umkm',
    platform: 'threads',
    name: 'Pebisnis UMKM',
    age: '22-40 tahun',
    vibe: 'RESULTS ORIENTED + BUSY',
    ciri: 'Penjualan sepi, brand belum dikenal, tidak punya waktu membuat konten',
    masalah: 'Butuh leads, closing cepat, dan personal branding tanpa ribet',
    toneWork: 'To the point, solusi praktis, case study, proven framework'
  },
  {
    id: 'freelancer_pro',
    platform: 'threads',
    name: 'Freelancer',
    age: '20-35 tahun',
    vibe: 'VALUE & PORTFOLIO BUILDER',
    ciri: 'Sepi klien, sulit menaikkan harga, portofolio kurang menarik',
    masalah: 'Butuh klien rutin, pendapatan naik, dan branding profesional',
    toneWork: 'Otoritatif, insight, pengalaman nyata, tips teruji'
  },
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
    id: 'creator_pemula_x',
    platform: 'x',
    name: 'Content Creator Pemula',
    age: '18-28 tahun',
    vibe: 'CRAVING HOOKS & GROWTH',
    ciri: 'Kehabisan ide, views sedikit, tidak tahu cara buat hook, bingung niche',
    masalah: 'Ingin konsisten posting, konten viral, followers bertambah, cuan',
    toneWork: 'Breakdown, thread, tips terstruktur, motivasi'
  },
  {
    id: 'pebisnis_umkm_x',
    platform: 'x',
    name: 'Pebisnis UMKM',
    age: '22-40 tahun',
    vibe: 'GROWTH & CONVERSION',
    ciri: 'Penjualan sepi, brand belum dikenal, tidak ada waktu bikin konten',
    masalah: 'Butuh leads, closing, personal branding bisnis',
    toneWork: 'Case study, angka, bukti konversi, frameworks'
  },
  {
    id: 'freelancer_x',
    platform: 'x',
    name: 'Freelancer',
    age: '20-35 tahun',
    vibe: 'HIGH-TICKET & PORTFOLIO',
    ciri: 'Sepi klien, sulit naikkan rate, portofolio standar',
    masalah: 'Dapat klien rutin, pendapatan naik, personal brand kuat',
    toneWork: 'Insights, value-first, cerita klien, otoritatif'
  },
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
    id: 'friendly_santai',
    platform: 'threads',
    name: 'Friendly & Ngobrol (Santai)',
    description: 'Bahasa santai, seperti ngobrol dengan teman, tidak terlalu formal, kalimat pendek',
    vocab: ['jujurly', 'relate', 'btw', 'spill', 'bestie', 'yuk'],
    vibe: 'Dekat, akrab, dan menyenangkan'
  },
  {
    id: 'edukatif_step',
    platform: 'threads',
    name: 'Edukatif & Step-by-Step',
    description: 'Menjelaskan langkah demi langkah, fokus memberi ilmu dan solusi jelas',
    vocab: ['langkahnya', 'caranya', 'tipsnya', 'solusi', 'penting'],
    vibe: 'Informatif, bernilai tinggi, memicu save'
  },
  {
    id: 'storytelling_alur',
    platform: 'threads',
    name: 'Storytelling & Pengalaman',
    description: 'Diawali cerita menarik, ada konflik/masalah, diakhiri pelajaran penting',
    vocab: ['dulu aku', 'ternyata', 'kejadian ini', 'pelajarannya', 'pas itu'],
    vibe: 'Emosional, mengikat pembaca dari awal'
  },
  {
    id: 'provokatif_curiosity',
    platform: 'threads',
    name: 'Provokatif & Curiosity Booster',
    description: 'Menggugah emosi, menantang pemikiran umum, mengandung curiosity tinggi',
    vocab: ['stop lakukan ini', 'banyak yang salah', 'kenapa masih', 'rahasianya'],
    vibe: 'Memicu diskusi dan komen rame'
  },
  {
    id: 'otoritatif_expert',
    platform: 'threads',
    name: 'Otoritatif & Pengalaman Nyata',
    description: 'Percaya diri, menggunakan data atau bukti pengalaman nyata tanpa terkesan menggurui',
    vocab: ['setelah uji coba', 'faktanya', 'hasilnya', 'rekomendasiku'],
    vibe: 'Membangun kepercayaan dan otoritas'
  },
  {
    id: 'inspiratif_semangat',
    platform: 'threads',
    name: 'Inspiratif & Motivasi',
    description: 'Membangkitkan semangat, fokus pada perubahan positif dan pertumbuhan',
    vocab: ['percaya deh', 'kamu pasti bisa', 'mulai aja dulu', 'prosesnya'],
    vibe: 'Positif dan menggerakkan'
  },
  {
    id: 'humoris_santuy',
    platform: 'threads',
    name: 'Humoris & Ringan',
    description: 'Ringan, ada candaan hangat, tidak berlebihan',
    vocab: ['wkwk', 'benget', 'ngakak', 'repot bener', 'humor'],
    vibe: 'Menghibur dan cepat viral'
  }
];

export const TONE_OPTIONS_X: ToneOption[] = [
  {
    id: 'friendly_x',
    platform: 'x',
    name: 'Friendly & Conversational (Ngobrol)',
    description: 'Bahasa santai ala ngobrol kafe, kalimat pendek, ramah pembaca',
    vocab: ['real talk', 'jujur ya', 'btw', 'gimana menurut kalian'],
    vibe: 'Akrab & mudah dipahami'
  },
  {
    id: 'edukatif_x',
    platform: 'x',
    name: 'Edukatif & Frameworks (Solusi)',
    description: 'Menjelaskan pola, panduan langkah demi langkah, dan framework teruji',
    vocab: ['breakdown', 'framework', 'langkah 1-3', 'insight'],
    vibe: 'High value & high retweets'
  },
  {
    id: 'storytelling_x',
    platform: 'x',
    name: 'Storytelling & Case Study',
    description: 'Membuka dengan cerita atau studi kasus nyata yang membuat penasaran',
    vocab: ['kemarin nyobain', 'dulu versus sekarang', 'case study', 'alasan kenapa'],
    vibe: 'Engagement tinggi & scroll stopper'
  },
  {
    id: 'provokatif_x',
    platform: 'x',
    name: 'Provokatif & Unpopular Opinion',
    description: 'Menantang pemikiran konvensional dengan argumen kuat',
    vocab: ['unpopular opinion', '90% orang salah', 'stop buang waktu'],
    vibe: 'Pancing reply & perdebatan sehat'
  },
  {
    id: 'otoritatif_x',
    platform: 'x',
    name: 'Otoritatif & Data-Driven',
    description: 'Tegas, membawa data, metrik, atau hasil pengujian nyata',
    vocab: ['data menunjukkan', 'hasil eksekusi', 'metrik', 'kesimpulan'],
    vibe: 'Kredibel & profesional'
  }
];

// 25 Content Angles
export const ANGLES_LIST = [
  'Kesalahan',
  'Mitos vs Fakta',
  'Tutorial',
  'Checklist',
  'Case Study',
  'Pengalaman',
  'Framework',
  'Before After',
  'Studi Riset',
  'Opini',
  'Rahasia',
  'Behind The Scene',
  'Prediksi',
  'Perbandingan',
  'Quick Wins',
  'Step by Step',
  'Analogi',
  'Kesalahan Pemula',
  'Curhat',
  'Hot Take',
  'Review',
  'Trend',
  'Problem Solution',
  'FAQ',
  'Curated Resources',
  'Challenge',
  'Eksperimen'
];

// 5 Structural Patterns
export const STRUCTURAL_PATTERNS = [
  {
    id: 'pattern_1',
    name: 'Pattern 1: Problem - Solution - Tutorial',
    structure: ['Hook', 'Problem', 'Solution', 'Tutorial', 'CTA']
  },
  {
    id: 'pattern_2',
    name: 'Pattern 2: Storytelling & Lesson',
    structure: ['Hook', 'Story', 'Insight', 'Lesson', 'CTA']
  },
  {
    id: 'pattern_3',
    name: 'Pattern 3: Listicle & Explainer',
    structure: ['Hook', 'Listicle', 'Penjelasan', 'CTA']
  },
  {
    id: 'pattern_4',
    name: 'Pattern 4: Case Study & Framework',
    structure: ['Hook', 'Case Study', 'Framework', 'CTA']
  },
  {
    id: 'pattern_5',
    name: 'Pattern 5: Myth Busting & Fact Check',
    structure: ['Hook', 'Myth', 'Fact', 'Explanation', 'CTA']
  }
];

// 20 Hook Templates
export const HOOK_TEMPLATES = [
  {
    id: 'hook_001',
    name: 'Curiosity Gap',
    template: '{statement}.\n\nTapi yang paling mengejutkan...\n\n{open_loop}.'
  },
  {
    id: 'hook_002',
    name: 'Mistake Everyone Makes',
    template: 'Hampir semua orang melakukan {mistake}.\n\nPadahal itulah alasan kenapa {negative_result}.'
  },
  {
    id: 'hook_003',
    name: 'Contrarian Opinion',
    template: 'Semua orang bilang {common_belief}.\n\nAku justru percaya {opposite_belief}.'
  },
  {
    id: 'hook_004',
    name: 'Before After',
    template: 'Dulu aku {before}.\n\nSekarang {after}.\n\nSemuanya berubah karena {reason}.'
  },
  {
    id: 'hook_005',
    name: 'Unexpected Discovery',
    template: 'Aku cuma iseng {action}.\n\nYang terjadi setelahnya benar-benar di luar dugaan.'
  },
  {
    id: 'hook_006',
    name: 'Number Hook',
    template: '{number} hal yang membuat {topic} gagal.\n\nNomor {highlight} paling sering diremehkan.'
  },
  {
    id: 'hook_007',
    name: 'Hidden Secret',
    template: 'Ada satu rahasia tentang {topic}.\n\nAnehnya, hampir tidak ada yang membahasnya.'
  },
  {
    id: 'hook_008',
    name: 'Hard Truth',
    template: 'Maaf kalau terdengar keras.\n\nTapi {hard_truth}.'
  },
  {
    id: 'hook_009',
    name: 'Pain Point',
    template: 'Kalau kamu masih {problem},\n\nkemungkinan besar penyebabnya bukan {assumption}.'
  },
  {
    id: 'hook_010',
    name: 'Regret',
    template: 'Kalau bisa mengulang dari awal,\n\naku tidak akan pernah {mistake}.'
  },
  {
    id: 'hook_011',
    name: 'Challenge',
    template: 'Coba jawab jujur.\n\nKapan terakhir kali kamu {activity}?'
  },
  {
    id: 'hook_012',
    name: 'Prediction',
    template: 'Dalam {timeframe},\n\n{prediction}.'
  },
  {
    id: 'hook_013',
    name: 'Shocking Statistic',
    template: '{percentage}% orang {behavior}.\n\nKemungkinan besar kamu juga salah satunya.'
  },
  {
    id: 'hook_014',
    name: 'Question Hook',
    template: 'Kenapa {question}?\n\nJawabannya mungkin berbeda dari yang kamu kira.'
  },
  {
    id: 'hook_015',
    name: 'Warning',
    template: 'Jangan lakukan {action} sebelum kamu tahu ini.'
  },
  {
    id: 'hook_016',
    name: 'Confession',
    template: 'Aku harus mengaku.\n\nSelama ini aku salah tentang {topic}.'
  },
  {
    id: 'hook_017',
    name: 'Expectation vs Reality',
    template: 'Ekspektasi: {expectation}.\n\nRealitanya: {reality}.'
  },
  {
    id: 'hook_018',
    name: 'Simple Trick',
    template: 'Satu kebiasaan kecil ini berhasil mengubah {result}.'
  },
  {
    id: 'hook_019',
    name: 'Authority',
    template: 'Setelah {experience},\n\naku sadar satu hal tentang {topic}.'
  },
  {
    id: 'hook_020',
    name: 'FOMO',
    template: 'Kalau kamu belum tahu {topic},\n\nkamu sudah tertinggal dari banyak orang.'
  }
];

// Starter Hook Phrases
export const HOOK_STARTER_PHRASES = [
  'Kalau kamu masih...',
  '90% orang masih salah...',
  'Aku baru sadar ternyata...',
  'Jangan lakukan ini kalau...',
  'Orang pintar justru...',
  'Yang bikin aku heran adalah...',
  'Aku menyesal baru tahu...',
  'Banyak orang mengira...',
  'Ini alasan kenapa...',
  'Cara paling mudah...',
  'Aku mencoba selama 30 hari...',
  'Sedikit orang tahu...',
  'Kalau disuruh mulai dari nol...',
  'Setelah membantu ratusan klien...',
  'Rahasia yang tidak pernah diajarkan...',
  'Berhenti melakukan ini...',
  'Kalau aku harus mengulang dari awal...',
  'Ternyata penyebabnya bukan...',
  'Ini yang kulakukan setiap hari...',
  'Simpan postingan ini...'
];

// Recommended Call-To-Actions (CTAs)
export const CALL_TO_ACTIONS = [
  'Kalau bermanfaat, simpan postingan ini.',
  'Follow untuk konten seperti ini.',
  'Bagikan ke temanmu.',
  'Tulis "AI" di komentar.',
  'Tulis "PILLAR" di komentar.',
  'DM aku untuk panduan lengkapnya.',
  'Bookmark dulu biar gak hilang.',
  'Kalau ada pertanyaan, komentar ya.',
  'Mana yang paling menarik menurutmu?'
];

// Copywriting Rules
export const COPYWRITING_RULES = {
  maxEmoji: 3,
  noMarkdown: true,
  language: 'Bahasa Indonesia',
  sentenceLength: 'Pendek (maksimal 2 kalimat per paragraf)',
  spacing: 'Gunakan jeda spasi antar paragraf',
  numbering: 'Gunakan numbering jika berbentuk daftar/list',
  toneStyle: 'Gaya ngobrol, santai, dan tidak kaku',
  ctaPlacement: 'Selalu berikan CTA di akhir postingan'
};

export const CONTENT_ANGLES_LIST = [
  'Kesalahan Pemula',
  'Mitos vs Fakta',
  'Tutorial & Step by Step',
  'Checklist & Quick Wins',
  'Before After',
  'Pengalaman / Curhat',
  'Case Study',
  'Behind The Scene',
  'Problem Solution',
  'Framework & Rumus',
  'Perbandingan / Review',
  'Rahasia & Hidden Gem',
  'Challenge / Tantangan',
  'Studi Riset & Data',
  'Opini / Hot Take',
  'Prediksi Trend',
  'Analogi Sederhana',
  'Trend & Newsjack',
  'FAQ / Pertanyaan Populer',
  'Curated Resources',
  'Eksperimen / Uji Coba',
  'Unpopular Opinion',
  'Regret Story / Penyesalan',
  'Confession / Pengakuan Jujur',
  'Direct Offer & CTA'
];

export const CATEGORIES_LIST = [
  'Content Creator & Media Specialist',
  'Affiliate Marketing',
  'UMKM',
  'Content Creator',
  'AI',
  'Personal Branding',
  'Investasi',
  'Online Course',
  'Edukasi & Kursus Online',
  'Jasa & Freelance / Agency',
  'Pebisnis UMKM & Local Brand',
  'Skincare & Beauty',
  'Fashion & Apparel',
  'F&B / Kuliner Local Brand',
  'AI & Tech Software / SaaS',
  'Produktivitas & Tools Kerja',
  'Keuangan & Edukasi Finansial',
  'Gadget & Elektronik',
  'Home & Living'
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
    id: 'PK001',
    title: '💰 Affiliate Blueprint (Product Knowledge PK001)',
    productName: 'Affiliate Blueprint',
    category: 'Affiliate Marketing',
    description: 'Panduan membangun penghasilan dari affiliate marketing. Solusi komisi pertama, strategi memilih produk, & konten pemicu klik.',
    goal: 'Lead Generation / Affiliate Cuan',
    platform: 'both',
    targetAudiences: ['Content Creator Pemula', 'Freelancer'],
    toneContents: ['Friendly & Ngobrol (Santai)', 'Edukatif & Step-by-Step'],
    productUrl: 'https://lynk.id/affiliate-blueprint',
    price: 'Rp 99.000'
  },
  {
    id: 'PK002',
    title: '🏬 UMKM Content System (Product Knowledge PK002)',
    productName: 'UMKM Content System',
    category: 'Pebisnis UMKM & Local Brand',
    description: 'Template konten untuk meningkatkan penjualan UMKM. Kalender konten, ide caption, & framework promosi closing.',
    goal: 'Direct Sales & Promo Hard Sell (Konversi Link)',
    platform: 'threads',
    targetAudiences: ['Pebisnis UMKM'],
    toneContents: ['Edukatif & Step-by-Step', 'Storytelling & Pengalaman'],
    productUrl: 'https://lynk.id/umkm-contentsystem',
    price: 'Rp 149.000'
  },
  {
    id: 'PK003',
    title: '🧵 Threads Content Pillar (Product Knowledge PK003)',
    productName: 'Threads Content Pillar',
    category: 'Content Creator & Media Specialist',
    description: 'Database content pillar untuk membuat Threads tanpa kehabisan ide. 100 Content Pillar, 500 Hook, CTA & Prompt AI.',
    goal: 'Edukasi & Soft Selling (Membangun Kepercayaan)',
    platform: 'threads',
    targetAudiences: ['Content Creator Pemula', 'Freelancer'],
    toneContents: ['Friendly & Ngobrol (Santai)', 'Edukatif & Step-by-Step'],
    productUrl: 'https://lynk.id/threads-contentpillar',
    price: 'Rp 99.000'
  },
  {
    id: 'PK004',
    title: '🤖 Prompt Library (Product Knowledge PK004)',
    productName: 'Prompt Library',
    category: 'AI & Tech Software / SaaS',
    description: 'Kumpulan 1000+ prompt AI untuk bisnis dan produktivitas. Hasil AI instan berkualitas tinggi.',
    goal: 'Brand Awareness & Virality (Reach Maksimal)',
    platform: 'both',
    targetAudiences: ['Tech & Startup Enthusiast / Founders', 'Content Creator Pemula'],
    toneContents: ['Edukatif & Frameworks (Solusi)', 'Friendly & Ngobrol (Santai)'],
    productUrl: 'https://lynk.id/prompt-library',
    price: 'Rp 79.000'
  },
  {
    id: 'PK005',
    title: '🌟 Personal Branding Blueprint (Product Knowledge PK005)',
    productName: 'Personal Branding Blueprint',
    category: 'Jasa & Freelance / Agency',
    description: 'Panduan membangun personal branding di media sosial untuk raih inbound leads dan dipercaya audiens.',
    goal: 'Edukasi & Soft Selling (Membangun Kepercayaan)',
    platform: 'both',
    targetAudiences: ['Freelancer', 'Content Creator Pemula'],
    toneContents: ['Otoritatif & Pengalaman Nyata', 'Storytelling & Pengalaman'],
    productUrl: 'https://lynk.id/personalbranding-bp',
    price: 'Rp 129.000'
  },
  {
    id: 'PK006',
    title: '📈 Invest Smart (Product Knowledge PK006)',
    productName: 'Invest Smart',
    category: 'Keuangan & Edukasi Finansial',
    description: 'Panduan investasi untuk pemula. Pahami dasar investasi, kelola risiko, dan bangun aset tanpa takut rugi.',
    goal: 'Edukasi & Soft Selling (Membangun Kepercayaan)',
    platform: 'both',
    targetAudiences: ['Gen Z Overthinker', 'Cowok Praktis'],
    toneContents: ['Edukatif & Step-by-Step', 'Friendly & Ngobrol (Santai)'],
    productUrl: 'https://lynk.id/invest-smart',
    price: 'Rp 149.000'
  },
  {
    id: 'PK007',
    title: '🎓 Skill Mastery (Product Knowledge PK007)',
    productName: 'Skill Mastery',
    category: 'Edukasi & Kursus Online',
    description: 'Kelas online profesional untuk meningkatkan skill & karier dengan mentoring, sertifikat, dan studi kasus.',
    goal: 'Edukasi & Soft Selling (Membangun Kepercayaan)',
    platform: 'both',
    targetAudiences: ['Freelancer', 'Content Creator Pemula'],
    toneContents: ['Inspiratif & Motivasi', 'Edukatif & Step-by-Step'],
    productUrl: 'https://lynk.id/skill-mastery',
    price: 'Rp 199.000'
  },
  {
    id: 'PK008',
    title: '🛍️ Shopee Affiliate System (Product Knowledge PK008)',
    productName: 'Produk Affiliate Shopee',
    category: 'Shopee Affiliate',
    description: 'Konten membantu audiens menemukan produk yang bermanfaat melalui rekomendasi & link affiliate Shopee.',
    goal: 'Lead Generation / Affiliate Cuan',
    platform: 'threads',
    targetAudiences: ['Ibu Muda Smart Buyer', 'Pejuang Cuan / Affiliate Hunter'],
    toneContents: ['Friendly & Ngobrol (Santai)', 'Storytelling & Pengalaman'],
    productUrl: 'https://shopee.co.id/affiliate-link',
    price: 'Promo / Diskon'
  },
  {
    id: 'preset_creator',
    title: '🚀 Content Creator - Formula Konsisten & Anti Kehabisan Ide',
    productName: 'Ebook Content Pillar Masterclass',
    category: 'Content Creator & Media Specialist',
    description: 'Panduan menyusun 30 hari content pilar lengkap dengan 20 hook viral, formula angle problem-solution, dan sistem ide otomatis.',
    goal: 'Edukasi & Soft Selling (Membangun Kepercayaan)',
    platform: 'both',
    targetAudiences: ['Content Creator Pemula', 'Freelancer'],
    toneContents: ['Friendly & Ngobrol (Santai)', 'Edukatif & Step-by-Step'],
    productUrl: 'https://lynk.id/contentcreator-pillar',
    price: 'Rp 99.000',
    duration: '30 hari'
  },
  {
    id: 'preset_umkm',
    title: '🛍️ UMKM & Bisnis - Strategi Konten Penjualan Laris',
    productName: 'Paket Konten UMKM Auto Closing',
    category: 'Pebisnis UMKM & Local Brand',
    description: 'Sistem pembuatan konten organik untuk meningkatkan leads dan penjualan produk tanpa harus bayar iklan mahal.',
    goal: 'Direct Sales & Promo Hard Sell (Konversi Link)',
    platform: 'threads',
    targetAudiences: ['Pebisnis UMKM', 'Content Creator Pemula'],
    toneContents: ['Edukatif & Step-by-Step', 'Storytelling & Pengalaman'],
    productUrl: 'https://lynk.id/umkm-autoclosing',
    price: 'Rp 149.000'
  }
];

