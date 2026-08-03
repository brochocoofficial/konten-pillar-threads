import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { generateLocalContentPlan } from './src/data/generatorEngine.js';
import { GenerateFormInput, GenerationResult } from './src/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Route: Generate Content Plan
  app.post('/api/generate', async (req, res) => {
    try {
      const input: GenerateFormInput = req.body;

      if (!input || !input.productName || !input.category) {
        res.status(400).json({ error: 'Nama produk dan kategori wajib diisi.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        console.log('GEMINI_API_KEY tidak ditemukan atau default, menggunakan local algorithmic engine fallback.');
        const result = generateLocalContentPlan(input);
        res.json(result);
        return;
      }

      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });

        const systemInstruction = `
Kamu adalah Master Content Strategist & Content Planner profesional khusus Threads dan X (Twitter).
Kamu sangat menguasai dokumen acuan utama:
1. THREADS SYSTEM INSTRUCTIONS:
   - Rule 70-20-10 Mix (70% Value, 20% Relate, 10% Selling).
   - Link Safety First: Dilarang keras menaruh link di main post (penalti reach -70%). Link hanya di Comment 1 setelah >= 500 views.
   - Hook Virality Score: (Curiosity * 0.4) + (Relatability * 0.3) + (Specificity * 0.3). Minimal Score 7.0.
2. X (TWITTER) SYSTEM INSTRUCTIONS:
   - Rule 4-1-1 Mix Cycle (4 Value, 1 Soft Promo, 1 Hard Promo).
   - Link Placement: Dilarang di main post (penalti reach ~30-50%). Link hanya di Reply Pertama, Thread ke-2, atau arahkan ke Bio.
3. SMART THREAD GENERATION (ATURAN PEMBUATAN UTAS):
   - JANGAN PERNAH selalu menghasilkan 2 utas atau mematok jumlah utas yang sama untuk seluruh postingan!
   - Tentukan secara mandiri jumlah utas ideal (antara 1 hingga 5 utas) untuk setiap ide konten berdasarkan evaluasi SMART DECISION RULES:
     1. Kompleksitas topik.
     2. Banyaknya poin penting.
     3. Kekuatan hook.
     4. Kebutuhan storytelling.
     5. Kedalaman edukasi.
     6. Panjang CTA.
     7. Kenyamanan membaca.
   - Contoh distribusi utas:
     - Hook sederhana + info/poll singkat -> 1 utas.
     - Tips singkat beberapa poin -> 2-3 utas.
     - Edukasi penjelasan mendalam -> 3-4 utas.
     - Storytelling, studi kasus, atau breakdown produk -> 4-5 utas.
   - Variasikan jumlah utas di antara ke-7 ide konten (misal Day 1: 3, Day 2: 2, Day 3: 4, Day 4: 2, Day 5: 5, Day 6: 1, Day 7: 2).
   - Setiap utas dalam 'threadPosts' harus memiliki transisi yang alami, bernilai tambah, dan tidak ada teks bertele-tele yang dipaksakan.

Hasilkan output JSON terstruktur yang persis sesuai dengan skema.
`;

        const prompt = `
Buatkan Konten Pilar & 7 Ide Konten Lengkap berdasarkan input berikut:
- Nama Produk: ${input.productName}
- Kategori: ${input.category}
- Deskripsi Produk: ${input.description}
- Tujuan (Goal): ${input.goal}
- Platform Target: ${input.platform}
- Target Audiens Terpilih: ${input.targetAudiences.join(', ')}
- Tone Konten Terpilih: ${input.toneContents.join(', ')}
- Link Produk: ${input.productUrl || 'https://link.produk.com'}
- Harga / Info tambahan: ${input.price || '-'}

Persyaratan Output:
1. Buat 3-4 Content Pillars dengan nama, deskripsi, persentase alokasi, tujuan, dan contoh angle.
2. Buat 7 Content Ideas (Hari 1-7 / Senin-Minggu):
   - Tentukan threadCount (1 hingga 5 utas) secara mandiri untuk masing-masing ide.
   - Sertakan threadReasoning (alasan pemilihan jumlah utas tersebut) & threadPosts (array string isi tiap utas dari utas 1 hingga utas N).
   - Pastikan body berisi gabungan seluruh threadPosts dalam format rapi.
   - Sertakan hook, hookScore breakdown, visualSuggestion, linkPlacement, dan reachBoosterChecklist.
3. Strategi Rangkuman Algoritma & Timing Posting.
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.7,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                productName: { type: Type.STRING },
                category: { type: Type.STRING },
                description: { type: Type.STRING },
                goal: { type: Type.STRING },
                platform: { type: Type.STRING },
                selectedAudiences: { type: Type.ARRAY, items: { type: Type.STRING } },
                selectedTones: { type: Type.ARRAY, items: { type: Type.STRING } },
                contentPillars: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      description: { type: Type.STRING },
                      percentage: { type: Type.NUMBER },
                      purpose: { type: Type.STRING },
                      exampleAngles: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['id', 'name', 'description', 'percentage', 'purpose', 'exampleAngles']
                  }
                },
                contentIdeas: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      dayNumber: { type: Type.NUMBER },
                      dayName: { type: Type.STRING },
                      platform: { type: Type.STRING },
                      pillar: { type: Type.STRING },
                      contentType: { type: Type.STRING },
                      cycleType: { type: Type.STRING },
                      postTime: { type: Type.STRING },
                      targetAudience: { type: Type.STRING },
                      tone: { type: Type.STRING },
                      title: { type: Type.STRING },
                      hook: { type: Type.STRING },
                      hookScore: {
                        type: Type.OBJECT,
                        properties: {
                          curiosity: { type: Type.NUMBER },
                          relatability: { type: Type.NUMBER },
                          specificity: { type: Type.NUMBER },
                          total: { type: Type.NUMBER },
                          status: { type: Type.STRING }
                        },
                        required: ['curiosity', 'relatability', 'specificity', 'total', 'status']
                      },
                      threadCount: { type: Type.NUMBER },
                      threadReasoning: { type: Type.STRING },
                      threadPosts: { type: Type.ARRAY, items: { type: Type.STRING } },
                      body: { type: Type.STRING },
                      visualSuggestion: { type: Type.STRING },
                      linkPlacement: {
                        type: Type.OBJECT,
                        properties: {
                          placement: { type: Type.STRING },
                          condition: { type: Type.STRING },
                          copyText: { type: Type.STRING }
                        },
                        required: ['placement', 'condition', 'copyText']
                      },
                      reachBoosterChecklist: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: [
                      'id', 'dayNumber', 'dayName', 'platform', 'pillar',
                      'contentType', 'cycleType', 'postTime', 'targetAudience',
                      'tone', 'title', 'hook', 'hookScore', 'threadCount',
                      'threadReasoning', 'threadPosts', 'body',
                      'visualSuggestion', 'linkPlacement', 'reachBoosterChecklist'
                    ]
                  }
                },
                strategySummary: {
                  type: Type.OBJECT,
                  properties: {
                    ruleSummary: { type: Type.STRING },
                    bestPostingTimes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    algorithmTips: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ['ruleSummary', 'bestPostingTimes', 'algorithmTips']
                }
              },
              required: [
                'productName', 'category', 'description', 'goal',
                'platform', 'selectedAudiences', 'selectedTones',
                'contentPillars', 'contentIdeas', 'strategySummary'
              ]
            }
          }
        });

        const jsonText = response.text;
        if (jsonText) {
          const parsed: GenerationResult = JSON.parse(jsonText);
          parsed.generatedAt = new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          res.json(parsed);
          return;
        } else {
          throw new Error('Gemini API returned empty text');
        }
      } catch (geminiError) {
        console.error('Error invoking Gemini API, using fallback generator:', geminiError);
        const fallbackResult = generateLocalContentPlan(input);
        res.json(fallbackResult);
      }
    } catch (err: any) {
      console.error('Server generate error:', err);
      res.status(500).json({ error: 'Gagal memproses pembuatan konten plan.' });
    }
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
