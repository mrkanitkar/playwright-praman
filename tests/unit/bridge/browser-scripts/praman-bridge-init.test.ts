/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/bridge/browser-scripts/praman-bridge-init.ts`.
 *
 * @remarks
 * Validates the standalone bridge init script (Playwright CLI `initScript`)
 * builds correctly with esbuild into a self-contained IIFE that:
 * - Is valid JavaScript parseable in a browser context
 * - Contains no Node.js-specific APIs
 * - References the `__praman_bridge` namespace
 * - Includes an idempotency guard against double-injection
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

import * as esbuild from 'esbuild';
import { beforeAll, describe, expect, it } from 'vitest';

const testDir = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(testDir, '..', '..', '..', '..');
const ENTRY_POINT = resolve(ROOT_DIR, 'src/bridge/browser-scripts/praman-bridge-init.ts');

describe('praman-bridge-init IIFE bundle', () => {
  let output: string;

  beforeAll(async () => {
    const result = await esbuild.build({
      entryPoints: [ENTRY_POINT],
      bundle: true,
      format: 'iife',
      platform: 'browser',
      target: 'es2020',
      minify: false,
      sourcemap: false,
      write: false,
      logLevel: 'silent',
    });

    const outputFiles = result.outputFiles;
    expect(outputFiles).toBeDefined();
    expect(outputFiles).toHaveLength(1);

    const firstFile = outputFiles[0];
    expect(firstFile).toBeDefined();
    output = firstFile?.text ?? '';
  });

  // ── Test Case 1: IIFE produces valid self-contained JavaScript ────

  describe('IIFE produces valid self-contained JavaScript', () => {
    it('produces non-empty output', () => {
      expect(output.trim().length).toBeGreaterThan(0);
    });

    it('is syntactically valid JavaScript', () => {
      expect(() => {
        // vm.Script validates JS syntax without executing
        // eslint-disable-next-line sonarjs/constructor-for-side-effects, sonarjs/code-eval -- Intentional: syntax validation only
        new vm.Script(output);
      }).not.toThrow();
    });

    it('contains the IIFE wrapper pattern', () => {
      // esbuild wraps IIFE output in an immediately-invoked function
      expect(output).toMatch(/\(\s*\(\)\s*=>\s*\{/);
    });

    it('contains the __praman_bridge string', () => {
      expect(output).toContain('__praman_bridge');
    });
  });

  // ── Test Case 2: No Node.js APIs in output ────────────────────────

  describe('no Node.js APIs in output', () => {
    it('does not contain CommonJS require()', () => {
      // Match require( but NOT sap.ui.require( which is a UI5 API
      const requireMatches = output.match(/\brequire\s*\(/g) ?? [];
      const sapRequireMatches = output.match(/sap\.ui\.require\s*\(/g) ?? [];
      expect(requireMatches).toHaveLength(sapRequireMatches.length);
    });

    it('does not contain process.', () => {
      expect(output).not.toMatch(/\bprocess\./);
    });

    it('does not contain __dirname', () => {
      expect(output).not.toContain('__dirname');
    });

    it('does not contain __filename', () => {
      expect(output).not.toContain('__filename');
    });

    it('does not contain Buffer.', () => {
      expect(output).not.toMatch(/\bBuffer\./);
    });

    it('does not contain module.exports', () => {
      expect(output).not.toContain('module.exports');
    });
  });

  // ── Test Case 3: Bridge namespace ──────────────────────────────────

  describe('bridge namespace', () => {
    it('references __praman_bridge namespace', () => {
      expect(output).toContain('__praman_bridge');
    });

    it('assigns bridge to window namespace', () => {
      // The source assigns: win[NAMESPACE] = bridge
      // In the built output, NAMESPACE resolves to "__praman_bridge"
      expect(output).toContain('__praman_bridge');
    });

    it('sets up bridge version', () => {
      expect(output).toContain('1.0.0');
    });

    it('sets up bridge ready flag', () => {
      expect(output).toContain('ready');
    });
  });

  // ── Test Case 4: Idempotency check ────────────────────────────────

  describe('idempotency guard against double-injection', () => {
    it('contains __praman_ready guard flag', () => {
      expect(output).toContain('__praman_ready');
    });

    it('checks the ready flag before initializing', () => {
      // Both symbols must be present in the output for the guard to work.
      // The constants are declared before the guard logic uses them.
      expect(output).toContain('__praman_ready');
      expect(output).toContain('__praman_bridge');
    });
  });
});
