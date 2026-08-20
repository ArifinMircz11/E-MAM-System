export const placeholderReplacer = (
  template: string,
  variables: Record<string, string>,
): string => {
  let result = template;
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{${key}}`, 'g');
    result = result.replace(regex, variables[key] || '');
  });
  return result;
};

/**
 * Pola 4: Membuat atau mengambil ID Sesi Tamu yang persisten di localStorage
 */
export const getOrCreateGuestSessionId = (): string => {
  if (typeof window === 'undefined') return 'guest_server';
  const key = 'emam_guest_session_id';
  try {
    let sessionId = localStorage.getItem(key);
    if (!sessionId) {
      sessionId =
        'guest_' +
        Math.random().toString(36).substring(2, 10) +
        Date.now().toString(36).substring(4);
      localStorage.setItem(key, sessionId);
    }
    return sessionId;
  } catch (e) {
    return 'guest_temporary_' + Date.now().toString(36);
  }
};
