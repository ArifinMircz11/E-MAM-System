export const submitProfileCompletionRequest = async (data: any) => {
  return { success: true, data };
};

export const subscribePendingOnboardingRequests = (
  tenantId: string = 'tenant-demo',
  callback: (requests: any[]) => void
) => {
  // Call callback with empty array to satisfy hook, and return unsubscribe function
  callback([]);
  return () => {};
};

export const resolveOnboardingRequest = async (
  requestId: string,
  action: 'approve' | 'reject',
  remarks?: string
): Promise<boolean> => {
  return true;
};

export const onboardingService = {
  submitOnboarding: async (data: any) => ({ success: true, data }),
  getPendingOnboardings: async () => [],
  submitProfileCompletionRequest,
  subscribePendingOnboardingRequests,
  resolveOnboardingRequest,
};
