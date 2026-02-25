/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Type-level tests for `src/ai/types.ts`.
 *
 * @remarks
 * Verifies AiResponse discriminated union narrowing, AiResponseMetadata shape,
 * AiProviderConfig constraints, CapabilityEntry, RecipeEntry, AgenticCheckpoint,
 * DiscoveredControl, PageContext, and AiGeneratedTest.
 */
import { describe, expectTypeOf, it } from 'vitest';

import type { RecipePriority } from '#ai/schemas/recipe.schema.js';
import type {
  AgenticCheckpoint,
  AiGeneratedTest,
  AiProviderConfig,
  AiResponse,
  AiResponseError,
  AiResponseMetadata,
  CapabilityCategory,
  CapabilityEntry,
  CapabilityPriority,
  DiscoveredControl,
  PageContext,
  RecipeEntry,
} from '#ai/types.js';

// ── AiResponseMetadata ─────────────────────────────────────────────────────

describe('AiResponseMetadata', () => {
  it('has required fields', () => {
    expectTypeOf<AiResponseMetadata>().toHaveProperty('duration');
    expectTypeOf<AiResponseMetadata>().toHaveProperty('retryable');
    expectTypeOf<AiResponseMetadata>().toHaveProperty('suggestions');
  });

  it('duration is a number', () => {
    expectTypeOf<AiResponseMetadata['duration']>().toEqualTypeOf<number>();
  });

  it('retryable is a boolean', () => {
    expectTypeOf<AiResponseMetadata['retryable']>().toEqualTypeOf<boolean>();
  });

  it('suggestions is a string array', () => {
    expectTypeOf<AiResponseMetadata['suggestions']>().toEqualTypeOf<string[]>();
  });

  it('model is optional string', () => {
    expectTypeOf<AiResponseMetadata['model']>().toEqualTypeOf<string | undefined>();
  });

  it('tokens is optional number', () => {
    expectTypeOf<AiResponseMetadata['tokens']>().toEqualTypeOf<number | undefined>();
  });
});

// ── AiResponseError ────────────────────────────────────────────────────────

describe('AiResponseError', () => {
  it('has code and message as strings', () => {
    expectTypeOf<AiResponseError['code']>().toEqualTypeOf<string>();
    expectTypeOf<AiResponseError['message']>().toEqualTypeOf<string>();
  });
});

// ── AiResponse discriminated union ─────────────────────────────────────────

describe('AiResponse<T> discriminated union', () => {
  it('narrows data to T on success status', () => {
    const response = {} as AiResponse<number>;
    if (response.status === 'success') {
      expectTypeOf(response.data).toEqualTypeOf<number>();
    }
  });

  it('narrows data to undefined on error status', () => {
    const response = {} as AiResponse<number>;
    if (response.status === 'error') {
      expectTypeOf(response.data).toEqualTypeOf<undefined>();
    }
  });

  it('narrows data to Partial<T> on partial status', () => {
    const response = {} as AiResponse<{ name: string; age: number }>;
    if (response.status === 'partial') {
      expectTypeOf(response.data).toEqualTypeOf<Partial<{ name: string; age: number }>>();
    }
  });

  it('error branch has error property', () => {
    const response = {} as AiResponse<string>;
    if (response.status === 'error') {
      expectTypeOf(response.error).toExtend<AiResponseError>();
    }
  });

  it('partial branch has optional error property', () => {
    const response = {} as AiResponse<string>;
    if (response.status === 'partial') {
      expectTypeOf(response.error).toEqualTypeOf<AiResponseError | undefined>();
    }
  });

  it('all branches have metadata', () => {
    const response = {} as AiResponse<string>;
    if (response.status === 'success') {
      expectTypeOf(response.metadata).toExtend<AiResponseMetadata>();
    }
    if (response.status === 'error') {
      expectTypeOf(response.metadata).toExtend<AiResponseMetadata>();
    }
    if (response.status === 'partial') {
      expectTypeOf(response.metadata).toExtend<AiResponseMetadata>();
    }
  });

  it('works with complex generic type T', () => {
    interface TestData {
      id: string;
      values: number[];
    }
    const response = {} as AiResponse<TestData>;
    if (response.status === 'success') {
      expectTypeOf(response.data).toEqualTypeOf<TestData>();
    }
    if (response.status === 'partial') {
      expectTypeOf(response.data).toEqualTypeOf<Partial<TestData>>();
    }
  });
});

