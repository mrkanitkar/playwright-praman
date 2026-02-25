/**
 * Tests for `src/core/types/branded.ts`.
 *
 * @remarks
 * Verifies branded types prevent accidental mixing at the type level
 * and factory functions produce correctly branded values.
 */
import { describe, expect, expectTypeOf, it } from 'vitest';

import type { AppId, BindingPath, ControlId, CSSSelector, ViewName } from '#core/types/branded.js';
import { appId, bindingPath, controlId, cssSelector, viewName } from '#core/types/branded.js';

describe('Branded types', () => {
  // ── Factory functions ─────────────────────────────────────────────

  describe('controlId()', () => {
    it('creates a ControlId from a string', () => {
      const id = controlId('myButton');
      expect(id).toBe('myButton');
    });

    it('returns a value typed as ControlId', () => {
      const id = controlId('btn1');
      expectTypeOf(id).toExtend<ControlId>();
    });
  });

  describe('viewName()', () => {
    it('creates a ViewName from a string', () => {
      const name = viewName('my.app.View1');
      expect(name).toBe('my.app.View1');
    });

    it('returns a value typed as ViewName', () => {
      const name = viewName('my.app.Main');
      expectTypeOf(name).toExtend<ViewName>();
    });
  });

  describe('bindingPath()', () => {
    it('creates a BindingPath from a string', () => {
      const path = bindingPath('/Products(1)/Name');
      expect(path).toBe('/Products(1)/Name');
    });

    it('returns a value typed as BindingPath', () => {
      const path = bindingPath('/SalesOrders');
      expectTypeOf(path).toExtend<BindingPath>();
    });
  });

  describe('cssSelector()', () => {
    it('creates a CSSSelector from a string', () => {
      const sel = cssSelector('.sapMBtn');
      expect(sel).toBe('.sapMBtn');
    });

    it('returns a value typed as CSSSelector', () => {
      const sel = cssSelector('#myControl');
      expectTypeOf(sel).toExtend<CSSSelector>();
    });
  });

  describe('appId()', () => {
    it('creates an AppId from a string', () => {
      const app = appId('PurchaseOrder-manage');
      expect(app).toBe('PurchaseOrder-manage');
    });

    it('returns a value typed as AppId', () => {
      const app = appId('SalesOrder-display');
      expectTypeOf(app).toExtend<AppId>();
    });
  });

  // ── Type-level discrimination tests ──────────────────────────────

  describe('type discrimination', () => {
    it('ControlId extends string', () => {
      expectTypeOf<ControlId>().toExtend<string>();
    });

    it('ViewName extends string', () => {
      expectTypeOf<ViewName>().toExtend<string>();
    });

    it('BindingPath extends string', () => {
      expectTypeOf<BindingPath>().toExtend<string>();
    });

    it('ControlId is not assignable to ViewName', () => {
      expectTypeOf<ControlId>().not.toExtend<ViewName>();
    });

    it('ViewName is not assignable to BindingPath', () => {
      expectTypeOf<ViewName>().not.toExtend<BindingPath>();
    });

    it('BindingPath is not assignable to CSSSelector', () => {
      expectTypeOf<BindingPath>().not.toExtend<CSSSelector>();
    });

    it('CSSSelector extends string', () => {
      expectTypeOf<CSSSelector>().toExtend<string>();
    });

    it('AppId extends string', () => {
      expectTypeOf<AppId>().toExtend<string>();
    });

    it('CSSSelector is not assignable to AppId', () => {
      expectTypeOf<CSSSelector>().not.toExtend<AppId>();
    });

    it('AppId is not assignable to CSSSelector', () => {
      expectTypeOf<AppId>().not.toExtend<CSSSelector>();
    });

    it('CSSSelector is not assignable to ControlId', () => {
      expectTypeOf<CSSSelector>().not.toExtend<ControlId>();
    });

    it('plain string is not assignable to ControlId', () => {
      expectTypeOf<string>().not.toExtend<ControlId>();
    });
  });

  // ── Runtime behavior ────────────────────────────────────────────

  describe('runtime behavior', () => {
    it('branded values work as plain strings at runtime', () => {
      const id = controlId('myControl');
      expect(id.startsWith('my')).toBe(true);
      expect(id).toHaveLength(9);
      expect(id.toUpperCase()).toBe('MYCONTROL');
    });

    it('branded values are strictly equal to their source string', () => {
      const raw = 'testId';
      const branded = controlId(raw);
      expect(branded).toBe(raw);
    });
  });
});
