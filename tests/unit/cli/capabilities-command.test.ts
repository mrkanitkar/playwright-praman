/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

import { describe, expect, it } from 'vitest';

import {
  buildCapabilityManifest,
  formatManifestAgent,
  formatManifestJson,
  formatManifestTable,
} from '../../../src/cli/capabilities-command.js';

describe('capabilities-command', () => {
  describe('buildCapabilityManifest', () => {
    it('returns a manifest with version', () => {
      const manifest = buildCapabilityManifest();
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.cliVersion).toBeTruthy();
    });

    it('has 13 capabilities', () => {
      const manifest = buildCapabilityManifest();
      expect(manifest.capabilities).toHaveLength(13);
    });

    it('all capabilities have required fields', () => {
      const manifest = buildCapabilityManifest();
      for (const cap of manifest.capabilities) {
        expect(cap.id).toBeTruthy();
        expect(cap.name).toBeTruthy();
        expect(cap.category).toBeTruthy();
        expect(cap.mechanism).toBeTruthy();
        expect(typeof cap.parameterized).toBe('boolean');
        expect(cap.agentHint).toBeTruthy();
        expect(cap.usageExample).toBeTruthy();
      }
    });

    it('includes bridge APIs', () => {
      const manifest = buildCapabilityManifest();
      expect(manifest.bridgeAPIs.length).toBeGreaterThan(0);
    });

    it('includes skill file paths', () => {
      const manifest = buildCapabilityManifest();
      expect(manifest.skillFiles.length).toBeGreaterThan(0);
    });
  });

  describe('formatManifestJson', () => {
    it('produces valid JSON', () => {
      const manifest = buildCapabilityManifest();
      const json = formatManifestJson(manifest);
      const parsed = JSON.parse(json) as Record<string, unknown>;
      expect(parsed).toHaveProperty('capabilities');
    });
  });

  describe('formatManifestTable', () => {
    it('produces a non-empty string with header', () => {
      const manifest = buildCapabilityManifest();
      const table = formatManifestTable(manifest);
      expect(table).toBeTruthy();
      expect(table).toContain('ID');
      expect(table).toContain('Category');
    });
  });

  describe('formatManifestAgent', () => {
    it('is more compact than JSON', () => {
      const manifest = buildCapabilityManifest();
      const json = formatManifestJson(manifest);
      const agent = formatManifestAgent(manifest);
      expect(agent.length).toBeLessThan(json.length);
    });

    it('includes capability IDs', () => {
      const manifest = buildCapabilityManifest();
      const agent = formatManifestAgent(manifest);
      expect(agent).toContain('UI5-DISC-001');
      expect(agent).toContain('UI5-STB-001');
    });
  });
});
