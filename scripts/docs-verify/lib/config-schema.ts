/**
 * Config schema extractor — imports the built PramanConfigSchema from dist/
 * and extracts all default values as a flat dotted-key map.
 *
 * Requires `npm run build` to have been run first.
 */

import type { ConfigDefault } from './types.js';

/**
 * Flatten a nested object into dotted-key entries.
 * e.g. { telemetry: { openTelemetry: false } } → Map{ 'telemetry.openTelemetry' → ... }
 */
function flattenDefaults(obj: Record<string, unknown>, prefix = ''): Map<string, ConfigDefault> {
  const result = new Map<string, ConfigDefault>();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recurse into nested objects
      const nested = flattenDefaults(value as Record<string, unknown>, fullKey);
      for (const [nestedKey, nestedVal] of nested) {
        result.set(nestedKey, nestedVal);
      }
    } else {
      result.set(fullKey, {
        type: Array.isArray(value) ? 'array' : typeof value,
        defaultValue: value,
      });
    }
  }

  return result;
}

/** Cached result */
let cached: Map<string, ConfigDefault> | undefined;

/**
 * Extract config defaults by importing PramanConfigSchema from built dist
 * and calling .parse({}) to get the full defaults object.
 */
export async function extractConfigDefaults(): Promise<Map<string, ConfigDefault>> {
  if (cached) return cached;

  try {
    // Dynamic import from dist — requires build to have run
    const schemaModule = (await import('../../../dist/index.js')) as Record<string, unknown>;

    const PramanConfigSchema = schemaModule.PramanConfigSchema as {
      parse(input: Record<string, unknown>): Record<string, unknown>;
    };

    if (!PramanConfigSchema || typeof PramanConfigSchema.parse !== 'function') {
      throw new Error('PramanConfigSchema not found in dist/index.js — is it exported?');
    }

    const defaults = PramanConfigSchema.parse({});
    cached = flattenDefaults(defaults as Record<string, unknown>);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[config-schema] Could not extract defaults: ${message}. Run 'npm run build' first.`,
    );
    cached = new Map();
  }

  return cached;
}

/** Reset cache (for testing) */
export function resetConfigDefaultsCache(): void {
  cached = undefined;
}

/** Exported for unit testing only */
export { flattenDefaults as _flattenDefaults };
