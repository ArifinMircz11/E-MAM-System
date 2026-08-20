/**
 * @license
 * e-Mam System - Chat AI Service
 * LAYER: SERVICE LAYER (Architecture Compliant)
 */

import axios from 'axios';

export const ChatAiService = {
  /**
   * Get response from ChatGPT via Backend Proxy
   */
  async getAiResponse(message: string, history: any[] = [], context: any = {}) {
    try {
      const response = await axios.post('/api/agent/chat', {
        message,
        history,
        context,
      });

      return response.data.text;
    } catch (error) {
      console.error('[ChatAiService] Error fetching AI response:', error);
      return 'Maaf, asisten AI sedang sibuk. Silakan coba lagi nanti.';
    }
  },
};
