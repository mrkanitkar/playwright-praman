/**
 * UI5 API Fetcher — fetches control metadata from ui5.sap.com with local file cache.
 *
 * Uses native fetch() (Node 22+) with 10s timeout.
 * Gracefully returns undefined on network errors.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type {
  UI5ControlMetadata,
  UI5Property,
  UI5Method,
  UI5Event,
  UI5Aggregation,
} from './types.js';

const CACHE_DIR = resolve('.docs-verify-cache/ui5-api');
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const UI5_BASE_URL = 'https://ui5.sap.com/1.120.0/test-resources';
const FETCH_TIMEOUT_MS = 10_000;

/**
 * Known SAP library prefixes — map from library name to URL path segment.
 */
const KNOWN_LIBRARIES: Record<string, string> = {
  'sap.m': 'sap/m',
  'sap.f': 'sap/f',
  'sap.ui.core': 'sap/ui/core',
  'sap.ui.comp': 'sap/ui/comp',
  'sap.ui.mdc': 'sap/ui/mdc',
  'sap.ui.table': 'sap/ui/table',
  'sap.ui.layout': 'sap/ui/layout',
  'sap.ui.unified': 'sap/ui/unified',
  'sap.uxap': 'sap/uxap',
  'sap.tnt': 'sap/tnt',
  'sap.suite.ui.commons': 'sap/suite/ui/commons',
};

/**
 * Derive the library name from a fully-qualified control type.
 * e.g. 'sap.m.Button' → 'sap.m', 'sap.ui.comp.smarttable.SmartTable' → 'sap.ui.comp'
 */
export function deriveLibraryName(controlType: string): string | undefined {
  // Try longest match first (e.g. sap.suite.ui.commons before sap.ui)
  const sorted = Object.keys(KNOWN_LIBRARIES).sort((a, b) => b.length - a.length);
  for (const lib of sorted) {
    if (controlType.startsWith(lib + '.')) {
      return lib;
    }
  }
  return undefined;
}

/**
 * Build the API JSON URL for a given library.
 */
export function buildApiUrl(libraryName: string): string {
  const pathSegment = KNOWN_LIBRARIES[libraryName];
  if (!pathSegment) {
    throw new Error(`Unknown library: ${libraryName}`);
  }
  return `${UI5_BASE_URL}/${pathSegment}/designtime/api.json`;
}

interface CachedEntry {
  _fetchedAt: string;
  data: UI5ControlMetadata | null;
}

/**
 * Read from file cache. Returns undefined if not cached or expired.
 */
function readCache(controlType: string): UI5ControlMetadata | null | undefined {
  const cacheFile = join(CACHE_DIR, `${controlType}.json`);
  if (!existsSync(cacheFile)) return undefined;

  try {
    const raw = readFileSync(cacheFile, 'utf-8');
    const entry: CachedEntry = JSON.parse(raw);
    const age = Date.now() - new Date(entry._fetchedAt).getTime();
    if (age > CACHE_TTL_MS) return undefined; // expired
    return entry.data ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Write to file cache.
 */
function writeCache(controlType: string, data: UI5ControlMetadata | null): void {
  mkdirSync(CACHE_DIR, { recursive: true });
  const cacheFile = join(CACHE_DIR, `${controlType}.json`);
  const entry: CachedEntry = {
    _fetchedAt: new Date().toISOString(),
    data,
  };
  writeFileSync(cacheFile, JSON.stringify(entry, mapReplacer, 2), 'utf-8');
}

/** JSON replacer that serializes Maps as objects */
function mapReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Map) {
    return Object.fromEntries(value);
  }
  return value;
}

/**
 * Parse the UI5 API JSON response to find metadata for a specific control.
 */
