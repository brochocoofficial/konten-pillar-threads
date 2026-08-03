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
    price = 'Harga Special',
    duration = '7-14 hari'
  } = input;

  const targetAudiencesList = targetAudiences.length > 0 ? targetAudiences : ['Target General'];
  const toneList = toneContents.length > 0 ? toneContents : ['Santai & Relate'];

  // 1. Generate 3-4 Content Pillars tailored to product
  const contentPillars: ContentPillar[] = [
    {
      id: 'p1',
      name: `Edu-Value & Miskonsepsi (${category})`,
      description: `Edukasi mendalam mengenai masalah utama yang dihadapi target audiens, meluruskan mitos/miskonsepsi di bidang ${category}.`,
      percentage: 40,
      purpose: 'Membangun authority, kepercayaan, & memicu save/bookmark.',
      exampleAngles: [
        `3 Kesalahan fatal pas nyobain ${category} yang bikin uang terbuang`,
        `Dulu aku kira ${productName} itu cuma buat orang tertentu, ternyata...`,
        `Mitos terbesar soal ${category} yang sering dipercaya netizen`
      ]
    },
    {
      id: 'p2',
      name: `Relatable Story & Case Study (${productName})`,
      description: `Cerita pengalaman nyata, sebelum-sesudah, atau POV penggunaan sehari-hari yang sangat dekat dengan kehidupan audiens.`,
      percentage: 30,
      purpose: 'Meningkatkan keterikatan emosional (relatability) & pancing kuis/diskusi.',
      exampleAngles: [
        `POV: Nyesel baru tau ${productName} setelah bertahun-tahun nyoba cara lama`,
        `Spill jujur pemakaian ${duration}: apa yang beneran ngaruh dan enggak`,
        `Jujur nanya, kalian tim cara A atau cara B pas pake ${category}?`
      ]
    },
    {
      id: 'p3',
      name: `Soft Selling & Demonstration`,
      description: `Menunjukkan keunikan produk secara alami saat menyelesaikan problem spesifik tanpa jualan agresif.`,
      percentage: 20,
      purpose: 'Mengubah pembaca yang tertarik menjadi pertimbangan beli (consideration).',
      exampleAngles: [
        `Gimana caranya ${productName} beresin masalah dalam ${duration}`,
        `Review jujur tanpa endorse: ini alasan kenapa ${productName} layak dicoba`,
        `Battle perbandingan produk di kelas harga ${price}`
      ]
    },
    {
      id: 'p4',
      name: `Direct Offer & Social Proof (Hard Selling)`,
      description: `Testimoni, bukti hasil nyata, promo terbatas, dan dorongan langsung klik link di reply/komen.`,
      percentage: 10,
      purpose: 'Konversi penjualan cepat & urgency promo.',
      exampleAngles: [
        `Spill link termurah + promo khusus minggu ini buat ${productName}`,
        `Cek testimoni jujur pembeli sebelum kuota promo habis!`
      ]
    }
  ];

  // Determine platforms to generate for
  const isBoth = platform === 'both';
  const selectedPlatforms: ('Threads' | 'X')[] = isBoth 
    ? ['Threads', 'X', 'Threads', 'X', 'Threads', 'X', 'Threads'] 
    : Array(7).fill(platform === 'threads' ? 'Threads' : 'X');

  // 7 Days Content Plan Generator following 70-20-10 (Threads) and 4-1-1 (X)
  const days = [
    { dayNumber: 1, dayName: 'Hari 1 - Senin', pillar: contentPillars[0].name, type: 'Edukasi' as const, cycle: 'Value' as const, time: '07:00 WIB' },
    { dayNumber: 2, dayName: 'Hari 2 - Selasa', pillar: contentPillars[0].name, type: 'Problem' as const, cycle: 'Value' as const, time: '12:30 WIB' },
    { dayNumber: 3, dayName: 'Hari 3 - Rabu', pillar: contentPillars[1].name, type: 'Demo' as const, cycle: 'Value' as const, time: '19:00 WIB' },
    { dayNumber: 4, dayName: 'Hari 4 - Kamis', pillar: contentPillars[2].name, type: 'Testimoni' as const, cycle: 'Soft Promo' as const, time: '12:30 WIB' },
    { dayNumber: 5, dayName: 'Hari 5 - Jumat', pillar: contentPillars[1].name, type: 'Personal' as const, cycle: 'Value' as const, time: '19:00 WIB' },
    { dayNumber: 6, dayName: 'Hari 6 - Sabtu', pillar: contentPillars[1].name, type: 'Pancing' as const, cycle: 'Engagement' as const, time: '09:00 WIB' },
    { dayNumber: 7, dayName: 'Hari 7 - Minggu', pillar: contentPillars[3].name, type: 'Offer' as const, cycle: 'Hard Promo' as const, time: '19:30 WIB' },
  ];

  const contentIdeas: ContentIdea[] = days.map((day, idx) => {
    const curPlatform = selectedPlatforms[idx];
    const targetAud = targetAudiencesList[idx % targetAudiencesList.length];
    const curTone = toneList[idx % toneList.length];

    let title = '';
    let hook = '';
    let body = '';
    let threadCount = 2;
    let threadReasoning = '';
    let threadPosts: string[] = [];
    let curiosity = 8;
    let relatability = 8;
    let specificity = 8;
    let visualSuggestion = 'Foto atau screenshot asli tanpa filter lebay';

    if (day.type === 'Edukasi') {
      title = `3 Miskonsepsi & Cara Benar Penggunaan ${category}`;
      curiosity = 9;
      relatability = 8;
      specificity = 8;
      threadCount = 3;
      threadReasoning = 'Materi edukasi miskonsepsi secara ideal membutuhkan 3 utas agar pembaca bisa mencerna hook, pembahasan 3 poin, dan kesimpulan solusi tanpa kelelahan membaca.';
      
      hook = curPlatform === 'Threads'
        ? `jujurly dulu aku kira ${description.slice(0, 40)}... itu harus pake cara mahal 😭`
        : `Unpopular opinion: Banyak yang salah paham sama ${category} karena kemakan klaim berlebihan.`;

      threadPosts = [
        curPlatform === 'Threads'
          ? `jujurly dulu aku kira ${description.slice(0, 40)}... itu harus pake cara mahal 😭\n\nBanyak banget yang kepancing beli produk ratusan ribu tapi hasilnya nihil.`
          : `Unpopular opinion: Banyak yang salah paham sama ${category} karena kemakan klaim berlebihan.\n\nSimak 3 hal yang sering keliru di bawah 👇`,

        `1. Jangan percaya hasil instan 1 malam — yang penting itu konsistensi & bahan pas.\n2. Beli paling mahal belum tentu cocok buat kebutuhan harianmu.\n3. Cara pakai yang benar jauh lebih ngaruh daripada jumlah produk yang ditumpuk.`,

        `Pas aku nyobain ${productName} rutin selama ${duration}, perbedaannya kerasa signifikan banget tanpa bikin kantong bolong.\n\nDetail lengkap + tempat aku beli ada di komen/reply pertama ya biar aman dari penalti algoritma 💬`
      ];

    } else if (day.type === 'Problem') {
      title = `3 Kesalahan Utama Saat Memilih ${category}`;
      curiosity = 8;
      relatability = 9;
      specificity = 8;
      threadCount = 2;
      threadReasoning = 'Daftar kesalahan singkat paling nyaman dibaca dalam 2 utas padat agar langsung fokus pada poin dan solusi.';

      hook = curPlatform === 'Threads'
        ? `3 kesalahan pas milih ${category} yang bikin rugi & gak ngaruh sama sekali:`
        : `3 kesalahan fatal orang pas beli ${category} (nomor 2 paling sering dibiarin):`;

      threadPosts = [
        `${hook}\n\n1. Tergiur iklan tanpa cek kandungan/fungsi riil.\n2. Gak konsisten pakenya, baru 2 hari udah ganti.\n3. Lupa proteksi dasar saat pemakaian rutin.`,
        `Aku dulu sering banget terjebak nomor 2.\n\nSekarang udah benerin pola pemakaian pake ${productName} selama ${duration} & hasilnya jauh lebih memuaskan!\n\nKalian pernah ngalamin nomor berapa? Komen di bawah 👇`
      ];

    } else if (day.type === 'Demo') {
      title = `Spill Pemakaian Jujur ${productName} dalam ${duration}`;
      curiosity = 9;
      relatability = 9;
      specificity = 9;
      threadCount = 4;
      threadReasoning = 'Spill demo butuh 4 utas alur storytelling: POV menarik, latar belakang problem, bukti hasil rutin, dan arahan link.';

      hook = curPlatform === 'Threads'
        ? `sebagai orang yang males ribet, ini jujurly penyelamat banget sih...`
        : `The fact that ${productName} bisa gantiin 3 step rumit sebelumnya itu game changer.`;

      threadPosts = [
        hook,
        `POV: Dulu capek banget harus gonta-ganti cara buat beresin masalah ${category}.\n\nPengen yang ringkas, ramah kantong, tapi tetep ada hasil nyata.`,
        `Akhirnya nyobain ${productName} selama ${duration}.\n\nFormulanya nyaman, gak ribet, dan harga masuk akal di kisaran ${price}. Hasilnya ${description}.`,
        `Buat yang penasaran dan pengen coba juga, link tempat beli promo resmi aku taro di reply / komen pertama di bawah ya! 👇`
      ];

      visualSuggestion = 'Video pendek 15-30 detik pemakaian/unboxing singkat';

    } else if (day.type === 'Testimoni') {
      title = `Review Jujur & Perubahan Setelah Pakai ${productName}`;
      curiosity = 8;
      relatability = 9;
      specificity = 9;
      threadCount = 2;
      threadReasoning = 'Review testimoni cukup 2 utas ringkas agar terlihat sangat otentik dan tidak bertele-tele.';

      hook = curPlatform === 'Threads'
        ? `bun/bestie, spill jujur ya pas pertama kali pake ${productName}...`
        : `Gak expect pemakaian ${productName} bakalan dapet feedback sepositif ini.`;

      threadPosts = [
        `${hook}\n\nAwalnya ragu karena udah capek ganti-ganti produk di kategori ${category}.`,
        `Ternyata setelah ${duration} pemakaian rutin, hasilnya kerasa nyata.\n\nKey takeaway: carilah yang emang efisien & pas sama kebutuhan harian kamu.`
      ];

      visualSuggestion = 'Foto produk tampak dekat dengan pencahayaan alami';

    } else if (day.type === 'Personal') {
      title = `Pengalaman Pribadi: Mengapa Memilih ${productName}`;
      curiosity = 8;
      relatability = 9;
      specificity = 7;
      threadCount = 5;
      threadReasoning = 'Storytelling emosional dan studi kasus personal membutuhkan 5 utas lengkap untuk membangun hook emosi, konflik, momen penemuan, dampak nyata, dan ajakan diskusi.';

      hook = curPlatform === 'Threads'
        ? `kalau diinget-inget, dulu pengeluaran buat ${category} boros banget wkwk`
        : `Real story: Gimana gue memangkas budget ${category} hingga 50% tanpa ngorbanin kualitas.`;

      threadPosts = [
        hook,
        `Dulu gue punya mindset salah: makin mahal harga produk, pasti makin bagus hasilnya.\n\nAkhirnya tiap bulan uang gajian habis cuma buat hal-hal yang ternyata gak efektif.`,
        `Sampai akhirnya temen gue rekomendasiin buat nyoba ${productName}.\n\nAwalnya skeptis, tapi karena harganya terjangkau (${price}), akhirnya gue coba.`,
        `Plot twist: Dalam ${duration}, perubahannya malah jauh lebih berasa dibanding cara mahal yang dulu gue pake.\n\nPraktis, gak ribet, dan sangat efisien.`,
        `Pelajaran berharga: Jangan cuma tergiur gengsi, cari yang beneran cocok buat kamu.\n\nKalian pernah ngalamin momen penyadaran kayak gini juga gak? Diskusi di komen yuk 👇`
      ];

      visualSuggestion = 'Foto estetika meja kerja / sudut kamar saat santai';

    } else if (day.type === 'Pancing') {
      title = `Debat Kategori: Tim A vs Tim B di ${category}`;
      curiosity = 9;
      relatability = 9;
      specificity = 7;
      threadCount = 1;
      threadReasoning = 'Konten pancingan diskusi/poll terbaik disajikan dalam 1 utas tunggal agar seluruh perhatian audiens langsung tertuju pada kolom komentar.';

      hook = curPlatform === 'Threads'
        ? `Jujur nanya, kalian tim yang pakenya serba instan atau tim yang bertahap? 🧐`
        : `Poll cepat: Mana yang lebih kalian prioritaskan pas cari ${category}?`;

      threadPosts = [
        `${hook}\n\nLagi ngumpulin opini jujur netizen nih.\n\nKomen di bawah ya kalian tipe yang mana & sertain alasannya! Nanti aku spill rekomendasi terbaiknya 👇`
      ];

      visualSuggestion = 'Gambar Polling 2 Opsi atau stiker tanya jawab';

    } else {
      // Offer
      title = `Promo Terbatas & Link Akses ${productName}`;
      curiosity = 9;
      relatability = 8;
      specificity = 10;
      threadCount = 2;
      threadReasoning = 'Penawaran promo terbatas paling optimal dalam 2 utas: 1 utas hook penawaran & 1 utas rincian bonus + arahan link.';

      hook = curPlatform === 'Threads'
        ? `POV: Beli ${productName} pas harga promo ${price}, eh malah nyesel... Nyesel kenapa gak dari dulu 😭`
        : `Slot promo ${productName} dibuka lagi minggu ini. Cek ketersediaannya sebelum balik harga normal.`;

      threadPosts = [
        hook,
        `Buat yang kemaren nanyain tempat beli ${productName} yang terjamin ori dan harga paling miring:\n\n✨ Dapatkan promo diskon khusus (${price})\n✨ Garansi original & pengiriman cepat\n\nLink pembelian lengkap aku taro di reply / komen pertama di bawah ini ya 👇`
      ];

      visualSuggestion = 'Banner promo bersih atau foto paket siap kirim';
    }

    const totalScore = Number(((curiosity * 0.4) + (relatability * 0.3) + (specificity * 0.3)).toFixed(1));

    // Joined body for full text copy
    body = threadPosts.map((post, pIdx) => `[Utas ${pIdx + 1}/${threadCount}]\n${post}`).join('\n\n---\n\n');

    const linkPlac: any = curPlatform === 'Threads'
      ? {
          placement: 'COMMENT_1',
          condition: 'Drop link hanya di Comment #1 setelah mencapai >= 500 views (Formula Link Safety - Penalti reach -70% jika di main post).',
          copyText: `Link yang aku pakai aku taruh sini ya 👇\n${productUrl}\nPs: ${price}`
        }
      : {
          placement: 'REPLY_1',
          condition: 'Drop link di Reply Pertama atau arahkan ke Bio (Algoritma X 2026: Link di main post kena penalti reach ~30-50%).',
          copyText: `Detail lengkap & link promo resmi bisa kamu cek di sini ya: ${productUrl} 👇`
        };

    return {
      id: `idea_${idx + 1}`,
      dayNumber: day.dayNumber,
      dayName: day.dayName,
      platform: curPlatform,
      pillar: day.pillar,
      contentType: day.type,
      cycleType: day.cycle,
      postTime: day.time,
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
      threadCount,
      threadReasoning,
      threadPosts,
      body,
      visualSuggestion,
      linkPlacement: linkPlac,
      reachBoosterChecklist: [
        'Engage ke 10 akun di niche yang sama 15 menit sebelum posting',
        'Balas semua komentar masuk dalam waktu < 10 menit pertama',
        'Dukung / tinggalkan komentar berbobot di 5 akun besar (jerung) untuk pancing traffic'
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
      ruleSummary: isBoth 
        ? 'Cross-Platform Mastery: Threads (Formula 70-20-10 & Link Safety Comment 1) + X (Formula 4-1-1 Rule & Reply Link Placement)'
        : platform === 'threads' 
          ? 'Threads Formula: 70% Value, 20% Relate, 10% Selling + Link Safety Comment #1 (>500 views)'
          : 'X (Twitter) Formula: 4-1-1 Rule Cycle + High Reply Weight Boost Algorithm',
      bestPostingTimes: ['07:00 WIB (Pagi)', '12:30 WIB (Siang / Istirahat)', '19:00 WIB (Malam / Peak Traffic)'],
      algorithmTips: [
        'Dilarang menaruh link di body post utama (Threads penalti reach -70%, X penalti ~30-50%).',
        'Balas komentar dalam 60 menit pertama untuk memicu velocity algorithm boost.',
        'Hook harus menarik di 1-2 kalimat pertama tanpa terkesan hard-sell.'
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
