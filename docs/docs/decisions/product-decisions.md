---
sidebar_position: 1
title: Product Decisions
---

Decisions made during Phase 7.0 Batch 2 (2026-02-23). Each decision evaluates a default value
and provides rationale for keeping or changing it.

## P5-PD-001: SAP_ACTIVE_SYSTEM Default

| Property     | Value                                                          |
| ------------ | -------------------------------------------------------------- |
| **Question** | Should `SAP_ACTIVE_SYSTEM` default to `'onprem'` or `'cloud'`? |
| **Decision** | Keep `'onprem'`                                                |
| **Status**   | DECIDED                                                        |
| **Date**     | 2026-02-23                                                     |

### Context

The `SAP_ACTIVE_SYSTEM` environment variable determines which authentication flow and
URL set to use. It defaults to `'onprem'` when not explicitly set.

### Rationale

- The majority of SAP testing targets on-premise S/4HANA systems (larger installed base)
- BTP/cloud adoption is growing but on-premise remains the dominant deployment model
- On-premise is the more conservative default — cloud users explicitly know they use BTP
- Changing to `'cloud'` would be a breaking change for existing on-prem users
- Cloud users must set `SAP_ACTIVE_SYSTEM=cloud` explicitly, which also signals intent

### Code Locations

- `src/auth/auth-handler.ts:440` — `process.env['SAP_ACTIVE_SYSTEM'] ?? 'onprem'`
- `src/auth/auth-setup.ts:46` — same pattern

### Override

Set `SAP_ACTIVE_SYSTEM=cloud` in your environment or `.env` file.

---

## P5-PD-002: Session Timeout Default

| Property     | Value                                                               |
| ------------ | ------------------------------------------------------------------- |
| **Question** | Should session timeout default to 1800s (30 min) or 3600s (60 min)? |
| **Decision** | Keep 1800s (30 minutes)                                             |
| **Status**   | DECIDED                                                             |
| **Date**     | 2026-02-23                                                          |

### Context

`DEFAULT_SESSION_TIMEOUT_MS` controls when the client considers the SAP session expired,
triggering re-authentication on the next test run.

### Rationale

- SAP ICM (Internet Communication Manager) default session timeout is 1800s for ABAP systems
- Matching the server-side default prevents stale client sessions from attempting requests on expired server sessions
- 60 minutes would mask server-side expiry, causing confusing failures mid-test
- Most Playwright test suites complete well within 30 minutes per project
- Users with longer suites can override via the `timeoutMs` parameter on `isSessionExpired()`

### Code Location

- `src/auth/auth-handler.ts:51` — `const DEFAULT_SESSION_TIMEOUT_MS = 30 * 60 * 1000`

### Override

Pass a custom timeout to `isSessionExpired(timeoutMs)` or extend via auth fixture config.

---

## P5-PD-003: Synonym Scoring Penalty

| Property     | Value                                                                        |
| ------------ | ---------------------------------------------------------------------------- |
| **Question** | Should synonym matches be penalized (0.9x) or treated as full matches (1.0)? |
| **Decision** | Keep 1.0 (no penalty)                                                        |
| **Status**   | DECIDED                                                                      |
| **Date**     | 2026-02-23                                                                   |

### Context

The vocabulary matcher's `scoreTerm()` function computes confidence scores for matching
user queries against vocabulary terms and their synonyms. Synonyms currently receive the
same confidence score as canonical term names.

### Rationale

- SAP vocabulary synonyms are authoritative alternate names (e.g., "vendor" = "supplier"), not approximations
- A 0.9x penalty would make synonym exact-matches indistinguishable from prefix matches (also 0.9), losing signal
- Current scoring tiers provide clear differentiation: exact=1.0, prefix=0.9, partial=0.7, fuzzy=0.5
- Users expect "vendor" to match "supplier" with full confidence when "vendor" is a defined synonym
- False positive rate with current scoring is low due to curated domain vocabularies

### Code Location

- `src/vocabulary/vocabulary-matcher.ts:181-191` — `scoreTerm()` function
- Synonym candidates are merged with canonical name: `[normalize(term.name), ...term.synonyms.map(normalize)]`

### Override

Not currently overridable. To add a penalty in the future, introduce a `synonymPenalty`
multiplier in the `VocabularyService` config.
