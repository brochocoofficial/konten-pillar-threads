import { GenerateFormInput, GenerationResult, ContentPillar, ContentIdea } from '../types';

export function generateLocalContentPlan(input: GenerateFormInput): GenerationResult {
  const {
    productName,
    category,
    description,
    goal,
    platform,
    targetAudiences,
    toneContents,
    productUrl = 'https://link.produk.com',
    price = 'Harga Promo',
    duration = '7-14 hari'
  } = input;

  const targetAudiencesList = targetAudiences.length > 0 ? targetAudiences : ['Content Creator Pemula'];
  const toneList = toneContents.length > 0 ? toneContents : ['Friendly & Ngobrol (Santai)'];
  const painStr = input.painPoints && input.painPoints.length > 0 ? input.painPoints.join(', ') : 'masalah utama';
  const benefitStr = input.benefits && input.benefits.length > 0 ? input.benefits.join(', ') : 'hasil optimal';
  const featureStr = input.features && input.features.length > 0 ? input.features.join(', ') : 'fasilitas lengkap';
  const ctaChoice = input.cta && input.cta.length > 0 ? input.cta[0] : 'Tulis di komentar';

  // 1. Generate Content Pillars tailored to product & user knowledge
  const contentPillars: ContentPillar[] = [
    {
      id: 'p1',
      name: `Edu-Value & Miskonsepsi (${category})`,
      description: `Edukasi mendalam mengenai masalah utama target audiens, meluruskan mitos/miskonsepsi di bidang ${category}.`,
      percentage: 40,
      purpose: 'Membangun authority, kepercayaan, & memicu save/bookmark.',
      exampleAngles: [
        'Mitos vs Fakta',
        'Kesalahan Pemula',
        'Tutorial & Step by Step',
        'Checklist & Quick Wins'
      ]
    },
    {
      id: 'p2',
      name: `Relatable Story & Case Study (${productName})`,
      description: `Cerita pengalaman nyata, sebelum-sesudah, atau POV penggunaan sehari-hari yang dekat dengan kehidupan audiens.`,
      percentage: 30,
      purpose: 'Meningkatkan keterikatan emosional (relatability) & pancing kuis/diskusi.',
      exampleAngles: [
        'Before After',
        'Pengalaman / Curhat',
        'Case Study',
        'Behind The Scene'
      ]
    },
    {
      id: 'p3',
      name: `Soft Selling & Framework Solution`,
      description: `Menunjukkan keunikan produk secara alami saat menyelesaikan problem spesifik tanpa jualan agresif.`,
      percentage: 20,
      purpose: 'Mengubah pembaca yang tertarik menjadi pertimbangan beli (consideration).',
      exampleAngles: [
        'Problem Solution',
        'Framework',
        'Perbandingan / Review',
        'Rahasia'
      ]
    },
    {
      id: 'p4',
      name: `Direct Offer & Call-to-Action (Hard Selling)`,
      description: `Testimoni, bukti hasil nyata, promo terbatas, dan dorongan langsung klik link di reply/komen.`,
      percentage: 10,
      purpose: 'Konversi penjualan cepat & urgency promo.',
      exampleAngles: [
        'Quick Wins',
        'Challenge',
        'Review & Offer'
      ]
    }
  ];

  // 30 Days Content Plan Generator following 70-20-10 for Threads
  const contentTypes: {
    type: ContentIdea['contentType'];
    cycle: ContentIdea['cycleType'];
    pattern: string;
    defaultAngle: string;
  }[] = [
    { type: 'Edukasi', cycle: 'Value', pattern: 'Pattern 1: Problem - Solution - Tutorial', defaultAngle: 'Kesalahan Pemula' },
    { type: 'Problem', cycle: 'Value', pattern: 'Pattern 5: Myth Busting & Fact Check', defaultAngle: 'Mitos vs Fakta' },
    { type: 'Demo', cycle: 'Value', pattern: 'Pattern 2: Storytelling & Lesson', defaultAngle: 'Before After' },
    { type: 'Testimoni', cycle: 'Soft Promo', pattern: 'Pattern 4: Case Study & Framework', defaultAngle: 'Case Study' },
    { type: 'Personal', cycle: 'Value', pattern: 'Pattern 2: Storytelling & Lesson', defaultAngle: 'Pengalaman' },
    { type: 'Pancing', cycle: 'Engagement', pattern: 'Pattern 3: Listicle & Explainer', defaultAngle: 'Hot Take' },
    { type: 'Offer', cycle: 'Hard Promo', pattern: 'Pattern 1: Problem - Solution - Tutorial', defaultAngle: 'Quick Wins' }
  ];

  const contentIdeas: ContentIdea[] = Array.from({ length: 30 }).map((_, idx) => {
    const dayNum = idx + 1;
    const curPlatform = 'Threads';
    const targetAud = targetAudiencesList[idx % targetAudiencesList.length];
    const curTone = toneList[idx % toneList.length];
    const typeObj = contentTypes[idx % contentTypes.length];
    const selectedAngle = input.contentAngles && input.contentAngles.length > 0 
      ? input.contentAngles[idx % input.contentAngles.length]
      : typeObj.defaultAngle;

    const pillar = contentPillars[idx % contentPillars.length].name;

    let title = `${selectedAngle}: ${productName} untuk ${targetAud}`;
    let hook = `Kalau kamu masih pusing urusan ${category}, coba perhatikan hal ini...`;
    let threadCount = (idx % 3) + 2; // 2, 3, or 4 threads
    let threadReasoning = `Format ${typeObj.type} dengan angle ${selectedAngle} disajikan dalam ${threadCount} utas agar penyampaian tajam dan ramah algoritma Threads.`;
    let threadPosts: string[] = [];
    let curiosity = 8 + (idx % 2);
    let relatability = 8 + ((idx + 1) % 2);
    let specificity = 8 + ((idx + 2) % 2);
    let visualSuggestion = 'Foto atau screenshot asli tanpa filter berlebihan';

    if (typeObj.type === 'Edukasi') {
      title = `[Utas ${dayNum}] Kesalahan Pemula di ${category} & Solusinya`;
      hook = `90% orang masih salah sangka saat mencoba ${category}. Padahal ada cara jauh lebih simpel.`;
      threadPosts = [
        hook + `\n\nBanyak orang terbentur pada ${painStr}.\n\nHasilnya stagnan dan bikin frustrasi.`,
        `Kesalahan 1: Mengabaikan pemahaman mendasar.\n\nKesalahan 2: Terburu-buru tanpa perencanaan yang matang.`,
        `Solusi utamanya adalah menggunakan fitur ${featureStr} dari ${productName}.\n\nIni membantu kamu mendapatkan ${benefitStr} lebih cepat.`,
        `Langkah 1: Identifikasi masalah utama dalam alur kerjamu.`,
        `Langkah 2: Terapkan sistem dari ${productName} secara konsisten.`,
        `Langkah 3: Evaluasi hasil dan tingkatkan kualitas konten.`,
        `Coba terapkan langkah ini dalam 7 hari ke depan.\n\nKalau bermanfaat, simpan postingan ini ya.`
      ];
    } else if (typeObj.type === 'Problem') {
      title = `[Utas ${dayNum}] Mitos vs Fakta ${category} yang Perlu Kamu Tahu`;
      hook = `Banyak orang mengira ${category} itu harus mahal dan rumit.\n\nFaktanya tidak seperti itu sama sekali.`;
      threadPosts = [
        hook + `\n\nMitos 1: Kamu harus luangkan waktu berjam-jam untuk mengatasi ${painStr}.`,
        `Fakta 1: Dengan ${productName}, kamu bisa atasi masalah ini secara otomatis dan cepat.`,
        `Mitos 2: Hasilnya butuh waktu berbulan-bulan.`,
        `Fakta 2: Dampak awal terasa sejak minggu pertama.`,
        `Manfaat utamanya: ${benefitStr}.\n\nSimpan postingan ini biar tidak lupa.`
      ];
    } else if (typeObj.type === 'Demo') {
      title = `[Utas ${dayNum}] Transformasi Sebelum & Sesudah Pakai ${productName}`;
      hook = `Dulu aku sempat pusing beresin ${painStr}.\n\nSekarang semuanya berubah jauh lebih efisien.`;
      threadPosts = [
        hook + `\n\nKondisi Sebelum: Alur serba manual, memakan waktu, dan hasilnya belum optimal.`,
        `Momen Titik Balik: Mengenal fitur ${featureStr} pada ${productName}.`,
        `Kondisi Sesudah: Terbukti membantu ${benefitStr} tanpa perlu ribet.`,
        `Prosesnya terasa ringkas dan tidak bikin capek.\n\nCoba cek detail lengkapnya di reply/komentar pertama ya.`
      ];
    } else if (typeObj.type === 'Testimoni') {
      title = `[Utas ${dayNum}] Studi Kasus: Bagaimana ${productName} Menyelesaikan ${painStr}`;
      hook = `Aku baru sadar ternyata menyelesaikan masalah ${category} itu tidak perlu bikin stres.`;
      threadPosts = [
        hook + `\n\nBanyak orang terjebak dalam siklus yang sama berulang kali.`,
        `Kuncinya ada pada keunggulan ${featureStr} dan konsistensi harian.`,
        `Hasilnya: ${benefitStr} dapat dirasakan secara nyata dan terukur.`,
        `Ada pertanyaan? Tulis di kolom komentar ya!`
      ];
    } else if (typeObj.type === 'Personal') {
      title = `[Utas ${dayNum}] Cerita & Pelajaran Penting Mengenai ${category}`;
      hook = `Kalau aku harus mengulang dari awal, aku tidak akan pernah melakukan kesalahan ini lagi.`;
      threadPosts = [
        hook + `\n\nDulu aku berpikir bahwa solusi untuk ${painStr} harus rumit.`,
        `Ternyata fokus pada ${featureStr} milik ${productName} sudah lebih dari cukup.`,
        `Pelajaran 1: Mulai dari hal mendasar dengan tools yang tepat.`,
        `Pelajaran 2: Jangan buang energi untuk hal yang bisa diotomatisasi.`,
        `Bagikan postingan ini ke temanmu yang membutuhkan!`
      ];
    } else if (typeObj.type === 'Pancing') {
      title = `[Utas ${dayNum}] Diskusi: Mana Pilihan Terbaik Menurutmu di ${category}?`;
      hook = `Yang bikin aku heran adalah masih banyak orang pilih cara rumit ketimbang cara simpel.`;
      threadPosts = [
        hook + `\n\nDalam dunia ${category}, opsi mana yang paling sering kamu pakai?`,
        `Opsi A: Mengatasi ${painStr} secara manual setiap hari.`,
        `Opsi B: Menggunakan ${productName} untuk mendapatkan ${benefitStr}.`,
        `Tulis pilihanmu (A/B) dan alasannya di kolom komentar ya!`
      ];
    } else {
      title = `[Utas ${dayNum}] Penawaran Akses Spesial ${productName}`;
      hook = `Satu kebiasaan kecil ini berhasil mengubah cara kami mengelola ${category}.`;
      threadPosts = [
        hook + `\n\nDapatkan ${productName} dengan promo spesial ${price} khusus minggu ini.`,
        `Solusi tepat untuk mengatasi ${painStr} dan mendapatkan ${benefitStr}.`,
        `Didesain khusus dengan fitur unggulan ${featureStr}.`,
        `Link promo resmi bisa kamu klik di komentar pertama ya 👇\n\nTulis "INFO" di komentar jika ingin dikirimkan detailnya.`
      ];
    }

    const totalScore = Number(((curiosity * 0.4) + (relatability * 0.3) + (specificity * 0.3)).toFixed(1));
    const body = threadPosts.map((post, pIdx) => `[Utas ${pIdx + 1}/${threadPosts.length}]\n${post}`).join('\n\n---\n\n');

    return {
      id: `idea_${dayNum}`,
      dayNumber: dayNum,
      dayName: `Hari ${dayNum} - Ide ${dayNum}`,
      platform: curPlatform,
      pillar,
      contentType: typeObj.type,
      cycleType: typeObj.cycle,
      postTime: '07:00 WIB',
      targetAudience: targetAud,
      tone: curTone,
      title,
      hook,
      hookScore: {
        curiosity,
        relatability,
        specificity,
        total: totalScore,
        status: totalScore >= 7.0 ? 'APPROVED' : 'BEST_OF_3'
      },
      threadCount: threadPosts.length,
      threadReasoning,
      threadPosts,
      body,
      visualSuggestion,
      linkPlacement: {
        placement: 'COMMENT_1',
        condition: 'Drop link hanya di Comment #1 setelah mencapai >= 500 views (Formula Link Safety - Penalti reach -70% jika di main post).',
        copyText: `Link resminya bisa kamu akses di sini ya 👇\n${productUrl}\nPs: Promo ${price}`
      },
      reachBoosterChecklist: [
        'Engage ke 10 akun di niche yang sama 15 menit sebelum posting',
        'Balas semua komentar masuk dalam waktu < 10 menit pertama',
        'Dukung / tinggalkan komentar berbobot di 5 akun besar di niche yang sama'
      ]
    };
  });

  return {
    productName,
    category,
    description,
    goal,
    platform,
    selectedAudiences: targetAudiencesList,
    selectedTones: toneList,
    contentPillars,
    contentIdeas,
    strategySummary: {
      ruleSummary: 'Threads Formula: 70% Value, 20% Relate, 10% Selling + Link Safety Comment #1 (>500 views)',
      bestPostingTimes: ['07:00 WIB (Pagi)', '12:30 WIB (Siang / Istirahat)', '19:00 WIB (Malam / Peak Traffic)'],
      algorithmTips: [
        'Maksimal 3 emoji per postingan untuk menjaga estetika dan keterbacaan.',
        'Dilarang menaruh link di body post utama (Threads penalti reach -70%, X penalti ~30-50%).',
        'Gunakan kalimat pendek (maksimal 2 kalimat per paragraf) dengan spasi jeda yang rapi.',
        'Selalu berikan Call-to-Action (CTA) yang natural di akhir postingan.'
      ]
    },
    generatedAt: new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  };
}

