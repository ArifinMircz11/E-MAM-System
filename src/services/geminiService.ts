/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * Service: geminiService.ts (Updated for API v1beta Stability)
 */

import { serverEnv } from '../core/config/serverEnv';
import { GoogleGenerativeAI } from '@google/generative-ai';

const isBrowser = typeof window !== 'undefined';

export const getAiQueryCount = (): number => {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem('emam_ai_query_count') || '0', 10);
};

export const incrementAiQueryCount = (): number => {
  if (typeof window === 'undefined') return 0;
  const current = getAiQueryCount();
  const next = current + 1;
  localStorage.setItem('emam_ai_query_count', String(next));
  return next;
};

/**
 * Core generation logic routing to backend proxy (client) or direct SDK (server)
 */
async function generateWithGemini(
  prompt: string,
  systemInstruction?: string,
  responseMimeType?: string,
): Promise<string> {
  // 1. Client-side: use Proxy to hide API Key
  if (isBrowser) {
    if (getAiQueryCount() >= 10) {
      // Limit increased for testing/evaluation
      if (responseMimeType === 'application/json') {
        return JSON.stringify({
          title: 'Batas Konten AI Tercapai',
          summary: 'Anda telah mencapai batas pertanyaan AI.',
          content:
            'Maaf, Anda telah mencapai batas operasi AI dalam sesi ini. Hubungi admin untuk meningkatkan kapasitas akses asisten pintar.',
        });
      }
      return 'LIMIT_EXCEEDED';
    }

    incrementAiQueryCount();

    try {
      // Using v1beta for better model compatibility (gemini-1.5-flash)
      const response = await fetch('/api-proxy/v1beta/models/gemini-1.5-flash:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    (systemInstruction ? `System Instruction: ${systemInstruction}\n\n` : '') +
                    String(prompt),
                },
              ],
            },
          ],
          generation_config: {
            ...(responseMimeType
              ? {
                  response_mime_type: responseMimeType,
                }
              : {}),
          },
        }),
      });

      if (response.status === 429) {
        console.warn('Gemini Proxy Rate Limited');
        return 'Maaf, sistem AI sedang sangat sibuk. Silakan coba lagi nanti.';
      }

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || `Status: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return text;
    } catch (e) {
      console.error('Gemini Proxy Request Failed:', e);
      return 'Maaf, layanan AI sedang tidak tersedia saat ini. Mohon coba beberapa saat lagi.';
    }
  }

  // 2. Server-side: Direct SDK
  const apiKey = serverEnv.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[e-Mam AI] Gemini disabled: GEMINI_API_KEY is missing from environment.');
    return 'Layanan AI dinonaktifkan (Konfigurasi API Key tidak ditemukan).';
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      ...(responseMimeType ? { generationConfig: { responseMimeType: responseMimeType } } : {}),
    });

    const result = await model.generateContent(
      (systemInstruction ? `System Instruction: ${systemInstruction}\n\n` : '') + prompt,
    );
    return result.response.text();
  } catch (err: any) {
    console.error('[e-Mam AI] Gemini Error:', err.message);
    if (err.message?.includes('API key not valid')) {
      return 'Layanan AI tidak tersedia: API Key Gemini tidak valid.';
    }
    return 'Maaf, terjadi kesalahan pada layanan AI.';
  }
}

// e-Mam v8.0 - Artificial cooldown to prevent rapid API consumption
let lastAicall = 0;
const AI_COOLDOWN = 1000; // 1 second minimum between calls

async function throttledGemini(prompt: string, sys?: string, mime?: string): Promise<string> {
  const now = Date.now();
  if (now - lastAicall < AI_COOLDOWN) {
    await new Promise((r) => setTimeout(r, AI_COOLDOWN - (now - lastAicall)));
  }
  lastAicall = Date.now();
  return generateWithGemini(prompt, sys, mime);
}

// Fungsi Utama AI
export const generateAIResponse = async (userMessage: string): Promise<string> => {
  const systemInstruction = `Anda adalah asisten pintar resmi e-Mam System (Integrated Madrasah Academic Manager). Jaawab pertanyaan user dengan sopan dan informatif.`;
  return await throttledGemini(userMessage, systemInstruction);
};

export const getEduContent = async (
  prompt: string,
  type: 'rpp' | 'quiz' | 'announcement',
): Promise<string> => {
  let systemInstruction = `Anda adalah konsultan pendidikan ahli untuk e-Mam System di MAN 1 HST.`;

  if (type === 'announcement') {
    systemInstruction = `Anda adalah Humas Madrasah yang profesional dan berwibawa. 
