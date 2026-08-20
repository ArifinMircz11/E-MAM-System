export class FeatureFlagService {
  static enabled(flag: string): boolean {
    try {
      const flags = JSON.parse(localStorage.getItem('feature_flags') || '{}');
      return flags[flag] === true;
    } catch (e) {
      return false;
    }
  }
}
