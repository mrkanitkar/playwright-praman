/**
 * Tests for `src/proxy/ui5-object.ts`.
 *
 * @remarks
 * Validates the UI5Object class that represents non-control UI5 objects
 * (models, bindings, router, etc.) stored in the bridge's objectMap.
 */
import { describe, expect, it, vi } from 'vitest';

import { createMockBridgePage } from '../../helpers/mock-page.js';

import { UI5Object } from '#proxy/ui5-object.js';

describe('UI5Object', () => {
  it('creates with uuid and type', () => {
    const page = createMockBridgePage();
    const obj = UI5Object.create({ uuid: 'uuid-1', type: 'sap.ui.model.json.JSONModel', page });
    expect(obj.uuid).toBe('uuid-1');
    expect(obj.type).toBe('sap.ui.model.json.JSONModel');
  });

  it('executeMethod calls page.evaluate with correct script', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValue({ success: true, value: 42, duration: 1 }),
    });
    const obj = UI5Object.create({ uuid: 'uuid-1', type: 'sap.ui.model.json.JSONModel', page });
    const result = await obj.executeMethod('getData', []);
    expect(result).toEqual({ success: true, value: 42, duration: 1 });
    expect(page.evaluate).toHaveBeenCalledTimes(1);
  });

  it('executeMethod passes arguments', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValue({ success: true, value: 'ok', duration: 1 }),
    });
    const obj = UI5Object.create({ uuid: 'uuid-1', type: 'sap.ui.model.json.JSONModel', page });
    await obj.executeMethod('setProperty', ['/name', 'Test']);
    expect(page.evaluate).toHaveBeenCalledTimes(1);
    const script = vi.mocked(page.evaluate).mock.calls[0]?.[0] as string | undefined;
    expect(typeof script).toBe('string');
    expect(script).toContain('uuid-1');
  });

  it('toString returns meaningful string', () => {
    const page = createMockBridgePage();
    const obj = UI5Object.create({ uuid: 'uuid-1', type: 'sap.ui.model.json.JSONModel', page });
    expect(String(obj)).toBe('[UI5Object sap.ui.model.json.JSONModel uuid-1]');
  });

  it('multiple instances have distinct uuids', () => {
    const page = createMockBridgePage();
    const obj1 = UI5Object.create({ uuid: 'a', type: 'TypeA', page });
    const obj2 = UI5Object.create({ uuid: 'b', type: 'TypeB', page });
    expect(obj1.uuid).not.toBe(obj2.uuid);
  });
});
