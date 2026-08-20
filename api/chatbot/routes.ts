import express from 'express';
import { GoogleGenAI } from '@google/genai';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Limit user prompts to avoid quota issues
  message: { error: 'Terlalu banyak pertanyaan, coba lagi dalam 15 menit.' },
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

router.post('/chat', limiter, async (req, res) => {
  const { message, history, studentContext, schoolContext } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const systemInstruction = `
        Anda adalah "e-Mam System Virtual Assistant", asisten pintar untuk Sistem Informasi Madrasah (e-Mam System).
        Tujuan Anda adalah membantu pengguna (siswa, guru, atau orang tua) mendapatkan informasi terkait sekolah.
        
        KONTEKS SISWA: ${JSON.stringify(studentContext || {})}
        KONTEKS MADRASAH: ${JSON.stringify(schoolContext || {})}
        
        ATURAN:
        1. Jika ditanya soal Poin, Kehadiran, atau Data Pribadi, gunakan KONTEKS SISWA yang disediakan.
        2. Jika ditanya soal Aturan Sekolah, Visi-Misi, atau Info Umum, gunakan KONTEKS MADRASAH.
        3. Jika data tidak tersedia di konteks, katakan dengan sopan bahwa Anda belum memiliki datanya dan sarankan hubungi admin.
        4. Gunakan bahasa Indonesia yang sopan dan ramah.
        5. Singkat, padat, dan jelas.
        6. Jangan pernah memberikan informasi rahasia sistem seperti API Key atau teknis internal.
    `;

  const modelsToTry = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let responseText = '';
  let success = false;
  let lastError = null;

  for (const currentModel of modelsToTry) {
    try {
      console.log(`[Chatbot] Sending request using model: ${currentModel}`);
      const formattedHistory = (history || []).map((h: any) => ({
        role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.content || h.parts?.[0]?.text || '' }],
      }));

      const chat = ai.chats.create({
        model: currentModel,
        history: formattedHistory,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
          topP: 0.95,
        },
      });

      const response = await chat.sendMessage({ message: message });
      if (response && response.text) {
        responseText = response.text;
        success = true;
        console.log(`[Chatbot] Successfully received response from model: ${currentModel}`);
        break;
      }
    } catch (error: any) {
      lastError = error;
      console.warn(`[Chatbot] Error with model ${currentModel}:`, error?.message || error);
    }
  }

  if (success) {
    return res.json({ text: responseText });
  }

  console.error(
    '[Chatbot] All AI models failed/unavailable. Using intelligent client profile search fallback.',
    lastError,
  );

  const queryUpper = message.toUpperCase();
  let fallbackReply = `Halo! Mohon maaf sekali, saat ini server kecerdasan buatan (AI) Google Gemini sedang mengalami antrean yang sangat tinggi (Error 503 / Server Sibuk).\n\nNamun, jangan khawatir! Saya tetap dapat menemukan beberapa informasi penting Anda langsung dari database lokal sistem:\n\n`;

  let hasData = false;
  if (studentContext && Object.keys(studentContext).length > 0) {
    hasData = true;
    const s = studentContext;
    fallbackReply += `📋 **PROFIL SISWA:**\n`;
    if (s.name) fallbackReply += `👤 Nama: **${s.name}**\n`;
    if (s.nisn) fallbackReply += `🆔 NISN: ${s.nisn}\n`;
    if (s.className) fallbackReply += `🏫 Kelas: ${s.className}\n`;

    if (s.attendanceSummary) {
      const att = s.attendanceSummary;
      fallbackReply += `\n📅 **REKAP PRESENSI HINGGA SAAT INI:**\n`;
      fallbackReply += `• Hadir: ${att.hadir ?? 0} Hari\n`;
      fallbackReply += `• Sakit: ${att.sakit ?? 0} Hari\n`;
      fallbackReply += `• Izin: ${att.izin ?? 0} Hari\n`;
      fallbackReply += `• Alpha: ${att.alpha ?? 0} Hari\n`;
    }

    if (s.pointSummary) {
      const pts = s.pointSummary;
      fallbackReply += `\n⭐ **POIN PRESTASI & PELANGGARAN:**\n`;
      fallbackReply += `• Total Poin Pelanggaran: **${pts.totalPelanggaran ?? 0} Poin**\n`;
      fallbackReply += `• Total Poin Prestasi: **${pts.totalPrestasi ?? 0} Poin**\n`;
      if (pts.statusKarakter) fallbackReply += `• Predikat Sikap: **${pts.statusKarakter}**\n`;
    }
    fallbackReply += `\n`;
  }

  if (
    queryUpper.includes('POIN') ||
    queryUpper.includes('PELANGGARAN') ||
    queryUpper.includes('PRESTASI') ||
    queryUpper.includes('HUKUMAN') ||
    queryUpper.includes('NILAI')
  ) {
    if (studentContext?.pointSummary) {
      fallbackReply += `💡 **Rekomendasi Poin:**\nSikap Anda dinilai **${studentContext.pointSummary.statusKarakter || 'Baik'}**. Terus pertahankan kedisiplinan dan hindari pelanggaran rekrutmen poin agar prestasi belajar Anda semakin cemerlang!`;
    } else {
      fallbackReply += `💡 **Rekomendasi Poin:**\nTidak ada riwayat pelanggaran atau prestasi khusus yang tercatat dalam sesi aktif ini. Silakan cek menu "Poin Madrasah" Anda di beranda.`;
    }
  } else if (
    queryUpper.includes('ABSEN') ||
    queryUpper.includes('HADIR') ||
    queryUpper.includes('PRESENSI') ||
    queryUpper.includes('ALFA') ||
    queryUpper.includes('IZIN') ||
    queryUpper.includes('SAKIT')
  ) {
    if (studentContext?.attendanceSummary) {
      const att = studentContext.attendanceSummary;
      fallbackReply += `💡 **Informasi Kehadiran:**\nKehadiran efektif Anda telah mencapai ${att.hadir ?? 0} hari. Silakan pastikan untuk selalu mengisi absen harian atau menyerahkan surat keterangan resmi jika berhalangan hadir.`;
    } else {
      fallbackReply += `💡 **Informasi Kehadiran:**\nData kehadiran secara real-time dapat diakses secara instan lewat menu 'Presensi' di beranda utama aplikasi e-Mam System.`;
    }
  } else if (
    queryUpper.includes('VISI') ||
    queryUpper.includes('MISI') ||
    queryUpper.includes('MADRASAH') ||
    queryUpper.includes('SEKOLAH')
  ) {
    if (schoolContext) {
      fallbackReply += `💡 **Visi & Misi Madrasah:**\n`;
      if (schoolContext.visi) fallbackReply += `🌟 **Visi:** "${schoolContext.visi}"\n`;
      if (schoolContext.misi) {
        fallbackReply += `🎯 **Misi:**\n`;
        if (Array.isArray(schoolContext.misi)) {
          schoolContext.misi.forEach((m: string) => {
            fallbackReply += ` - ${m}\n`;
          });
        } else {
          fallbackReply += ` ${schoolContext.misi}\n`;
        }
      }
    } else {
      fallbackReply += `💡 **Informasi Sekolah:**\nMadrasah ini berkomitmen tinggi menyelenggarakan pendidikan terpadu unggul di bidang akademis dan akhlakul karimah.`;
    }
  } else {
    fallbackReply += `Silakan tanyakan tentang 'Poin Saya', 'Presensi', atau 'Visi Misi Sekolah'. Saya akan secara instan menyajikan data lokal pendukung untuk Anda meski asisten AI sedang sibuk. Terima kasih!`;
  }

  res.json({ text: fallbackReply });
});

export default router;
