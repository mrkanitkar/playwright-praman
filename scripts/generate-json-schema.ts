/**
 * Generates JSON Schema from the Praman Zod config schema.
 *
 * @remarks
 * Uses Zod v4's native `toJSONSchema` to convert `PramanConfigSchema` into a
 * JSON Schema Draft 7 document. Output: `dist/praman-config.schema.json`.
 *
 * IDEs (VS Code, JetBrains) can use this schema for autocomplete
 * and validation in `praman.config.json` files.
 *
 * Run: `npx tsx scripts/generate-json-schema.ts`
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toJSONSchema } from 'zod/v4';

import { PramanConfigSchema } from '../src/core/config/schema.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '..');
const outputDir = join(projectRoot, 'dist');
const outputFile = join(outputDir, 'praman-config.schema.json');

// Ensure dist/ exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

console.log('Generating JSON Schema from PramanConfigSchema...');

const jsonSchema = toJSONSchema(PramanConfigSchema, { target: 'draft-07' });
const content = JSON.stringify(jsonSchema, null, 2);

writeFileSync(outputFile, content, 'utf8');

// Count definitions ($defs in draft-07 output from Zod v4)
const schemaObj = jsonSchema as { $defs?: Record<string, unknown> };
const defCount = schemaObj.$defs !== undefined ? Object.keys(schemaObj.$defs).length : 0;

console.log(`JSON Schema generated: ${outputFile}`);
console.log(`  Definitions: ${defCount}`);
console.log(`  Size: ${content.length} bytes`);
