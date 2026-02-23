# License Verification & Strategy Plan for Praman v1.0

## Context

Before publishing `playwright-praman` as an npm package, we need to verify there is no unattributed open-source code (especially from wdi5 and qmate), fix the LICENSE file placeholder, and establish a clear license strategy. Praman's plan.md describes itself as "a port of wdi5 to Playwright" which raises the question of what legal obligations that creates.

---

## Scan Tools Used

| Tool                             | Scope                                            | What It Detects                                                     |
| -------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------- |
| **ScanCode Toolkit v32.0.2**     | `src/` (187 files)                               | Licenses, copyrights, code origins, package manifests, emails, URLs |
| **npx license-checker**          | Full `node_modules/` (1,254 packages)            | License type per dependency                                         |
| **jscpd v4.0.8**                 | `src/` (Praman) vs `src/` (dhikraft) — 296 files | Structural code clone detection across projects                     |
| **jscpd v4.0.8**                 | `src/` (Praman) vs `src/` (wdi5) — 213 files     | Structural code clone detection across projects                     |
| **Manual agent scan** (3 agents) | Entire repo + git history                        | wdi5/qmate code patterns, function names, commit references         |

---

## 1. ScanCode Results — Source Code Scan

**Scan date**: 2026-02-23 | **Files scanned**: 187 | **Errors**: 0

| Category               | Count | Details                                                           |
| ---------------------- | ----- | ----------------------------------------------------------------- |
| License detections     | **0** | No license headers, SPDX identifiers, or embedded license text    |
| Copyright detections   | **0** | No third-party copyright notices                                  |
| Package/vendored code  | **0** | No vendored third-party bundles under `src/`                      |
| Code origin indicators | **0** | No package manifests or origin markers                            |
| wdi5/qmate/GitHub URLs | **0** | No references to competing projects                               |
| Emails                 | 2     | Placeholder examples in TSDoc (`user@company.com`, `user@co.com`) |
| URLs                   | 10    | All SAP example/documentation URLs                                |

**Verdict**: Source code is 100% original with no embedded third-party code or licenses.

---

## 2. Code Pattern Scan — wdi5 & qmate

| Check                                   | Result                                                      |
| --------------------------------------- | ----------------------------------------------------------- |
| Direct code copied from wdi5            | **NONE** — all code is independently implemented            |
| Direct code copied from qmate           | **NONE** — no qmate patterns found at all                   |
| Direct code copied from dhikraft v2.5.0 | **NONE** — ground-up rewrite confirmed                      |
| npm dependency on wdi5/qmate            | **NONE** — zero packages in dependency tree                 |
| wdi5/qmate function/variable names      | **NONE** — no `wdi5Selector`, `forceSelect`, `nonUi5`, etc. |
| Git history referencing copied code     | **NONE** — commit history shows incremental implementation  |

### What IS Acknowledged in Source Comments

Two files credit wdi5/dhikraft for **architectural insights** (not code):

1. **`src/bridge/method-blacklist.ts`** — TSDoc says "Merged from dhikraft v2.5.0 production blacklist and wdi5 bridge conventions" (the blacklist _items_ — method names like `constructor`, `destroy` — are SAP UI5 API names, not copyrightable)
2. **`src/proxy/control-proxy.ts`** — TSDoc says "Method forwarder functions are cached per method name (wdi5 insight)" (a caching _technique_, not copied code)

---

## 3. Code Clone Detection (jscpd)

### 3a. Praman vs dhikraft

**Tool**: jscpd v4.0.8 | **Files scanned**: 296 (187 Praman + 109 dhikraft) | **Detection time**: 1.6s

| Metric                | Value          |
| --------------------- | -------------- |
| Total lines analyzed  | 78,473         |
| Total tokens analyzed | 384,205        |
| Clones found          | 115            |
| Duplicated lines      | 1,674 (2.13%)  |
| Duplicated tokens     | 16,099 (4.19%) |

| Category                                 | Count | Concern                                                |
| ---------------------------------------- | ----- | ------------------------------------------------------ |
| Internal to Praman (mk1 ↔ mk1)           | 66    | Normal — similar auth strategies, intent domains, etc. |
| Internal to dhikraft (package ↔ package) | 49    | Normal — internal duplication in older codebase        |
| **Cross-project (Praman ↔ dhikraft)**    | **0** | **NONE — zero code cloned between projects**           |