export function parseControlFromApiJson(
  apiJson: Record<string, unknown>,
  controlType: string,
): UI5ControlMetadata | undefined {
  const symbols = apiJson['symbols'] as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(symbols)) return undefined;

  const symbol = symbols.find((s) => s['name'] === controlType);
  if (!symbol) return undefined;

  const metadata: UI5ControlMetadata = {
    name: controlType,
    kind: (symbol['kind'] as UI5ControlMetadata['kind']) ?? 'class',
    properties: new Map<string, UI5Property>(),
    methods: new Map<string, UI5Method>(),
    events: new Map<string, UI5Event>(),
    aggregations: new Map<string, UI5Aggregation>(),
  };

  // Deprecated at control level
  const deprecatedInfo = symbol['deprecated'] as { since?: string; text?: string } | undefined;
  if (deprecatedInfo) {
    metadata.deprecated = {
      since: deprecatedInfo.since ?? 'unknown',
      text: deprecatedInfo.text,
    };
  }

  // Properties from ui5-metadata
  const ui5Meta = symbol['ui5-metadata'] as Record<string, unknown> | undefined;
  if (ui5Meta) {
    const props = ui5Meta['properties'] as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(props)) {
      for (const p of props) {
        const name = p['name'] as string;
        if (name) {
          const prop: UI5Property = {
            name,
            type: (p['type'] as string) ?? 'unknown',
          };
          const dep = p['deprecated'] as { since?: string } | undefined;
          if (dep) prop.deprecated = { since: dep.since ?? 'unknown' };
          metadata.properties.set(name, prop);
        }
      }
    }

    // Aggregations from ui5-metadata
    const aggs = ui5Meta['aggregations'] as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(aggs)) {
      for (const a of aggs) {
        const name = a['name'] as string;
        if (name) {
          const agg: UI5Aggregation = {
            name,
            type: (a['type'] as string) ?? 'unknown',
          };
          const dep = a['deprecated'] as { since?: string } | undefined;
          if (dep) agg.deprecated = { since: dep.since ?? 'unknown' };
          metadata.aggregations.set(name, agg);
        }
      }
    }
  }

  // Methods
  const methods = symbol['methods'] as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(methods)) {
    for (const m of methods) {
      const name = m['name'] as string;
      if (name) {
        // API JSON uses fully qualified method names like "sap.m.Button#getText"
        const shortName = name.includes('#') ? name.split('#')[1]! : name;
        const method: UI5Method = {
          name: shortName,
          returnType: (m['returnValue'] as Record<string, unknown>)?.['type'] as string | undefined,
        };
        const dep = m['deprecated'] as { since?: string } | undefined;
        if (dep) method.deprecated = { since: dep.since ?? 'unknown' };
        metadata.methods.set(shortName, method);
      }
    }
  }

  // Events
  const events = symbol['events'] as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(events)) {
    for (const e of events) {
      const name = e['name'] as string;
      if (name) {
        const event: UI5Event = { name };
        const dep = e['deprecated'] as { since?: string } | undefined;
        if (dep) event.deprecated = { since: dep.since ?? 'unknown' };
        metadata.events.set(name, event);
      }
    }
  }

  return metadata;
}

/**
 * Fetch UI5 control metadata from ui5.sap.com with local file caching.
 *
 * Returns undefined on network errors or unknown controls (doesn't throw).
 */
export async function fetchUi5ControlMetadata(
  controlType: string,
): Promise<UI5ControlMetadata | undefined> {
  // Check cache first
  const cached = readCache(controlType);
  if (cached !== undefined) {
    return cached ?? undefined; // null in cache means "known not to exist"
  }

  const libraryName = deriveLibraryName(controlType);
  if (!libraryName) {
    writeCache(controlType, null);
    return undefined;
  }

  try {
    const url = buildApiUrl(libraryName);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      // Graceful skip on HTTP errors
      writeCache(controlType, null);
      return undefined;
    }

    const apiJson = (await response.json()) as Record<string, unknown>;
    const metadata = parseControlFromApiJson(apiJson, controlType);

    // Cache result (null if not found in the library's API)
    writeCache(controlType, metadata ?? null);
    return metadata;
  } catch {
    // Network error, timeout, etc. — don't cache (might be transient)
    return undefined;
  }
}
