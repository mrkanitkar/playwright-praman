/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

import { describe, expect, it } from 'vitest';

import { BRIDGE_STATUS_SCRIPT } from '../../../src/scripts/bridge-status.js';
import { DIALOG_CONTROLS_SCRIPT } from '../../../src/scripts/dialog-controls.js';
import { DISCOVER_ALL_SCRIPT } from '../../../src/scripts/discover-all.js';
import { WAIT_FOR_UI5_SCRIPT } from '../../../src/scripts/wait-for-ui5.js';

const ALL_SCRIPTS: Record<string, string> = {
  'discover-all': DISCOVER_ALL_SCRIPT,
  'wait-for-ui5': WAIT_FOR_UI5_SCRIPT,
  'bridge-status': BRIDGE_STATUS_SCRIPT,
  'dialog-controls': DIALOG_CONTROLS_SCRIPT,
};

describe('shell safety', () => {
  for (const [name, script] of Object.entries(ALL_SCRIPTS)) {
    it(`${name} contains no double quotes`, () => {
      expect(script).not.toContain('"');
    });

    it(`${name} contains no backticks`, () => {
      expect(script).not.toContain('`');
    });

    it(`${name} contains no dollar signs`, () => {
      expect(script).not.toContain('$');
    });

    it(`${name} starts with async page =>`, () => {
      expect(script.trimStart()).toMatch(/^async\s+page\s*=>/);
    });
  }
});
