/**
 * Tests for `src/fe/object-page.ts` — Fiori Elements Object Page operations.
 *
 * @remarks
 * Uses a mock page helper to simulate `page.evaluate()` and `page.waitForFunction()`
 * responses. Tests cover all exported functions with success, error, and edge cases.
 *
 * @module fe
 */
import { describe, expect, it, vi } from 'vitest';

import type { ObjectPagePage } from '../../../src/fe/object-page.js';
import {
  clickEditButton,
  clickObjectPageButton,
  clickSaveButton,
  getHeaderTitle,
  getObjectPageLayout,
  getObjectPageSections,
  getSectionData,
  isInEditMode,
  navigateToSection,
} from '../../../src/fe/object-page.js';

import { ControlError } from '#core/errors/control-error.js';
import { NavigationError } from '#core/errors/navigation-error.js';

/**
 * Creates a mock ObjectPagePage with configurable evaluate responses.
 *
 * @param evaluateResult - The value to return from evaluate().
 * @returns A mock page object with evaluate and waitForFunction as vi.fn mocks.
 */
function createMockPage(evaluateResult: unknown): ObjectPagePage & {
  evaluate: ReturnType<typeof vi.fn>;
  waitForFunction: ReturnType<typeof vi.fn>;
} {
  return {
    evaluate: vi.fn().mockResolvedValue(evaluateResult),
    waitForFunction: vi.fn().mockResolvedValue(undefined),
  };
}

describe('getObjectPageLayout', () => {
  it('returns layout ID when ObjectPageLayout is found', async () => {
    const page = createMockPage({ found: true, id: 'myApp--objectPageLayout' });
    const layoutId = await getObjectPageLayout(page);
    expect(layoutId).toBe('myApp--objectPageLayout');
  });

  it('throws ControlError when ObjectPageLayout is not found', async () => {
    const page = createMockPage({ found: false, id: '' });
    await expect(getObjectPageLayout(page)).rejects.toThrow(ControlError);
    await expect(getObjectPageLayout(page)).rejects.toThrow('ObjectPageLayout not found');
  });
});

describe('navigateToSection', () => {
  it('navigates to a section by title', async () => {
    const page = createMockPage({ success: true });
    await expect(navigateToSection(page, 'General Information')).resolves.toBeUndefined();
    expect(page.evaluate).toHaveBeenCalled();
    expect(page.waitForFunction).toHaveBeenCalled();
  });

  it('navigates to a section by ID', async () => {
    const page = createMockPage({ success: true });
    await expect(navigateToSection(page, 'section1')).resolves.toBeUndefined();
    expect(page.evaluate).toHaveBeenCalledWith(expect.any(String), 'section1');
  });

  it('throws NavigationError when section is not found', async () => {
    const page = createMockPage({ success: false, reason: 'section_not_found' });
    await expect(navigateToSection(page, 'NonExistent')).rejects.toThrow(NavigationError);
    await expect(navigateToSection(page, 'NonExistent')).rejects.toThrow(
      'Object Page section not found',
    );
  });

  it('skips stability wait when skipStabilityWait is true', async () => {
    const page = createMockPage({ success: true });
    await navigateToSection(page, 'General', { skipStabilityWait: true });
    expect(page.waitForFunction).not.toHaveBeenCalled();
  });
});

describe('getSectionData', () => {
  it('returns form field data from a section', async () => {
    const mockData = { 'Product Name': 'Widget A', Status: 'Active' };
    const page = createMockPage({ found: true, data: mockData });
    const data = await getSectionData(page, 'General Information');
    expect(data).toEqual(mockData);
  });

  it('returns empty data for a section with no form fields', async () => {
    const page = createMockPage({ found: true, data: {} });
    const data = await getSectionData(page, 'Empty Section');
    expect(data).toEqual({});
  });

  it('throws NavigationError when section is not found', async () => {
    const page = createMockPage({ found: false, data: {} });
    await expect(getSectionData(page, 'NonExistent')).rejects.toThrow(NavigationError);
    await expect(getSectionData(page, 'NonExistent')).rejects.toThrow(
      'Object Page section not found',
    );
  });
});

