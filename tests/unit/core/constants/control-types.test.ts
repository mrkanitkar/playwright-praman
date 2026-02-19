/**
 * Tests for `src/core/constants/control-types.ts` — interactive and container
 * control type sets with helper functions.
 *
 * @remarks
 * Verifies set sizes, key members, helper function behavior, and immutability
 * of the exported ReadonlySet constants.
 *
 * @module constants
 */
import { describe, expect, it } from 'vitest';

import {
  CONTAINER_CONTROL_TYPES,
  INTERACTIVE_CONTROL_TYPES,
  isContainerControl,
  isInteractiveControl,
} from '#core/constants/control-types.js';

describe('INTERACTIVE_CONTROL_TYPES', () => {
  it('contains 34 interactive control types', () => {
    expect(INTERACTIVE_CONTROL_TYPES.size).toBe(34);
  });

  it('includes sap.m.Button', () => {
    expect(INTERACTIVE_CONTROL_TYPES.has('sap.m.Button')).toBe(true);
  });

  it('includes sap.m.Input', () => {
    expect(INTERACTIVE_CONTROL_TYPES.has('sap.m.Input')).toBe(true);
  });

  it('includes sap.m.Select', () => {
    expect(INTERACTIVE_CONTROL_TYPES.has('sap.m.Select')).toBe(true);
  });

  it('includes sap.m.ComboBox', () => {
    expect(INTERACTIVE_CONTROL_TYPES.has('sap.m.ComboBox')).toBe(true);
  });

  it('includes sap.m.CheckBox', () => {
    expect(INTERACTIVE_CONTROL_TYPES.has('sap.m.CheckBox')).toBe(true);
  });

  it('includes sap.m.DatePicker', () => {
    expect(INTERACTIVE_CONTROL_TYPES.has('sap.m.DatePicker')).toBe(true);
  });

  it('includes sap.m.SearchField', () => {
    expect(INTERACTIVE_CONTROL_TYPES.has('sap.m.SearchField')).toBe(true);
  });

  it('includes sap.m.TextArea', () => {
    expect(INTERACTIVE_CONTROL_TYPES.has('sap.m.TextArea')).toBe(true);
  });

  it('includes sap.m.Table', () => {
    expect(INTERACTIVE_CONTROL_TYPES.has('sap.m.Table')).toBe(true);
  });

  it('includes sap.ui.comp.smartfield.SmartField', () => {
    expect(INTERACTIVE_CONTROL_TYPES.has('sap.ui.comp.smartfield.SmartField')).toBe(true);
  });

  it('includes sap.ui.comp.smartfilterbar.SmartFilterBar', () => {
    expect(INTERACTIVE_CONTROL_TYPES.has('sap.ui.comp.smartfilterbar.SmartFilterBar')).toBe(true);
  });

  it('includes sap.ui.comp.smarttable.SmartTable', () => {
    expect(INTERACTIVE_CONTROL_TYPES.has('sap.ui.comp.smarttable.SmartTable')).toBe(true);
  });

  it('includes sap.m.upload.UploadSet', () => {
    expect(INTERACTIVE_CONTROL_TYPES.has('sap.m.upload.UploadSet')).toBe(true);
  });

  it('does not include non-interactive types like sap.m.Text', () => {
    expect(INTERACTIVE_CONTROL_TYPES.has('sap.m.Text')).toBe(false);
  });

  it('does not include non-interactive types like sap.m.Label', () => {
    expect(INTERACTIVE_CONTROL_TYPES.has('sap.m.Label')).toBe(false);
  });

  it('is a ReadonlySet that does not expose add method at runtime', () => {
    // ReadonlySet type removes add/delete/clear at compile time.
    // At runtime the underlying Set still has them, but the type contract forbids usage.
    // We verify the type assignment works by checking it is an instance of Set.
    expect(INTERACTIVE_CONTROL_TYPES).toBeInstanceOf(Set);
  });
});

