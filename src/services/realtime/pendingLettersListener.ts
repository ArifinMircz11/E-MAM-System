export const initPendingLettersListener = () => () => {};
export const subscribePendingLetters = (callback: (count: number) => void) => () => {};
export const fetchPendingLettersCount = async (tenantId: string = 'tenant-demo'): Promise<number> => 0;
