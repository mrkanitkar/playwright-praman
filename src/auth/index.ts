/**
 * @module auth
 */
// Barrel file — re-exports for auth module

export type {
  AuthPage,
  AuthStrategy,
  AuthStrategyName,
  SAPAuthConfig,
  SessionInfo,
} from './auth-types.js';

export {
  isAuthenticated,
  isLoginPageVisible,
  isShellVisible,
  isUI5Loaded,
  isUserMenuVisible,
} from './auth-checks.js';

export { OnPremAuthStrategy } from './strategies/onprem-strategy.js';

export { CloudSAMLAuthStrategy, isCloudUrl } from './strategies/cloud-saml-strategy.js';

export { Office365AuthStrategy } from './strategies/office365-strategy.js';

export { APIAuthStrategy } from './strategies/api-strategy.js';

export { CertificateAuthStrategy } from './strategies/certificate-strategy.js';

export { MultiTenantAuthStrategy, buildTenantUrl } from './strategies/multi-tenant-strategy.js';

export {
  createAuthStrategy,
  registerAuthStrategy,
  clearCustomStrategies,
  detectSystemType,
} from './auth-factory.js';

export { SAPAuthHandler } from './auth-handler.js';
export type { AuthLogger, SAPAuthHandlerOptions } from './auth-handler.js';
