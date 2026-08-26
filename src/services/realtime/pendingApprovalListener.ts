export const subscribePendingApprovalsCount = (callback: (count: number) => void) => {
  callback(0);
  return () => {};
};
