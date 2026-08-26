export const safeConfirm = async (message: string): Promise<boolean> => {
  if (typeof window !== 'undefined') {
    return window.confirm(message);
  }
  return true;
};
