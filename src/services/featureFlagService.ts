export const FeatureFlagService = {
  enabled: (featureKey: string): boolean => {
    return true;
  },
  isEnabled: (featureKey: string): boolean => {
    return true;
  },
  getFlags: () => ({}),
};

export const featureFlagService = FeatureFlagService;
