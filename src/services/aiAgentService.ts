/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * AI Agent Service Integration (OpenAI)
 */

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentResponse {
  text: string;
  error?: string;
}

export const callAiAgent = async (
  message: string,
  history: AgentMessage[] = [],
  context: any = {},
): Promise<AgentResponse> => {
  try {
    const response = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history,
        context,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.details || 'Gagal menghubungi AI Agent');
    }

    return { text: data.text };
  } catch (error: any) {
    console.error('AI Agent Service Error:', error);
    return {
      text: '',
      error: error instanceof Error ? error.message : 'Terjadi kesalahan sistem',
    };
  }
};
