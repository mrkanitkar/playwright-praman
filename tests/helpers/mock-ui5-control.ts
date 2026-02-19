/**
 * Mock UI5 control factory for unit tests.
 *
 * @remarks
 * Creates mock `UI5ControlBase`-conformant objects with configurable
 * properties. Used by proxy and return-handler tests to simulate
 * bridge responses without a real SAP application.
 *
 * @example
 * ```typescript
 * import { createMockUI5Control } from '../../helpers/mock-ui5-control.js';
 *
 * const button = createMockUI5Control({
 *   id: 'saveBtn',
 *   controlType: 'sap.m.Button',
 * });
 * ```
 *
 * @module test-helpers
 */

import type { UI5ControlBase } from '#core/types/controls.js';

/** Default control type for mocks. */
const DEFAULT_CONTROL_TYPE = 'sap.m.Button';

/**
 * Creates default method stubs for UI5ControlBase.
 *
 * @param id - Control ID for getId() return.
 * @param controlType - Control type for getControlType() return.
 * @returns Object with all required UI5ControlBase methods.
 */
function createDefaultMethods(
  id: string,
  controlType: string,
): Omit<UI5ControlBase, 'id' | 'controlType'> {
  /* eslint-disable @typescript-eslint/promise-function-async -- mock stubs use Promise.resolve */
  return {
    getId: () => Promise.resolve(id),
    getControlType: () => Promise.resolve(controlType),
    getProperty: () => Promise.resolve(undefined),
    setProperty: () => Promise.resolve(),
    getAggregation: (): Promise<readonly UI5ControlBase[]> => Promise.resolve([]),
    getBindingInfo: () => Promise.resolve(undefined),
    getDomRef: () => Promise.resolve(null),
    getVisible: () => Promise.resolve(true),
    isBound: () => Promise.resolve(false),
    getModel: () => Promise.resolve(undefined),
  };
  /* eslint-enable @typescript-eslint/promise-function-async */
}

/**
 * Creates a mock UI5 control conforming to {@link UI5ControlBase}.
 *
 * @param overrides - Partial property overrides.
 * @returns A UI5ControlBase-conformant object with sensible defaults.
 *
 * @example
 * ```typescript
 * const input = createMockUI5Control({
 *   id: 'nameInput',
 *   controlType: 'sap.m.Input',
 * });
 * ```
 */
export function createMockUI5Control(overrides?: Partial<UI5ControlBase>): UI5ControlBase {
  const id = overrides?.id ?? 'mockControl-001';
  const controlType = overrides?.controlType ?? DEFAULT_CONTROL_TYPE;
  // createDefaultMethods() provides all required UI5ControlBase methods.
  // Object.assign preserves the type annotation while applying overrides.
  return Object.assign(
    { id, controlType },
    createDefaultMethods(id, controlType),
    overrides,
  ) as UI5ControlBase;
}

/**
 * Creates an array of mock UI5 controls.
 *
 * @param count - Number of controls to create.
 * @param baseOverrides - Properties applied to every control (id auto-incremented).
 * @returns Array of UI5ControlBase-conformant objects.
 *
 * @example
 * ```typescript
 * const items = createMockUI5Controls(3, { controlType: 'sap.m.StandardListItem' });
 * // items[0].id === 'mockControl-0', items[1].id === 'mockControl-1', ...
 * ```
 */
export function createMockUI5Controls(
  count: number,
  baseOverrides?: Partial<UI5ControlBase>,
): readonly UI5ControlBase[] {
  return Array.from({ length: count }, (_, i) =>
    createMockUI5Control({
      id: `mockControl-${String(i)}`,
      ...baseOverrides,
    }),
  );
}