describe('clickObjectPageButton', () => {
  it('clicks a button in the header actions', async () => {
    const page = createMockPage({ clicked: true, location: 'header' });
    await expect(clickObjectPageButton(page, 'Edit')).resolves.toBeUndefined();
    expect(page.evaluate).toHaveBeenCalledWith(expect.any(String), 'Edit');
  });

  it('clicks a button in the footer bar', async () => {
    const page = createMockPage({ clicked: true, location: 'footer' });
    await expect(clickObjectPageButton(page, 'Save')).resolves.toBeUndefined();
    expect(page.waitForFunction).toHaveBeenCalled();
  });

  it('throws ControlError when button is not found', async () => {
    const page = createMockPage({ clicked: false, reason: 'button_not_found' });
    await expect(clickObjectPageButton(page, 'Delete')).rejects.toThrow(ControlError);
    await expect(clickObjectPageButton(page, 'Delete')).rejects.toThrow(
      'Object Page button not found',
    );
  });
});

describe('clickEditButton', () => {
  it('delegates to clickObjectPageButton with "Edit"', async () => {
    const page = createMockPage({ clicked: true, location: 'header' });
    await expect(clickEditButton(page)).resolves.toBeUndefined();
    expect(page.evaluate).toHaveBeenCalledWith(expect.any(String), 'Edit');
  });
});

describe('clickSaveButton', () => {
  it('delegates to clickObjectPageButton with "Save"', async () => {
    const page = createMockPage({ clicked: true, location: 'footer' });
    await expect(clickSaveButton(page)).resolves.toBeUndefined();
    expect(page.evaluate).toHaveBeenCalledWith(expect.any(String), 'Save');
  });

  it('waits for stability after saving', async () => {
    const page = createMockPage({ clicked: true, location: 'footer' });
    await clickSaveButton(page);
    expect(page.waitForFunction).toHaveBeenCalled();
  });
});

describe('getObjectPageSections', () => {
  it('returns sections with visibility, index, and sub-sections', async () => {
    const mockSections = [
      {
        id: 'sec1',
        title: 'General Information',
        visible: true,
        index: 0,
        subSections: [{ id: 'sub1', title: 'Basic Data' }],
      },
      {
        id: 'sec2',
        title: 'Items',
        visible: true,
        index: 1,
        subSections: [
          { id: 'sub2a', title: 'Item List' },
          { id: 'sub2b', title: 'Item Details' },
        ],
      },
    ];
    const page = createMockPage(mockSections);
    const sections = await getObjectPageSections(page);
    expect(sections).toHaveLength(2);
    expect(sections[0]?.title).toBe('General Information');
    expect(sections[0]?.visible).toBe(true);
    expect(sections[0]?.index).toBe(0);
    expect(sections[0]?.subSections).toHaveLength(1);
    expect(sections[1]?.subSections).toHaveLength(2);
  });

  it('includes section index in result', async () => {
    const mockSections = [
      { id: 'sec1', title: 'First', visible: true, index: 0, subSections: [] },
      { id: 'sec2', title: 'Second', visible: false, index: 1, subSections: [] },
    ];
    const page = createMockPage(mockSections);
    const sections = await getObjectPageSections(page);
    expect(sections[0]?.index).toBe(0);
    expect(sections[1]?.index).toBe(1);
    expect(sections[1]?.visible).toBe(false);
  });

  it('returns sub-sections for each section', async () => {
    const mockSections = [
      {
        id: 'sec1',
        title: 'Header',
        visible: true,
        index: 0,
        subSections: [
          { id: 'sub1', title: 'Overview' },
          { id: 'sub2', title: 'Details' },
          { id: 'sub3', title: 'Notes' },
        ],
      },
    ];
    const page = createMockPage(mockSections);
    const sections = await getObjectPageSections(page);
    expect(sections[0]?.subSections).toHaveLength(3);
    expect(sections[0]?.subSections[2]?.title).toBe('Notes');
  });

  it('returns empty array when no layout is found', async () => {
    const page = createMockPage([]);
    const sections = await getObjectPageSections(page);
    expect(sections).toEqual([]);
  });
});

describe('getHeaderTitle', () => {
  it('returns the header title string', async () => {
    const page = createMockPage('Purchase Order 4500000001');
    const title = await getHeaderTitle(page);
    expect(title).toBe('Purchase Order 4500000001');
  });
});

describe('isInEditMode', () => {
  it('returns true when in edit mode', async () => {
    const page = createMockPage(true);
    const result = await isInEditMode(page);
    expect(result).toBe(true);
  });

  it('returns false when in display mode', async () => {
    const page = createMockPage(false);
    const result = await isInEditMode(page);
    expect(result).toBe(false);
  });
});
