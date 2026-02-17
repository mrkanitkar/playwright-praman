/**
 * @module auth
 */
// Barrel file — re-exports for auth module

export type { AuthStrategy, AuthStrategyName, SAPAuthConfig, SessionInfo } from './auth-types.js';

export {
  isAuthenticated,
  isLoginPageVisible,
  isShellVisible,
  isUI5Loaded,
  isUserMenuVisible,
} from './auth-checks.js';
