export const placeholderReplacer = (text: string, data: Record<string, string>): string => {
  let result = text;
  for (const [key, val] of Object.entries(data)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), val);
  }
  return result;
};

export const getOrCreateGuestSessionId = (): string => {
  let sessionId = localStorage.getItem('guest_session_id');
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    localStorage.setItem('guest_session_id', sessionId);
  }
  return sessionId;
};
