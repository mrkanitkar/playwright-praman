/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/constants/object-categories.ts` — UI5 object category
 * detection for AI context classification.
 *
 * @remarks
 * Verifies that `detectObjectCategory` correctly classifies UI5 type names
 * into semantic categories (model, router, controller, etc.) and falls back
 * to `'unknown'` for unrecognized patterns.
 *
 * @module constants
 */
import { describe, expect, it } from 'vitest';

import type { UI5ObjectCategory } from '#core/constants/object-categories.js';
import { detectObjectCategory } from '#core/constants/object-categories.js';

describe('detectObjectCategory', () => {
  describe('model detection', () => {
    it('detects sap.ui.model.json.JSONModel as model', () => {
      expect(detectObjectCategory('sap.ui.model.json.JSONModel')).toBe('model');
    });

    it('detects sap.ui.model.odata.v4.ODataModel as model', () => {
      expect(detectObjectCategory('sap.ui.model.odata.v4.ODataModel')).toBe('model');
    });

    it('detects sap.ui.model.resource.ResourceModel as model', () => {
      expect(detectObjectCategory('sap.ui.model.resource.ResourceModel')).toBe('model');
    });
  });

  describe('router detection', () => {
    it('detects sap.ui.core.routing.Router as router', () => {
      expect(detectObjectCategory('sap.ui.core.routing.Router')).toBe('router');
    });

    it('detects sap.m.routing.Router as router', () => {
      expect(detectObjectCategory('sap.m.routing.Router')).toBe('router');
    });
  });

  describe('controller detection', () => {
    it('detects types ending with Controller', () => {
      expect(detectObjectCategory('my.app.controller.MainController')).toBe('controller');
    });

    it('detects sap.ui.core.mvc.Controller as controller', () => {
      expect(detectObjectCategory('sap.ui.core.mvc.Controller')).toBe('controller');
    });
  });

  describe('binding detection', () => {
    it('detects sap.ui.model.Binding as binding', () => {
      expect(detectObjectCategory('sap.ui.model.Binding')).toBe('binding');
    });

    it('detects sap.ui.model.odata.v4.ODataListBinding as binding', () => {
      expect(detectObjectCategory('sap.ui.model.odata.v4.ODataListBinding')).toBe('binding');
    });

    it('detects types ending with Binding as binding', () => {
      expect(detectObjectCategory('sap.ui.model.PropertyBinding')).toBe('binding');
    });
  });

  describe('context detection', () => {
    it('detects sap.ui.model.Context as context', () => {
      expect(detectObjectCategory('sap.ui.model.Context')).toBe('context');
    });

    it('detects sap.ui.model.odata.v4.Context as context', () => {
      expect(detectObjectCategory('sap.ui.model.odata.v4.Context')).toBe('context');
    });
  });

  describe('event detection', () => {
    it('detects sap.ui.base.Event as event', () => {
      expect(detectObjectCategory('sap.ui.base.Event')).toBe('event');
    });
  });

  describe('formatter detection', () => {
    it('detects types ending with Formatter', () => {
      expect(detectObjectCategory('my.app.model.DateFormatter')).toBe('formatter');
    });

    it('detects sap.ui.core.format.DateFormat as formatter', () => {
      expect(detectObjectCategory('my.app.util.CurrencyFormatter')).toBe('formatter');
    });
  });

  describe('validator detection', () => {
    it('detects types ending with Validator', () => {
      expect(detectObjectCategory('my.app.util.EmailValidator')).toBe('validator');
    });
  });

  describe('type detection', () => {
    it('detects sap.ui.model.type.String as type', () => {
      expect(detectObjectCategory('sap.ui.model.type.String')).toBe('type');
    });

    it('detects sap.ui.model.type.Date as type', () => {
      expect(detectObjectCategory('sap.ui.model.type.Date')).toBe('type');
    });
  });

  describe('component detection', () => {
    it('detects sap.ui.core.Component as component', () => {
      expect(detectObjectCategory('sap.ui.core.Component')).toBe('component');
    });

    it('detects sap.ui.core.UIComponent as component', () => {
      expect(detectObjectCategory('sap.ui.core.UIComponent')).toBe('component');
    });

    it('detects types ending with UIComponent', () => {
      expect(detectObjectCategory('my.app.Component')).toBe('component');
    });
  });

  describe('manifest detection', () => {
    it('detects types containing Manifest', () => {
      expect(detectObjectCategory('sap.ui.core.Manifest')).toBe('manifest');
    });
  });

  describe('i18n detection', () => {
    it('detects ResourceBundle as i18n', () => {
      expect(detectObjectCategory('sap.base.i18n.ResourceBundle')).toBe('i18n');
    });

    it('detects types containing i18n as i18n', () => {
      expect(detectObjectCategory('my.app.i18n.Helper')).toBe('i18n');
    });
  });

  describe('unknown fallback', () => {
    it('returns unknown for an unrecognized type', () => {
      expect(detectObjectCategory('sap.m.ObjectStatus')).toBe('unknown');
    });

    it('returns unknown for an empty string', () => {
      expect(detectObjectCategory('')).toBe('unknown');
    });

    it('returns unknown for a generic custom class', () => {
      expect(detectObjectCategory('com.example.utils.Helper')).toBe('unknown');
    });
  });

  describe('type narrowing', () => {
    it('return type is assignable to UI5ObjectCategory', () => {
      const result: UI5ObjectCategory = detectObjectCategory('sap.ui.model.json.JSONModel');
      expect(result).toBe('model');
    });
  });

  describe('priority ordering (binding vs model)', () => {
    it('detects sap.ui.model.ListBinding as binding (Binding suffix takes precedence)', () => {
      expect(detectObjectCategory('sap.ui.model.ListBinding')).toBe('binding');
    });

    it('detects sap.ui.model.type.Integer as type (.model.type. takes precedence over .model.)', () => {
      expect(detectObjectCategory('sap.ui.model.type.Integer')).toBe('type');
    });
  });
});
