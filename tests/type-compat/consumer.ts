/**
 * Consumer type-compatibility fixture.
 *
 * @remarks
 * This file is NOT part of the test suite and is never executed. It is compiled
 * against the *packed tarball* (`npm pack`) by the `type-compat` CI job, to
 * verify that the shipped `dist/**\/*.d.ts` resolves and typechecks for real
 * consumers across every supported TypeScript version and module-resolution
 * mode.
 *
 * It is excluded from `tsconfig.json` and from ESLint on purpose: it imports
 * `playwright-praman` by package name, which only resolves once the tarball is
 * installed into this directory.
 *
 * Keep this exercising every published sub-path export — that is the point.
 */
import { test, expect } from 'playwright-praman';
import type { PramanConfig } from 'playwright-praman';
import { capabilities } from 'playwright-praman/ai';
import * as intents from 'playwright-praman/intents';
import * as vocabulary from 'playwright-praman/vocabulary';
import * as fe from 'playwright-praman/fe';
import * as reporters from 'playwright-praman/reporters';

const config: Partial<PramanConfig> = { logLevel: 'info' };

test('shipped types resolve for consumers', async ({ page }) => {
  await page.goto('https://example.com');
  expect(config.logLevel).toBe('info');
});

export { capabilities, intents, vocabulary, fe, reporters };