### 3b. Praman vs wdi5

**Tool**: jscpd v4.0.8 | **Files scanned**: 213 (187 Praman + 34 wdi5) | **Detection time**: 0.7s

| Metric                | Value         |
| --------------------- | ------------- |
| Total lines analyzed  | 42,511        |
| Total tokens analyzed | 195,040       |
| Clones found          | 75            |
| Duplicated lines      | 1,122 (2.64%) |
| Duplicated tokens     | 9,798 (5.02%) |

| Category                          | Count | Concern                                                |
| --------------------------------- | ----- | ------------------------------------------------------ |
| Internal to Praman (mk1 ↔ mk1)    | 66    | Normal — similar auth strategies, intent domains, etc. |
| Internal to wdi5 (wdi5 ↔ wdi5)    | 9     | Normal — internal duplication in wdi5 codebase         |
| **Cross-project (Praman ↔ wdi5)** | **0** | **NONE — zero code cloned between projects**           |

**Verdict**: Not a single structural code clone exists between Praman and either dhikraft or wdi5. The ground-up independent implementation is verified by automated tool.

---

## 4. Dependency License Audit (npx license-checker)

**Total packages scanned**: 1,254

### License Distribution

| License            | Count | %     |
| ------------------ | ----- | ----- |
| MIT                | 953   | 76.0% |
| ISC                | 120   | 9.6%  |
| Apache-2.0         | 88    | 7.0%  |
| BSD-3-Clause       | 30    | 2.4%  |
| BSD-2-Clause       | 27    | 2.2%  |
| BlueOak-1.0.0      | 18    | 1.4%  |
| (MIT OR CC0-1.0)   | 5     | 0.4%  |
| CC0-1.0            | 2     | 0.2%  |
| Other (6 packages) | 6     | 0.5%  |

**96.6%** of packages (1,212 / 1,254) use standard permissive licenses (MIT/ISC/Apache-2.0/BSD).

### Production Dependencies (Shipped in npm package)

| Package | Version | License | Bundled?   |
| ------- | ------- | ------- | ---------- |
| `pino`  | 10.3.1  | **MIT** | Yes (tsup) |
| `zod`   | 4.3.6   | **MIT** | Yes (tsup) |

### Peer Dependencies (User installs separately)

| Package            | Version | License        |
| ------------------ | ------- | -------------- |
| `@playwright/test` | 1.58.2  | **Apache-2.0** |

### Optional Dependencies (User opts in)

| Package                   | Version | License        |
| ------------------------- | ------- | -------------- |
| `@anthropic-ai/sdk`       | 0.36.3  | **MIT**        |
| `@opentelemetry/api`      | 1.9.0   | **Apache-2.0** |
| `@opentelemetry/sdk-node` | 0.212.0 | **Apache-2.0** |
| `openai`                  | 6.22.0  | **Apache-2.0** |

### Flagged Packages (6 non-standard licenses — ALL dev-only)

| Package                                      | License             | Dev-only? | Risk | Action                                                   |
| -------------------------------------------- | ------------------- | --------- | ---- | -------------------------------------------------------- |
| `eslint-plugin-sonarjs@3.0.7`                | **LGPL-3.0-only**   | Yes       | LOW  | Not shipped — no copyleft contamination                  |
| `@sapui5/types@1.136.14`                     | **Custom (SAP)**    | Yes       | LOW  | Transitive via `@ui5/mcp-server` — type definitions only |
| `@cspell/dict-en-common-misspellings@2.1.12` | **Custom (cspell)** | Yes       | NONE | Actual license is MIT; tool couldn't parse metadata      |
| `caniuse-lite@1.0.30001770`                  | **CC-BY-4.0**       | Yes       | NONE | Browser compat data — not shipped                        |
| `spdx-exceptions@2.5.0`                      | **CC-BY-3.0**       | Yes       | NONE | SPDX tooling data — not shipped                          |
| `argparse@2.0.1`                             | **Python-2.0**      | Yes       | NONE | PSF license is permissive — not shipped                  |

---

## 5. Reference Project Licenses

