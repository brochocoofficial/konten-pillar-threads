export interface ProductKnowledgeItem {
  id: string;
  category: string;
  product_name: string;
  description: string;
  target_audience: string[];
  pain_points: string[];
  benefits: string[];
  features: string[];
  objections: string[];
  cta: string[];
  price?: string;
  product_url?: string;
  usp?: string;
  value_proposition?: string;
  tone_contents?: string[];
  file_path?: string;
  created_at?: string;
}

export const PRODUCT_KNOWLEDGE_BASE: ProductKnowledgeItem[] = [
  {
    id: 'PK001',
    category: 'Affiliate Marketing',
    product_name: 'Affiliate Blueprint',
    description: 'Panduan membangun penghasilan dari affiliate marketing.',
    target_audience: ['Pemula', 'Content Creator', 'Freelancer'],
    pain_points: [
      'Belum mendapat komisi',
      'Traffic sedikit',
      'Tidak tahu produk yang dijual',
      'Bingung membuat konten'
    ],
    benefits: [
      'Mendapat komisi pertama',
      'Strategi memilih produk',
      'Konten yang menghasilkan klik',
      'Meningkatkan conversion'
    ],
    features: [
      'Video Tutorial',
      'Template Konten',
      'Studi Kasus',
      'Checklist'
    ],
    objections: [
      'Takut tidak laku',
      'Belum punya followers',
      'Tidak bisa jualan'
    ],
    cta: [
      'Tulis AFFILIATE',
      'DM AFFILIATE',
      'Klik link bio'
    ]
  },
  {
    id: 'PK002',
    category: 'UMKM',
    product_name: 'UMKM Content System',
    description: 'Template konten untuk meningkatkan penjualan UMKM.',
    target_audience: ['Pemilik UMKM', 'Pebisnis Lokal', 'Online Shop'],
    pain_points: [
      'Penjualan turun',
      'Bingung posting',
      'Sedikit pelanggan baru',
      'Brand kurang dikenal'
    ],
    benefits: [
      'Konten lebih konsisten',
      'Meningkatkan awareness',
      'Leads bertambah',
      'Penjualan meningkat'
    ],
    features: [
      'Kalender Konten',
      'Ide Konten',
      'Template Caption',
      'Framework Promosi'
    ],
    objections: [
      'Tidak punya waktu',
      'Tidak bisa desain',
      'Tidak paham marketing'
    ],
    cta: [
      'Tulis UMKM',
      'DM UMKM',
      'Cek link bio'
    ]
  },
  {
    id: 'PK003',
    category: 'Content Creator',
    product_name: 'Threads Content Pillar',
    description: 'Database content pillar untuk membuat Threads tanpa kehabisan ide.',
    target_audience: ['Content Creator', 'Personal Branding', 'Freelancer'],
    pain_points: [
      'Kehabisan ide',
      'Tidak konsisten',
      'Views sedikit',
      'Bingung niche'
    ],
    benefits: [
      'Ide 365 hari',
      'Posting lebih cepat',
      'Konten lebih terarah',
      'Personal branding meningkat'
    ],
    features: [
      '100 Content Pillar',
      '500 Hook',
      'CTA',
      'Prompt AI'
    ],
    objections: [
      'Takut tidak bisa konsisten',
      'Belum pernah main Threads',
      'Sudah pernah beli template'
    ],
    cta: [
      'Tulis PILLAR',
      'DM PILLAR'
    ]
  },
  {
    id: 'PK004',
    category: 'AI',
    product_name: 'Prompt Library',
    description: 'Kumpulan prompt AI untuk bisnis dan produktivitas.',
    target_audience: ['Pebisnis', 'Content Creator', 'Mahasiswa'],
    pain_points: [
      'Tidak bisa membuat prompt',
      'Hasil AI jelek',
      'Bingung mulai'
    ],
    benefits: [
      'Hasil AI lebih bagus',
      'Menghemat waktu',
      'Produktivitas meningkat'
    ],
    features: [
      '1000 Prompt',
      'Prompt by Category',
      'Prompt Marketing',
      'Prompt Bisnis'
    ],
    objections: [
      'Sudah pakai ChatGPT',
      'Bisa cari prompt gratis'
    ],
    cta: [
      'Tulis PROMPT',
      'DM AI'
    ]
  },
  {
    id: 'PK005',
    category: 'Personal Branding',
    product_name: 'Personal Branding Blueprint',
    description: 'Panduan membangun personal branding di media sosial.',
    target_audience: ['Coach', 'Mentor', 'Freelancer', 'Pebisnis'],
    pain_points: [
      'Sulit dikenal',
      'Followers tidak bertambah',
      'Sulit mendapat klien'
    ],
    benefits: [
      'Brand lebih kuat',
      'Lebih dipercaya',
      'Mendapat inbound leads'
    ],
    features: [
      'Content Strategy',
      'Profile Optimization',
      'Content Calendar'
    ],
    objections: [
      'Tidak pede tampil',
      'Tidak punya waktu'
    ],
    cta: [
      'Tulis BRAND',
      'DM BRAND'
    ]
  },
  {
    id: 'PK006',
    category: 'Investasi',
    product_name: 'Invest Smart',
    description: 'Panduan investasi untuk pemula.',
    target_audience: ['Karyawan', 'Fresh Graduate'],
    pain_points: [
      'Takut rugi',
      'Tidak tahu mulai dari mana',
      'Bingung memilih instrumen'
    ],
    benefits: [
      'Paham dasar investasi',
      'Mengelola risiko',
      'Membangun aset'
    ],
    features: [
      'Video',
      'Workbook',
      'Template Keuangan'
    ],
    objections: [
      'Modal kecil',
      'Takut kehilangan uang'
    ],
    cta: [
      'Tulis INVEST',
      'DM INVEST'
    ]
  },
  {
    id: 'PK007',
    category: 'Online Course',
    product_name: 'Skill Mastery',
    description: 'Kelas online untuk meningkatkan skill profesional.',
    target_audience: ['Mahasiswa', 'Karyawan', 'Freelancer'],
    pain_points: [
      'Skill kurang',
      'Sulit naik karier',
      'Kurang percaya diri'
    ],
    benefits: [
      'Skill meningkat',
      'Sertifikat',
      'Peluang karier lebih baik'
    ],
    features: [
      'Video HD',
      'Mentoring',
      'Komunitas',
      'Studi Kasus'
    ],
    objections: [
      'Tidak punya waktu',
      'Takut tidak selesai'
    ],
    cta: [
      'Tulis BELAJAR',
      'DM KELAS'
    ]
  },
  {
    id: 'PK008',
    category: 'Shopee Affiliate',
    product_name: 'Produk Affiliate Shopee',
    description: 'Konten yang bertujuan membantu audiens menemukan produk yang bermanfaat melalui link affiliate Shopee.',
    target_audience: [
      'Ibu Rumah Tangga',
      'Mahasiswa',
      'Karyawan',
      'Content Creator',
      'Pemburu Diskon',
      'Pecinta Gadget',
      'Pecinta Skincare',
      'Pengguna Shopee'
    ],
    pain_points: [
      'Followers tidak klik link',
      'Konten sepi engagement',
      'Komisi kecil',
      'Sulit memilih produk viral',
      'Takut dianggap hard selling'
    ],
    benefits: [
      'Membantu audiens menemukan produk terbaik',
      'Menghemat waktu memilih produk',
      'Mendapat harga promo',
      'Memberikan rekomendasi berdasarkan pengalaman'
    ],
    features: [
      'Spill Produk Viral Shopee',
      'Review Jujur & Unboxing',
      'Rekomendasi Produk Best Seller',
      'Link Bio & Comment Direct'
    ],
    objections: [
      'Dianggap spamming link',
      'Takut dibilang jualan mulu'
    ],
    cta: [
      'Link produk ada di bio.',
      'Kalau mau produknya, cek link bio.',
      'Aku taruh linknya di bio ya.',
      'Kalau tertarik, tinggal klik link bio.',
      'Produknya ada di etalase Shopee-ku.',
      'Link Shopee ada di komentar.'
    ]
  }
];
