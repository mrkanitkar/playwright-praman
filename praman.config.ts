import type { PramanConfig } from 'playwright-praman';

const config: PramanConfig = {
  logLevel: 'info',
  ui5WaitTimeout: 30_000,
  controlDiscoveryTimeout: 10_000,
  interactionStrategy: 'ui5-native',
};

export default config;
