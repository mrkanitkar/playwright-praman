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
  checkBannedPatterns,
  checkIdsPattern,
  checkImports,
  checkTestSteps,
  checkTsDocHeader,
} from '../../../src/cli/verify-spec-command.js';

const VALID_SPEC = `/**
 * @status gold-standard
 * @version 1.0.0
 */
import { test, expect } from 'playwright-praman';

const IDS = {
  saveButton: 'app--saveBtn',
  nameInput: 'app--nameInput',
};

test.describe('My App', () => {
  test('should work', async ({ ui5 }) => {
    await test.step('Fill name', async () => {
      const input = await ui5.control({ id: IDS.nameInput });
      await input.setValue('Test');
    });
  });
});
`;

describe('verify-spec-command', () => {
  describe('checkImports', () => {
    it('passes for playwright-praman import', () => {
      const result = checkImports(VALID_SPEC);
      expect(result.pass).toBe(true);
    });

    it('fails for @playwright/test import', () => {
      const content = "import { test } from '@playwright/test';";
      const result = checkImports(content);
      expect(result.pass).toBe(false);
    });
  });

  describe('checkIdsPattern', () => {
    it('passes when IDS constant present', () => {
      const result = checkIdsPattern(VALID_SPEC);
      expect(result.pass).toBe(true);
    });

    it('fails when IDS constant missing', () => {
      const content = "const selectors = { btn: 'id' };";
      const result = checkIdsPattern(content);
      expect(result.pass).toBe(false);
    });
  });

  describe('checkTestSteps', () => {
    it('passes when test.step() used', () => {
      const result = checkTestSteps(VALID_SPEC);
      expect(result.pass).toBe(true);
    });

    it('fails when test.step() missing', () => {
      const content = "test('no steps', async () => { await click(); });";
      const result = checkTestSteps(content);
      expect(result.pass).toBe(false);
    });
  });

  describe('checkBannedPatterns', () => {
    it('passes clean spec', () => {
      const result = checkBannedPatterns(VALID_SPEC);
      expect(result.pass).toBe(true);
    });

    it('fails on page.waitForTimeout', () => {
      const content = 'await page.waitForTimeout(5000);';
      const result = checkBannedPatterns(content);
      expect(result.pass).toBe(false);
      expect(result.message).toContain('waitForTimeout');
    });

    it('fails on page.click with raw UI5 ID', () => {
      const content = "await page.click('#__button0');";
      const result = checkBannedPatterns(content);
      expect(result.pass).toBe(false);
      expect(result.message).toContain('raw UI5 IDs');
    });

    it('detects multiple banned patterns', () => {
      const content = "await page.waitForTimeout(1000);\nawait page.click('#__input0');";
      const result = checkBannedPatterns(content);
      expect(result.pass).toBe(false);
      expect(result.message).toContain('waitForTimeout');
      expect(result.message).toContain('raw UI5 IDs');
    });
  });

  describe('checkTsDocHeader', () => {
    it('passes with @status tag', () => {
      const result = checkTsDocHeader(VALID_SPEC);
      expect(result.pass).toBe(true);
    });

    it('passes with @version tag', () => {
      const content = '/**\n * @version 1.0.0\n */\n';
      const result = checkTsDocHeader(content);
      expect(result.pass).toBe(true);
    });

    it('fails without TSDoc header', () => {
      const content = "import { test } from 'playwright-praman';";
      const result = checkTsDocHeader(content);
      expect(result.pass).toBe(false);
    });
  });
});