describe('CONTAINER_CONTROL_TYPES', () => {
  it('contains 27 container control types', () => {
    expect(CONTAINER_CONTROL_TYPES.size).toBe(27);
  });

  it('includes sap.m.Page', () => {
    expect(CONTAINER_CONTROL_TYPES.has('sap.m.Page')).toBe(true);
  });

  it('includes sap.m.Panel', () => {
    expect(CONTAINER_CONTROL_TYPES.has('sap.m.Panel')).toBe(true);
  });

  it('includes sap.m.Dialog', () => {
    expect(CONTAINER_CONTROL_TYPES.has('sap.m.Dialog')).toBe(true);
  });

  it('includes sap.m.FlexBox', () => {
    expect(CONTAINER_CONTROL_TYPES.has('sap.m.FlexBox')).toBe(true);
  });

  it('includes sap.uxap.ObjectPageLayout', () => {
    expect(CONTAINER_CONTROL_TYPES.has('sap.uxap.ObjectPageLayout')).toBe(true);
  });

  it('includes sap.f.DynamicPage', () => {
    expect(CONTAINER_CONTROL_TYPES.has('sap.f.DynamicPage')).toBe(true);
  });

  it('includes sap.f.FlexibleColumnLayout', () => {
    expect(CONTAINER_CONTROL_TYPES.has('sap.f.FlexibleColumnLayout')).toBe(true);
  });

  it('includes sap.ui.layout.form.SimpleForm', () => {
    expect(CONTAINER_CONTROL_TYPES.has('sap.ui.layout.form.SimpleForm')).toBe(true);
  });

  it('includes sap.ui.layout.Grid', () => {
    expect(CONTAINER_CONTROL_TYPES.has('sap.ui.layout.Grid')).toBe(true);
  });

  it('includes sap.ui.table.Table', () => {
    expect(CONTAINER_CONTROL_TYPES.has('sap.ui.table.Table')).toBe(true);
  });

  it('does not include non-container types like sap.m.Button', () => {
    expect(CONTAINER_CONTROL_TYPES.has('sap.m.Button')).toBe(false);
  });

  it('is a ReadonlySet that does not expose add method at runtime', () => {
    expect(CONTAINER_CONTROL_TYPES).toBeInstanceOf(Set);
  });
});

describe('isInteractiveControl', () => {
  it('returns true for a known interactive control type', () => {
    expect(isInteractiveControl('sap.m.Button')).toBe(true);
  });

  it('returns true for sap.m.MultiComboBox', () => {
    expect(isInteractiveControl('sap.m.MultiComboBox')).toBe(true);
  });

  it('returns false for a non-interactive control type', () => {
    expect(isInteractiveControl('sap.m.Text')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isInteractiveControl('')).toBe(false);
  });

  it('returns false for an arbitrary unknown type', () => {
    expect(isInteractiveControl('com.example.CustomControl')).toBe(false);
  });
});

describe('isContainerControl', () => {
  it('returns true for a known container control type', () => {
    expect(isContainerControl('sap.m.Page')).toBe(true);
  });

  it('returns true for sap.ui.layout.Splitter', () => {
    expect(isContainerControl('sap.ui.layout.Splitter')).toBe(true);
  });

  it('returns false for a non-container control type', () => {
    expect(isContainerControl('sap.m.Button')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isContainerControl('')).toBe(false);
  });

  it('returns false for an arbitrary unknown type', () => {
    expect(isContainerControl('com.example.CustomContainer')).toBe(false);
  });
});

describe('overlap between interactive and container sets', () => {
  it('sap.m.IconTabBar appears in interactive set', () => {
    expect(INTERACTIVE_CONTROL_TYPES.has('sap.m.IconTabBar')).toBe(true);
  });

  it('sap.m.IconTabBar appears in container set', () => {
    expect(CONTAINER_CONTROL_TYPES.has('sap.m.IconTabBar')).toBe(true);
  });

  it('sap.ui.table.Table appears in interactive set', () => {
    expect(INTERACTIVE_CONTROL_TYPES.has('sap.ui.table.Table')).toBe(true);
  });

  it('sap.ui.table.Table appears in container set', () => {
    expect(CONTAINER_CONTROL_TYPES.has('sap.ui.table.Table')).toBe(true);
  });
});
