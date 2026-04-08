/**
 * API surface builder — scans entry points with ts-morph and capabilities.yaml
 * to produce the canonical set of exported symbols for docs verification.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { Project } from 'ts-morph';
import { parse as parseYaml } from 'yaml';

import type { ApiSymbol } from './types.js';

/** Entry points to scan — matches package.json "exports" */
const ENTRY_POINTS: Array<{ file: string; exportPath: string }> = [
  { file: 'src/index.ts', exportPath: '.' },
  { file: 'src/ai/index.ts', exportPath: './ai' },
  { file: 'src/intents/index.ts', exportPath: './intents' },
  { file: 'src/vocabulary/index.ts', exportPath: './vocabulary' },
  { file: 'src/fe/index.ts', exportPath: './fe' },
  { file: 'src/reporters/index.ts', exportPath: './reporters' },
];

/** Map ts-morph SyntaxKind names to our ApiSymbol kinds */
function classifyKind(declaration: { getKindName(): string }): ApiSymbol['kind'] {
  const kindName = declaration.getKindName();
  if (kindName.includes('Function')) return 'function';
  if (kindName.includes('Class')) return 'class';
  if (kindName.includes('Interface')) return 'interface';
  if (kindName.includes('TypeAlias')) return 'type';
  if (kindName.includes('Enum')) return 'enum';
  return 'variable';
}

/** Cached result so we only run once */
let cached: Map<string, ApiSymbol> | undefined;

/**
 * Build the API surface by scanning entry points and capabilities.yaml.
 * Result is cached after first call.
 */
export async function buildApiSurface(): Promise<Map<string, ApiSymbol>> {
  if (cached) return cached;

  const surface = new Map<string, ApiSymbol>();
  const rootDir = process.cwd();

  // 1. Scan entry points with ts-morph
  const project = new Project({
    compilerOptions: {
      strict: true,
      target: 99, // ESNext
      module: 99, // ESNext
      moduleResolution: 100, // Bundler
      esModuleInterop: true,
      declaration: false,
      noEmit: true,
      paths: {
        '#core/*': ['./src/core/*'],
        '#bridge/*': ['./src/bridge/*'],
        '#proxy/*': ['./src/proxy/*'],
      },
      baseUrl: rootDir,
    },
    skipAddingFilesFromTsConfig: true,
  });

  for (const entry of ENTRY_POINTS) {
    const filePath = resolve(rootDir, entry.file);
    try {
      const sourceFile = project.addSourceFileAtPath(filePath);
      const exported = sourceFile.getExportedDeclarations();

      for (const [name, declarations] of exported) {
        if (surface.has(name)) continue;
        const decl = declarations[0];
        if (decl) {
          surface.set(name, {
            name,
            kind: classifyKind(decl),
            entryPoint: entry.exportPath,
          });
        }
      }
    } catch {
      // Entry point doesn't exist yet — skip gracefully
    }
  }

  // 2. Load capabilities.yaml and add qualifiedName entries
  try {
    const yamlPath = resolve(rootDir, 'capabilities.yaml');
    const yamlContent = await readFile(yamlPath, 'utf-8');
    const parsed = parseYaml(yamlContent) as {
      capabilities?: Array<{ qualifiedName?: string }>;
    };

    if (parsed.capabilities) {
      for (const cap of parsed.capabilities) {
        if (cap.qualifiedName && !surface.has(cap.qualifiedName)) {
          surface.set(cap.qualifiedName, {
            name: cap.qualifiedName,
            kind: 'function',
            entryPoint: '.',
          });
        }
      }
    }
  } catch {
    // capabilities.yaml missing — not fatal
  }

  cached = surface;
  return surface;
}

/** Reset cache (for testing) */
export function resetApiSurfaceCache(): void {
  cached = undefined;
}
