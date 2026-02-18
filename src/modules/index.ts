/**
 * Modules barrel -- re-exports for FLP navigation and WorkZone functions.
 *
 * @module modules
 */

// ── Navigation ────────────────────────────────────────────────────────
export {
  getCurrentHash,
  navigateBack,
  navigateForward,
  navigateToApp,
  navigateToHash,
  navigateToHome,
  navigateToIntent,
  navigateToTile,
  searchAndOpenApp,
} from './navigation.js';
export type { NavigationIntent, NavigationOptions, NavigationPage } from './navigation.js';

// ── WorkZone ──────────────────────────────────────────────────────────
export { createWorkZoneManager } from './workzone.js';
export type {
  BTPWorkZoneManager,
  WorkZoneAdapter,
  WorkZoneFrame,
  WorkZoneFrameLocator,
  WorkZonePage,
} from './workzone.js';
