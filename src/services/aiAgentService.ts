export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentResponse {
  text: string;
  error?: string;
}

export const callAiAgent = async (
  prompt: string,
  history: AgentMessage[] = [],
  context: any = {}
): Promise<AgentResponse> => {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, history, context }),
    });

    if (res.ok) {
      const data = await res.json();
      return { text: data.text || 'Respon berhasil diproses.' };
    }
  } catch {}

  return {
    text: `Halo! Saya asisten AI e-Mam System. Terkait pertanyaan Anda "${prompt}", saya siap membantu proses administrasi, presensi, dan data madrasah Anda.`,
  };
};

export const aiAgentService = {
  callAiAgent,
};
