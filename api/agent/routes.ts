import express from 'express';
import { GoogleGenAI } from '@google/genai';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Terlalu banyak permintaan ke AI Agent, coba lagi nanti.' },
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
  const { message, history, context } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Pesan wajib diisi.' });
  }

  const systemInstruction = `
        Anda adalah "e-Mam System Smart Agent", asisten AI canggih untuk Sistem Informasi Madrasah.
        Anda memiliki akses ke konteks data pengguna untuk memberikan jawaban yang akurat.
        
        KONTEKS DATA: ${JSON.stringify(context || {})}
        
        TUGAS ANDA:
        1. Membantu pengguna mengelola data madrasah.
        2. Memberikan analisis data berdasarkan konteks yang diberikan.
        3. Menjelaskan fitur-fitur e-Mam System dengan mendalam.
        4. Selalu bersikap profesional, sopan, dan menggunakan Bahasa Indonesia yang baik.
        
        Jika pengguna bertanya tentang hal yang tidak ada di konteks, berikan saran umum yang relevan dengan administrasi madrasah.
    `;

  const modelsToTry = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let responseText = '';
  let success = false;
  let lastError = null;

  for (const currentModel of modelsToTry) {
    try {
      console.log(`[AI Agent] Sending request using model: ${currentModel}`);
      const formattedHistory = (history || []).map((h: any) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
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
        console.log(`[AI Agent] Successfully received response from model: ${currentModel}`);
        break;
      }
    } catch (error: any) {
      lastError = error;
      console.warn(`[AI Agent] Error with model ${currentModel}:`, error?.message || error);
    }
  }

  if (success) {
    return res.json({ text: responseText });
  }

  console.error('[AI Agent] All AI models failed/unavailable. Using intelligent context fallback.', lastError);
  
  // Intelligent fallback based on context
  let fallbackReply = `Halo! Saat ini server AI sedang sibuk atau mengalami kendala koneksi. Berikut ringkasan data operasional yang dapat saya bantu berdasarkan konteks Anda:\n\n`;
  if (context && Object.keys(context).length > 0) {
    fallbackReply += `📋 **Konteks Sistem Tersedia:**\n`;
    fallbackReply += `- Role Pengguna: ${context.userRole || context.role || 'Staff / Guru'}\n`;
    if (context.tenantName) fallbackReply += `- Madrasah: ${context.tenantName}\n`;
    if (context.activeTab) fallbackReply += `- Menu Aktif: ${context.activeTab}\n`;
  }
  fallbackReply += `\nSilakan coba lagi beberapa saat lagi atau navigasikan menu melalui sidebar.`;

  return res.json({ text: fallbackReply });
});

export default router;

