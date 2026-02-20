/**
 * Generates a CycloneDX Software Bill of Materials (SBOM) for the package.
 *
 * @remarks
 * Uses `@cyclonedx/cyclonedx-npm` to produce a CycloneDX 1.5 JSON SBOM.
 * Output: `dist/sbom.json` — included in release artifacts.
 *
 * Run: `npx tsx scripts/generate-sbom.ts`
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '..');
const outputDir = join(projectRoot, 'dist');
const outputFile = join(outputDir, 'sbom.json');

// Ensure dist/ exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

console.log('Generating CycloneDX SBOM...');

try {
  execSync(
    `npx @cyclonedx/cyclonedx-npm --output-file "${outputFile}" --spec-version 1.5 --output-reproducible`,
    { cwd: projectRoot, stdio: 'pipe' },
  );
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`SBOM generation failed: ${message}`);
  console.error(
    'Ensure @cyclonedx/cyclonedx-npm is available: npm install -D @cyclonedx/cyclonedx-npm',
  );
  process.exit(1);
}

// Verify output and log summary
if (!existsSync(outputFile)) {
  console.error(`Expected output file not found: ${outputFile}`);
  process.exit(1);
}

const sbomContent = readFileSync(outputFile, 'utf8');
const sbom = JSON.parse(sbomContent) as { specVersion: string; components?: unknown[] };
const componentCount = Array.isArray(sbom.components) ? sbom.components.length : 0;

console.log(`SBOM generated: ${outputFile}`);
console.log(`  Format: CycloneDX ${sbom.specVersion}`);
console.log(`  Components: ${componentCount}`);
