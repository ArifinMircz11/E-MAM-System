/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * OpenAI Service Integration
 */

import { getAiQueryCount } from './geminiService';
import { callAiAgent } from './aiAgentService';

export const getOpenAIAdvice = async (prompt: string): Promise<string> => {
  if (typeof window !== 'undefined') {
    if (getAiQueryCount() >= 10) {
      return 'LIMIT_EXCEEDED';
    }
  }

  const response = await callAiAgent(prompt);
  if (response.error) {
    throw new Error(response.error);
  }
  return response.text;
};

/**
 * Intelligent Agentic helper for complex academic tasks
 */
export const getSmartAgentAnalysis = async (task: string, context: any = {}): Promise<string> => {
  const response = await callAiAgent(task, [], context);
  if (response.error) {
    return `Maaf, Agent gagal menganalisis data: ${response.error}`;
  }
  return response.text;
};