// ── AiProviderConfig ───────────────────────────────────────────────────────

describe('AiProviderConfig', () => {
  it('provider is a union of known strings', () => {
    expectTypeOf<AiProviderConfig['provider']>().toEqualTypeOf<
      'azure-openai' | 'openai' | 'anthropic'
    >();
  });

  it('model and temperature are required', () => {
    expectTypeOf<AiProviderConfig>().toHaveProperty('model');
    expectTypeOf<AiProviderConfig>().toHaveProperty('temperature');
  });

  it('apiKey is optional string', () => {
    expectTypeOf<AiProviderConfig['apiKey']>().toEqualTypeOf<string | undefined>();
  });

  it('maxTokens is optional number', () => {
    expectTypeOf<AiProviderConfig['maxTokens']>().toEqualTypeOf<number | undefined>();
  });
});

// ── CapabilityEntry ────────────────────────────────────────────────────────

describe('CapabilityEntry', () => {
  it('has required string fields', () => {
    expectTypeOf<CapabilityEntry['id']>().toEqualTypeOf<string>();
    expectTypeOf<CapabilityEntry['qualifiedName']>().toEqualTypeOf<string>();
    expectTypeOf<CapabilityEntry['name']>().toEqualTypeOf<string>();
    expectTypeOf<CapabilityEntry['description']>().toEqualTypeOf<string>();
    expectTypeOf<CapabilityEntry['usageExample']>().toEqualTypeOf<string>();
  });

  it('category is a CapabilityCategory union', () => {
    expectTypeOf<CapabilityEntry['category']>().toEqualTypeOf<CapabilityCategory>();
  });

  it('priority is a CapabilityPriority union', () => {
    expectTypeOf<CapabilityEntry['priority']>().toEqualTypeOf<CapabilityPriority>();
  });

  it('registryVersion is the literal 1', () => {
    expectTypeOf<CapabilityEntry['registryVersion']>().toEqualTypeOf<1>();
  });

  it('intent is optional string', () => {
    expectTypeOf<CapabilityEntry['intent']>().toEqualTypeOf<string | undefined>();
  });

  it('sapModule is optional string', () => {
    expectTypeOf<CapabilityEntry['sapModule']>().toEqualTypeOf<string | undefined>();
  });
});

// ── RecipeEntry ────────────────────────────────────────────────────────────

describe('RecipeEntry', () => {
  it('has required string fields', () => {
    expectTypeOf<RecipeEntry['id']>().toEqualTypeOf<string>();
    expectTypeOf<RecipeEntry['name']>().toEqualTypeOf<string>();
    expectTypeOf<RecipeEntry['description']>().toEqualTypeOf<string>();
    expectTypeOf<RecipeEntry['domain']>().toEqualTypeOf<string>();
    expectTypeOf<RecipeEntry['pattern']>().toEqualTypeOf<string>();
  });

  it('capabilities is a string array', () => {
    expectTypeOf<RecipeEntry['capabilities']>().toEqualTypeOf<string[]>();
  });

  it('priority is a RecipePriority union', () => {
    expectTypeOf<RecipeEntry['priority']>().toEqualTypeOf<RecipePriority>();
  });
});

// ── AgenticCheckpoint ──────────────────────────────────────────────────────

