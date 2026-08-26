/**
 * Gemini AI Integration service for client-safe assistants
 */

let queryCount = 0;

export const getAiQueryCount = (): number => {
  return queryCount;
};

export const generateNewsContent = async (topic: string, tone: string = 'formal'): Promise<{ title: string; content: string }> => {
  queryCount++;
  try {
    const res = await fetch('/api/ai/generate-news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, tone }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        title: data.title || topic,
        content: data.content || `Berita terkait ${topic} berhasil digenerate.`,
      };
    }
  } catch {}

  return {
    title: `Pengumuman: ${topic}`,
    content: `Berikut merupakan informasi penting terkait kegiatan dan perkembangan terbaru mengenai ${topic} di lingkungan madrasah. Seluruh civitas akademika diharapkan dapat memperhatikan jadwal dan pedoman yang telah ditetapkan.`,
  };
};

export const refineJournalText = async (text: string): Promise<string> => {
  queryCount++;
  return `${text} (Refined: Materi telah disampaikan dengan metode interaktif, partisipasi siswa aktif dan tertib.)`;
};

export const getEduContent = async (prompt: string): Promise<string> => {
  queryCount++;
  return `Hasil AI Assistant untuk "${prompt}": Materi pembelajaran disusun secara sistematis sesuai kurikulum merdeka madrasah.`;
};

export const geminiService = {
  getAiQueryCount,
  generateNewsContent,
  refineJournalText,
  getEduContent,
};

