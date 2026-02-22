/**
 * Public barrel for the `playwright-praman/ai` sub-path export.
 *
 * @remarks
 * Exports types, registries, and (in future waves) LLM service factories
 * and agentic handlers. Only symbols that are fully implemented are
 * exported here — stub-only modules are added by later implementation waves.
 *
 * @module ai
 */

// ── Types ──────────────────────────────────────────────────────────────────
export type {
  AiResponse,
  AiResponseMetadata,
  AiResponseError,
  AiProviderConfig,
  AiProviderName,
  CapabilityEntry,
  CapabilityStats,
  CapabilitiesJSON,
  RecipeEntry,
  RecipePriority,
  AgenticCheckpoint,
  DiscoveredControl,
  PageContext,
  AiGeneratedTest,
} from './types.js';

// ── Registries ─────────────────────────────────────────────────────────────
export { CapabilityRegistry } from './capability-registry.js';
export { capabilities } from './capabilities.js';
export { RecipeRegistry } from './recipe-registry.js';

// ── LLM Service ────────────────────────────────────────────────────────────
export type { LlmService } from './llm-service.js';
export { createLlmService } from './llm-service.js';

// ── Agentic Handler ────────────────────────────────────────────────────────
export { AgenticHandler } from './agentic-handler.js';

// ── Page Discovery and Context ─────────────────────────────────────────────
export { discoverPage } from './bulk-discovery.js';
export type { DiscoverPageOptions } from './bulk-discovery.js';
export { buildPageContext } from './context-builder.js';
