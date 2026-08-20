import { auditLog } from '@/services/auditLogService';

/**
 * Enhanced fetch with exponential backoff and audit logging for 429 errors.
 * e-Mam System v7.2 - Network Stability Protocol
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  delay = 1000,
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    if (response.status === 429 && retries > 0) {
      // Log the rate limit hit for mirroring/monitoring
      try {
        await auditLog({
          action: 'RATE_LIMIT_429_HIT',
          category: 'SYSTEM',
          details: `429 Too Many Requests for ${url}. Retry attempt: ${4 - retries}`,
        });
      } catch (logErr) {
        console.warn('Failed to log internal rate limit to Firestore:', logErr);
      }

      console.warn(`Rate limit hit (429). Retrying in ${delay}ms...`, url);
      await new Promise((res) => setTimeout(res, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }

    return response;
  } catch (error: any) {
    if (retries > 0) {
      await new Promise((res) => setTimeout(res, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}
