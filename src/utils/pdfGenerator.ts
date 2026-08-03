import { jsPDF } from 'jspdf';
import { GenerationResult, GenerateFormInput } from '../types';

export const generateContentPlanPDF = (
  result: GenerationResult,
  userInput?: GenerateFormInput | null
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 180mm
  let y = 18;

  // Helper for adding a new page when needed
  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 18) {
      doc.addPage();
      y = 18;
      // Header bar on new page
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(margin, 8, contentWidth, 6, 'F');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`PillarFlow AI — ${result.productName} (${result.category})`, margin + 2, 12);
      y = 20;
    }
  };

  // --- 1. JUDUL DOKUMEN ---
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(margin, y, contentWidth, 20, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('PILLARFLOW AI — CONTENT PLANNER & STRATEGY', margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(224, 231, 255); // indigo-100
  doc.text('Dokumen Strategi Konten Threads & X (Twitter) Berbasis Formula Master', margin + 6, y + 15);

  y += 26;

  // --- 2. INFORMASI PEMBUATAN ---
  ensureSpace(25);
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('INFORMASI PEMBUATAN DOKUMEN', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600

  const platLabel =
    result.platform === 'both'
      ? 'Threads & X (Twitter)'
      : result.platform === 'threads'
      ? 'Threads (Instagram)'
      : 'X (Twitter)';

  doc.text(`• Tanggal Pembuatan : ${result.generatedAt || new Date().toLocaleDateString('id-ID')}`, margin + 4, y + 11);
  doc.text(`• Target Platform    : ${platLabel}`, margin + 4, y + 16);
  doc.text(`• Nama Produk/Brand  : ${result.productName}`, margin + 95, y + 11);
  doc.text(`• Kategori Konten    : ${result.category}`, margin + 95, y + 16);

  y += 28;

  // --- 3. PROMPT ATAU INPUT PENGGUNA ---
  ensureSpace(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text('1. PROMPT / INPUT STRATEGI PENGGUNA', margin, y);
  y += 4;

  const descText = userInput?.description || result.description || '-';
  const goalText = userInput?.goal || result.goal || '-';
  const audsText = userInput?.targetAudiences?.join(', ') || result.selectedAudiences?.join(', ') || '-';
  const tonesText = userInput?.toneContents?.join(', ') || result.selectedTones?.join(', ') || '-';

  const inputBlockLines = [
    `• Deskripsi Produk/Jasa : ${descText}`,
    `• Tujuan Utama Konten   : ${goalText}`,
    `• Target Audiens        : ${audsText}`,
    `• Tone & Style Bahasa   : ${tonesText}`,
  ];

  if (userInput?.price) inputBlockLines.push(`• Estimasi Harga/Promo  : ${userInput.price}`);
  if (userInput?.duration) inputBlockLines.push(`• Durasi Pemakaian      : ${userInput.duration}`);

  let inputBlockHeight = 8;
  inputBlockLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, contentWidth - 8);
    inputBlockHeight += wrapped.length * 4.2;
  });

  ensureSpace(inputBlockHeight + 4);
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(margin, y, contentWidth, inputBlockHeight, 2, 2, 'FD');

  let curY = y + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85); // slate-700

  inputBlockLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, contentWidth - 8);
    doc.text(wrapped, margin + 4, curY);
    curY += wrapped.length * 4.2;
  });

  y += inputBlockHeight + 10;

  // --- 4. HASIL KONTEN AI ---

  // 4A. CONTENT PILLARS
  ensureSpace(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text('2. STRATEGI KONTEN PILAR (CONTENT PILLARS)', margin, y);
  y += 6;

  result.contentPillars.forEach((pillar, pIdx) => {
    const pillarTitle = `${pIdx + 1}. ${pillar.name} (${pillar.percentage}%)`;
    const descLines = doc.splitTextToSize(`Deskripsi: ${pillar.description}`, contentWidth - 8);
    const purpLines = doc.splitTextToSize(`Tujuan: ${pillar.purpose}`, contentWidth - 8);
    const angleLines = doc.splitTextToSize(`Contoh Angle: ${pillar.exampleAngles.join(' | ')}`, contentWidth - 8);

    const blockH = 8 + (descLines.length + purpLines.length + angleLines.length) * 4.2;
    ensureSpace(blockH + 4);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, blockH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(pillarTitle, margin + 4, y + 5);

    let py = y + 9.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    doc.text(descLines, margin + 4, py);
    py += descLines.length * 4.2;

    doc.text(purpLines, margin + 4, py);
    py += purpLines.length * 4.2;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241); // indigo-500
    doc.text(angleLines, margin + 4, py);

    y += blockH + 4;
  });

  y += 6;

  // 4B. 7-DAY CONTENT CALENDAR & SMART THREADS
  ensureSpace(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text('3. KALENDER 7 HARI & RANGKAIAN UTAS (SMART THREADS)', margin, y);
  y += 6;

  result.contentIdeas.forEach((idea) => {
    const headerTitle = `${idea.dayName} [${idea.platform.toUpperCase()}] — Jam ${idea.postTime}`;
    const badgeText = `${idea.contentType} | Pilar: ${idea.pillar} | 💬 ${idea.threadCount || 1} Utas`;

    // Calculate height needed for this idea
    const reasoningLines = idea.threadReasoning
      ? doc.splitTextToSize(`Alasan AI (${idea.threadCount || 1} Utas): ${idea.threadReasoning}`, contentWidth - 8)
      : [];

    const hookLines = doc.splitTextToSize(`Hook: "${idea.hook}"`, contentWidth - 8);

    // Thread posts
    const postsArray = idea.threadPosts && idea.threadPosts.length > 0
      ? idea.threadPosts
      : [idea.body];

    let postsTotalHeight = 0;
    const splitPosts = postsArray.map((pText, idx) => {
      const headerStr = postsArray.length === 1 ? 'Post Utama (Utas 1/1):' : `Utas ${idx + 1} dari ${postsArray.length}:`;
      const wrapped = doc.splitTextToSize(pText, contentWidth - 10);
      postsTotalHeight += 6 + wrapped.length * 4.2 + 3;
      return { headerStr, wrapped };
    });

    const visualLines = doc.splitTextToSize(`Saran Visual: ${idea.visualSuggestion}`, contentWidth - 8);
    const linkLines = doc.splitTextToSize(`Penempatan Link (${idea.linkPlacement.placement}): ${idea.linkPlacement.copyText}`, contentWidth - 8);

    const cardHeight =
      12 +
      (reasoningLines.length ? reasoningLines.length * 4 + 3 : 0) +
      hookLines.length * 4.2 +
      6 +
      postsTotalHeight +
      visualLines.length * 4 +
      linkLines.length * 4 +
      6;

    ensureSpace(Math.min(cardHeight, 180)); // If very long, enable partial block or space check

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, 'FD');

    let iy = y + 5;

    // Header bar inside card
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(headerTitle, margin + 4, iy);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(124, 58, 237); // Purple 600
    doc.text(badgeText, margin + 110, iy);

    iy += 5;

    // AI Reasoning
    if (reasoningLines.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(109, 40, 217); // purple-700
      doc.text(reasoningLines, margin + 4, iy);
      iy += reasoningLines.length * 3.8 + 2;
    }

    // Hook
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(hookLines, margin + 4, iy);
    iy += hookLines.length * 4.2 + 2;

    // Hook score
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Score Hook: ${idea.hookScore.total}/10 (${idea.hookScore.status}) | Curiosity: ${idea.hookScore.curiosity} | Relatability: ${idea.hookScore.relatability} | Specificity: ${idea.hookScore.specificity}`, margin + 4, iy);
    iy += 5;

    // Posts
    splitPosts.forEach((post) => {
      ensureSpace(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(79, 70, 229);
      doc.text(post.headerStr, margin + 4, iy);
      iy += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(post.wrapped, margin + 6, iy);
      iy += post.wrapped.length * 4.2 + 2;
    });

    // Visual & Link
    ensureSpace(10);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(visualLines, margin + 4, iy);
    iy += visualLines.length * 3.8 + 1;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(217, 119, 6); // amber-600
    doc.text(linkLines, margin + 4, iy);

    y += cardHeight + 6;
  });

  y += 4;

  // 4C. ALGORITHM STRATEGY
  ensureSpace(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(79, 70, 229);
  doc.text('4. RANGKUMAN STRATEGI & OPTIMASI ALGORITMA', margin, y);
  y += 6;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Formula Acuan: ${result.strategySummary.ruleSummary}`, margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`• Waktu Posting Terbaik : ${result.strategySummary.bestPostingTimes.join(' | ')}`, margin + 4, y + 10);

  const tipsText = doc.splitTextToSize(`• Tips Algoritma     : ${result.strategySummary.algorithmTips.join(' • ')}`, contentWidth - 8);
  doc.text(tipsText, margin + 4, y + 15);

  y += 30;

  // --- 5. FOOTER DI SETIAP HALAMAN ---
  const totalPages = doc.internal.pages.length - 1; // 1-indexed in jsPDF

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.text(
      'Diproses oleh PillarFlow AI Content Planner — Formula Master Threads & X',
      margin,
      pageHeight - 7
    );

    doc.text(
      `Halaman ${i} dari ${totalPages}`,
      pageWidth - margin - 22,
      pageHeight - 7
    );
  }

  // Trigger Save
  const safeFileName = result.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  doc.save(`pillarflow-${safeFileName}-content-planner.pdf`);
};