Tugas Anda adalah membuat pengumuman resmi yang formal, sopan, dan jelas. 
Gunakan Bahasa Indonesia baku (EYD), pastikan pesan langsung ke inti (to-the-point), dan tidak berbelit-belit.`;
  } else if (type === 'rpp') {
    systemInstruction = `Anda adalah Spesialis Kurikulum Madrasah yang ahli. 
Bantu guru menyusun Rencana Pelaksanaan Pembelajaran (RPP) yang sistematis, profesional, dan padat.`;
  }

  return await throttledGemini(prompt, systemInstruction);
};

export const getBambooAdvice = async (prompt: string): Promise<string> => {
  const systemInstruction = `Anda adalah asisten teknis resmi e-Mam System. Identifikasi NISN/Nama, lalu berikan solusi langkah-demi-langkah.`;
  return await throttledGemini(prompt, systemInstruction);
};

export const generateNewsContent = async (
  topic: string,
): Promise<{ title: string; summary: string; content: string }> => {
  const systemInstruction = `Anda adalah jurnalis sekolah profesional yang bekerja di lingkungan Pendidikan Madrasah.
Tugas Anda adalah membuat berita yang formal, sopan, berwibawa, dan baku sesuai Ejaan Bahasa Indonesia yang Disempurnakan (EYD).
Pastikan tulisan ringkas, padat informasi, to-the-point, dan tidak berbelit-belit. Hindari penggunaan kata-kata yang terlalu berbunga atau dramatis secara berlebihan.
Kembalikan HANYA format JSON { "title": "Judul Berita", "summary": "Ringkasan 1-2 kalimat", "content": "Konten berita lengkap dalam format Markdown" }.`;
  const text = await generateWithGemini(
    `Buatkan warta sekolah mengenai topik: ${topic}`,
    systemInstruction,
    'application/json',
  );
  try {
    const parsed = JSON.parse(text);
    if (!parsed.title || !parsed.content) throw new Error('Format tidak valid');
    return parsed;
  } catch {
    return {
      title: 'Gagal Menghasilkan Berita',
      summary: 'AI gagal merespons dengan format yang benar.',
      content:
        'Maaf, terjadi kesalahan teknis saat menghasilkan konten. Silakan coba gunakan kata kunci yang lebih detail.',
    };
  }
};

export const getWhatsAppAutoReply = async (userMessage: string): Promise<string> => {
  const systemInstruction = `Anda adalah Asisten Virtual WhatsApp resmi untuk MAN 1 Hulu Sungai Tengah (HST). Jawab pertanyaan terkait layanan sekolah secara ramah, ringkas (maks 3-4 kalimat).`;
  return await generateWithGemini(userMessage, systemInstruction);
};

export const refineJournalText = async (
  subject: string,
  materi: string,
  catatan: string,
): Promise<string> => {
  const prompt = `Mata Pelajaran: ${subject}\nMateri Kasar: ${materi}\nCatatan Kasar: ${catatan}\n\nTolong bersihkan, perbaiki tata bahasanya, dan buat lebih mendalam dan profesional dalam 2-3 kalimat formal yang padat untuk jurnal KBM sekolah (tanpa mengada-ada atau menambah-nambahkan informasi fiktif).`;
  const systemInstruction = `Anda adalah asisten kurikulum akademik madrasah profesional di MAN 1 HST. Tugas Anda adalah membantu guru merapikan ringkasan materi dan catatan pembelajaran kelas mereka agar memiliki diksi formal, ringkas, dan presisi yang sesuai dengan standar administrasi Kementerian Agama (Kemenag).`;
  return await generateWithGemini(prompt, systemInstruction);
};