describe('AgenticCheckpoint', () => {
  it('has sessionId as string', () => {
    expectTypeOf<AgenticCheckpoint['sessionId']>().toEqualTypeOf<string>();
  });

  it('currentStep is a number', () => {
    expectTypeOf<AgenticCheckpoint['currentStep']>().toEqualTypeOf<number>();
  });

  it('completedSteps and remainingSteps are string arrays', () => {
    expectTypeOf<AgenticCheckpoint['completedSteps']>().toEqualTypeOf<string[]>();
    expectTypeOf<AgenticCheckpoint['remainingSteps']>().toEqualTypeOf<string[]>();
  });

  it('state is Record<string, unknown>', () => {
    expectTypeOf<AgenticCheckpoint['state']>().toEqualTypeOf<Record<string, unknown>>();
  });

  it('timestamp is a string', () => {
    expectTypeOf<AgenticCheckpoint['timestamp']>().toEqualTypeOf<string>();
  });
});

// ── DiscoveredControl ──────────────────────────────────────────────────────

describe('DiscoveredControl', () => {
  it('category is a union of known literals', () => {
    expectTypeOf<DiscoveredControl['category']>().toEqualTypeOf<
      'interactive' | 'container' | 'navigation' | 'unknown'
    >();
  });

  it('visible is boolean', () => {
    expectTypeOf<DiscoveredControl['visible']>().toEqualTypeOf<boolean>();
  });

  it('text is optional string', () => {
    expectTypeOf<DiscoveredControl['text']>().toEqualTypeOf<string | undefined>();
  });

  it('objectCategory is optional string', () => {
    expectTypeOf<DiscoveredControl['objectCategory']>().toEqualTypeOf<string | undefined>();
  });

  it('properties is optional Record', () => {
    expectTypeOf<DiscoveredControl['properties']>().toEqualTypeOf<
      Record<string, unknown> | undefined
    >();
  });
});

// ── PageContext ────────────────────────────────────────────────────────────

describe('PageContext', () => {
  it('url and timestamp are required strings', () => {
    expectTypeOf<PageContext['url']>().toEqualTypeOf<string>();
    expectTypeOf<PageContext['timestamp']>().toEqualTypeOf<string>();
  });

  it('ui5Version is optional string', () => {
    expectTypeOf<PageContext['ui5Version']>().toEqualTypeOf<string | undefined>();
  });

  it('controls, formFields, buttons, tables, navigationElements are DiscoveredControl arrays', () => {
    expectTypeOf<PageContext['controls']>().toEqualTypeOf<DiscoveredControl[]>();
    expectTypeOf<PageContext['formFields']>().toEqualTypeOf<DiscoveredControl[]>();
    expectTypeOf<PageContext['buttons']>().toEqualTypeOf<DiscoveredControl[]>();
    expectTypeOf<PageContext['tables']>().toEqualTypeOf<DiscoveredControl[]>();
    expectTypeOf<PageContext['navigationElements']>().toEqualTypeOf<DiscoveredControl[]>();
  });
});

// ── AiGeneratedTest ────────────────────────────────────────────────────────

describe('AiGeneratedTest', () => {
  it('steps is a string array', () => {
    expectTypeOf<AiGeneratedTest['steps']>().toEqualTypeOf<string[]>();
  });

  it('code is a string', () => {
    expectTypeOf<AiGeneratedTest['code']>().toEqualTypeOf<string>();
  });

  it('metadata.model is a string', () => {
    expectTypeOf<AiGeneratedTest['metadata']['model']>().toEqualTypeOf<string>();
  });

  it('metadata.tokens has input and output as numbers', () => {
    expectTypeOf<AiGeneratedTest['metadata']['tokens']['input']>().toEqualTypeOf<number>();
    expectTypeOf<AiGeneratedTest['metadata']['tokens']['output']>().toEqualTypeOf<number>();
  });

  it('metadata.duration is a number', () => {
    expectTypeOf<AiGeneratedTest['metadata']['duration']>().toEqualTypeOf<number>();
  });

  it('metadata.capabilities is a string array', () => {
    expectTypeOf<AiGeneratedTest['metadata']['capabilities']>().toEqualTypeOf<string[]>();
  });
});