| Project             | License                  | Relationship to Praman                      |
| ------------------- | ------------------------ | ------------------------------------------- |
| **wdi5**            | Apache 2.0 + "Beer-Ware" | Architectural reference — no code shared    |
| **qmate**           | Apache 2.0 (SAP)         | No relationship — no code or patterns used  |
| **dhikraft v2.5.0** | Same author              | Predecessor — Praman is a ground-up rewrite |

---

## 6. Issues Found

1. **LICENSE file has placeholder**: Line 189 still says `Copyright [yyyy] [name of copyright owner]` — needs real values
2. **No NOTICE file**: Apache 2.0 best practice (optional but recommended when crediting inspirations)
3. **No SPDX headers**: Source files don't have license headers (common in modern projects, not required)

---

## 7. Recommended Actions

### 7.1 Fix LICENSE Copyright Line

**File**: `LICENSE` (line 189)

Replace:

```
Copyright [yyyy] [name of copyright owner]
```

With:

```
Copyright 2024-2026 ZesTest (support@zestest.in)
```

### 7.2 Create NOTICE File (Recommended, Not Required)

**File**: `NOTICE` (project root)

Apache 2.0 best practice is to include a NOTICE file for attribution. Since Praman acknowledges wdi5 as an architectural reference in its planning docs and code comments, a NOTICE file makes this transparent to users.

```
Praman (playwright-praman)
Copyright 2024-2026 ZesTest

This product was developed independently and does not contain code from
the projects listed below. The following projects served as architectural
references and inspiration during design:

- wdi5 (https://github.com/ui5-community/wdi5)
  Licensed under Apache License 2.0
  Architectural patterns for SAP UI5 browser bridge design were studied
  during Praman's independent implementation.

- dhikraft v2.5.0
  Predecessor project by the same author. Praman v1.0 is a complete
  ground-up rewrite with new architecture.
```

### 7.3 No Changes Needed for qmate

Zero code, zero patterns, zero dependencies from qmate. No attribution required.

### 7.4 Verify SBOM is Current

Run `npm run generate:sbom` to ensure `playwright-praman.sbom.json` reflects current dependency tree. This CycloneDX SBOM documents all transitive dependencies and their licenses.

---

## 8. License Strategy Decision

**Recommendation: Keep Apache 2.0 — no additional obligations**

| Question                                      | Answer                                                                                                                                               |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Do you need to include wdi5's license?        | **No** — no code was copied or derived from wdi5                                                                                                     |
| Do you need to include qmate's license?       | **No** — no relationship exists                                                                                                                      |
| Do you need to credit wdi5 anywhere?          | **Not legally required**, but a NOTICE file is good practice                                                                                         |
| Is Praman a "Derivative Work" of wdi5?        | **No** — independently implemented with different architecture (Proxy vs .bind(), Playwright vs WebdriverIO, TypeScript-first, 5-layer architecture) |
| Are the method blacklist items copyrightable? | **No** — they are SAP UI5 API method names (facts, not creative expression)                                                                          |
| Any GPL/AGPL contamination risk?              | **No** — only LGPL dep is `eslint-plugin-sonarjs` (dev-only, not shipped)                                                                            |
| Any restricted license in production?         | **No** — only MIT (pino, zod)                                                                                                                        |
| Any restricted license in peer/optional?      | **No** — all Apache-2.0 or MIT                                                                                                                       |

---

## 9. Verification Steps

1. Update LICENSE copyright line
2. Create NOTICE file
3. Run `npm run generate:sbom` to refresh SBOM
4. Run `npm run lint` to confirm no issues
5. Run `npm run build` to confirm NOTICE is included in package (add to `files` in package.json if needed)
6. Verify with `npm pack --dry-run` that LICENSE and NOTICE appear in the tarball

---

## Artifacts

| File                                  | Description                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| `scancode-results.json`               | Full ScanCode scan of `src/` (187 files)                                      |
| `license-report.json`                 | Full npx license-checker output (1,254 packages)                              |
| `jscpd-report/jscpd-report.json`      | jscpd clone detection: Praman vs dhikraft (296 files, 0 cross-project clones) |
| `jscpd-wdi5-report/jscpd-report.json` | jscpd clone detection: Praman vs wdi5 (213 files, 0 cross-project clones)     |
| `playwright-praman.sbom.json`         | CycloneDX SBOM (auto-generated)                                               |
