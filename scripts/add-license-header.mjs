/**
 * Prepends the license header to all .ts files in src/ and tests/.
 * Skips files that already have the header.
 * Usage: node scripts/add-license-header.mjs [--dry-run]
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const HEADER = `/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */`;

const MARKER = '@license';
const DIRS = ['src', 'tests'];
const DRY_RUN = process.argv.includes('--dry-run');

async function getFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((e) => e.isFile() && extname(e.name) === '.ts')
    .map((e) => join(e.parentPath ?? e.path, e.name));
}

let updated = 0;
let skipped = 0;

for (const dir of DIRS) {
  const files = await getFiles(dir);
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    if (content.includes(MARKER)) {
      skipped++;
      continue;
    }
    // Shebang lines must stay on line 1
    const hasShebang = content.startsWith('#!');
    let newContent;
    if (hasShebang) {
      const firstNewline = content.indexOf('\n');
      const shebang = content.slice(0, firstNewline + 1);
      const rest = content.slice(firstNewline + 1);
      newContent = shebang + HEADER + '\n\n' + rest;
    } else {
      newContent = HEADER + '\n\n' + content;
    }
    if (DRY_RUN) {
      console.log(`[dry-run] Would update: ${file}`);
    } else {
      await writeFile(file, newContent, 'utf8');
    }
    updated++;
  }
}

console.log(`\nDone. Updated: ${updated}, Skipped (already had header): ${skipped}`);
if (DRY_RUN) {
  console.log('(dry-run mode — no files were changed)');
}
