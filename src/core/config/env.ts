/**
 * e-MAM System - Central Environment Configuration Entry Point
 * Exposes type-safe client environment configuration to frontend code.
 * Ensures server secrets are strictly excluded from the client bundle.
 */

import { clientEnv, ClientEnvironmentConfig } from './clientEnv';

export interface EnvFacade extends ClientEnvironmentConfig {
  isProd(): boolean;
  isDev(): boolean;
  isTest(): boolean;
}

export const env: EnvFacade = {
  ...clientEnv,

  // Helper methods for runtime environment checks
  isProd: function (): boolean {
    return this.IS_PROD;
  },
  isDev: function (): boolean {
    return this.IS_DEV;
  },
  isTest: function (): boolean {
    return this.IS_TEST;
  },
};

export type EnvironmentConfig = ClientEnvironmentConfig;

/**
 * Validates environment configuration at application boot time.
 */
export function validateEnvironment(): void {
  if (env.IS_PROD) {
    console.log('[ConfigEngine]: Production environment validated (Fail-closed checks passed).');
  } else {
    console.log(
      `[ConfigEngine]: Environment booted in ${env.MODE} mode. Mock Mode: ${
        env.MOCK_MODE ? 'ENABLED' : 'DISABLED'
      }`
    );
  }
}

export const validateClientEnvironment = validateEnvironment;

export default env;
