/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/auth/auth-types.ts` — Authentication type definitions.
 *
 * @remarks
 * Type-level verification of AuthStrategy, SAPAuthConfig, SessionInfo,
 * and AuthStrategyName interfaces/types. Ensures correct shape and
 * property types for the authentication module.
 */
import { describe, expectTypeOf, it } from 'vitest';

import type {
  AuthStrategy,
  AuthStrategyName,
  SAPAuthConfig,
  SessionInfo,
} from '../../../src/auth/auth-types.js';

describe('AuthStrategy', () => {
  it('has authenticate method', () => {
    expectTypeOf<AuthStrategy>().toHaveProperty('authenticate');
  });

  it('has isAuthenticated method', () => {
    expectTypeOf<AuthStrategy>().toHaveProperty('isAuthenticated');
  });

  it('has name property', () => {
    expectTypeOf<AuthStrategy>().toHaveProperty('name');
  });

  it('name is a readonly string', () => {
    expectTypeOf<AuthStrategy['name']>().toBeString();
  });
});

describe('SAPAuthConfig', () => {
  it('has required url field', () => {
    expectTypeOf<SAPAuthConfig>().toHaveProperty('url');
    expectTypeOf<SAPAuthConfig['url']>().toBeString();
  });

  it('has required username field', () => {
    expectTypeOf<SAPAuthConfig>().toHaveProperty('username');
    expectTypeOf<SAPAuthConfig['username']>().toBeString();
  });

  it('has required password field', () => {
    expectTypeOf<SAPAuthConfig>().toHaveProperty('password');
    expectTypeOf<SAPAuthConfig['password']>().toBeString();
  });

  it('has optional client field', () => {
    expectTypeOf<SAPAuthConfig>().toHaveProperty('client');
  });

  it('has optional language field', () => {
    expectTypeOf<SAPAuthConfig>().toHaveProperty('language');
  });

  it('has optional strategy field', () => {
    expectTypeOf<SAPAuthConfig>().toHaveProperty('strategy');
  });

  it('has optional loginEndpoint field', () => {
    expectTypeOf<SAPAuthConfig>().toHaveProperty('loginEndpoint');
  });

  it('has optional certificatePath field', () => {
    expectTypeOf<SAPAuthConfig>().toHaveProperty('certificatePath');
  });

  it('has optional certificateKeyPath field', () => {
    expectTypeOf<SAPAuthConfig>().toHaveProperty('certificateKeyPath');
  });

  it('has optional subdomain field', () => {
    expectTypeOf<SAPAuthConfig>().toHaveProperty('subdomain');
  });

  it('has optional staySignedIn field', () => {
    expectTypeOf<SAPAuthConfig>().toHaveProperty('staySignedIn');
  });

  it('has optional timeout field', () => {
    expectTypeOf<SAPAuthConfig>().toHaveProperty('timeout');
  });

  it('has optional storageStatePath field', () => {
    expectTypeOf<SAPAuthConfig>().toHaveProperty('storageStatePath');
  });
});

describe('SessionInfo', () => {
  it('has authenticatedAt field', () => {
    expectTypeOf<SessionInfo>().toHaveProperty('authenticatedAt');
    expectTypeOf<SessionInfo['authenticatedAt']>().toBeNumber();
  });

  it('has strategyName field', () => {
    expectTypeOf<SessionInfo>().toHaveProperty('strategyName');
    expectTypeOf<SessionInfo['strategyName']>().toBeString();
  });

  it('has isValid field', () => {
    expectTypeOf<SessionInfo>().toHaveProperty('isValid');
    expectTypeOf<SessionInfo['isValid']>().toBeBoolean();
  });
});

describe('AuthStrategyName', () => {
  it('is a string union type', () => {
    expectTypeOf<AuthStrategyName>().toExtend<string>();
  });

  it('accepts valid strategy names', () => {
    expectTypeOf<'onprem'>().toExtend<AuthStrategyName>();
    expectTypeOf<'cloud-saml'>().toExtend<AuthStrategyName>();
    expectTypeOf<'office365'>().toExtend<AuthStrategyName>();
    expectTypeOf<'api'>().toExtend<AuthStrategyName>();
    expectTypeOf<'certificate'>().toExtend<AuthStrategyName>();
    expectTypeOf<'multi-tenant'>().toExtend<AuthStrategyName>();
  });
});
