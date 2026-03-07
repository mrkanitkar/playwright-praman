# SEO Keyword Master List — Praman

**Updated:** 2026-03-07

---

## Primary Keywords (5-7) — Target on Homepage + README + npm

These are the highest-value terms Praman must rank for.

| Keyword                      | Intent | Monthly Est. | Target Page                     |
| ---------------------------- | ------ | ------------ | ------------------------------- |
| `playwright sap testing`     | High   | 300-600      | Homepage, Getting Started       |
| `sap ui5 test automation`    | High   | 500-1000     | Homepage, README                |
| `sap fiori test automation`  | High   | 400-800      | Homepage, Fiori Elements guide  |
| `playwright sap ui5`         | High   | 200-400      | Homepage, Getting Started       |
| `sap s4hana test automation` | High   | 400-800      | Homepage, Upgrade Testing guide |
| `ai sap testing`             | Medium | 100-300      | AI Integration guide            |
| `playwright-praman`          | Brand  | 50-100       | npm, GitHub, Homepage           |

---

## Secondary Keywords (15-20) — Target on Guide Pages + Blog

| Keyword                             | Intent | Target Page                           |
| ----------------------------------- | ------ | ------------------------------------- |
| `sap ui5 e2e testing`               | High   | Getting Started                       |
| `playwright sap plugin`             | High   | Homepage                              |
| `sap fiori elements testing`        | High   | Fiori Elements guide                  |
| `wdi5 alternative`                  | High   | Migration from wdi5 / Comparison page |
| `wdi5 vs playwright`                | High   | Comparison blog post                  |
| `sap odata testing`                 | Medium | OData Operations guide                |
| `sap odata mock`                    | Medium | OData Mocking guide                   |
| `sap fiori launchpad automation`    | Medium | Navigation guide                      |
| `sap btp test automation`           | Medium | Authentication guide                  |
| `sap test framework comparison`     | Medium | Comparison page                       |
| `playwright enterprise testing`     | Medium | Features page                         |
| `sap regression testing automation` | Medium | Upgrade Testing guide                 |
| `ai test generation playwright`     | Medium | AI Integration guide                  |
| `sap ui5 control testing`           | Medium | SAP Control Cookbook                  |
| `sap cloud alm testing`             | Medium | Cloud ALM Integration guide           |
| `playwright custom matchers`        | Medium | Custom Matchers guide                 |
| `sap authentication playwright`     | Medium | Authentication guide                  |
| `sap activate testing`              | Medium | SAP Activate Alignment guide          |
| `qmate alternative`                 | High   | Comparison page                       |
| `tosca to playwright migration`     | High   | Migration from Tosca guide            |

---

## Long-Tail Keywords (30+) — Target in Blog Posts + Deep Guide Pages

| Keyword                                             | Intent | Content Type                      |
| --------------------------------------------------- | ------ | --------------------------------- |
| `how to automate sap ui5 testing with playwright`   | Medium | Blog post                         |
| `sap fiori e2e testing best practices 2026`         | Medium | Blog post                         |
| `playwright sap ui5 getting started tutorial`       | High   | Getting Started guide             |
| `migrate wdi5 tests to playwright`                  | High   | Migration guide                   |
| `sap s4hana migration testing automation`           | Medium | Upgrade Testing guide             |
| `sap odata v4 mock testing playwright`              | High   | OData Mocking guide               |
| `sap fiori elements list report testing`            | High   | Fiori Elements guide              |
| `playwright sap fiori launchpad navigation`         | High   | Navigation guide                  |
| `sap ui5 smarttable testing automation`             | High   | SAP Control Cookbook              |
| `sap ui5 dialog testing playwright`                 | High   | Dialog Handling example           |
| `sap btp saml authentication playwright`            | High   | Authentication guide              |
| `playwright custom selector sap ui5`                | High   | Selectors guide                   |
| `sap ui5 test automation framework comparison 2026` | Medium | Blog post                         |
| `ai powered sap test generation`                    | Medium | AI Integration guide              |
| `sap erp testing automation open source`            | Medium | Homepage                          |
| `playwright sap webgui testing`                     | Low    | Future feature / blog             |
| `sap fiori quality assurance automation`            | Medium | Business Process guide            |
| `sap s4hana go live testing checklist`              | Medium | Blog post                         |
| `playwright odata interceptor sap`                  | High   | OData Operations guide            |
| `sap ui5 typed control proxy`                       | High   | Typed Controls guide              |
| `playwright fixtures sap testing`                   | High   | Fixtures guide                    |
| `sap ui5 stability synchronization`                 | Medium | Discovery & Interaction guide     |
| `sap test data management automation`               | Medium | Test Data Management guide        |
| `playwright parallel sap testing`                   | Medium | Parallel Execution guide          |
| `sap visual regression testing playwright`          | Medium | Visual Regression guide           |
| `sap accessibility testing wcag playwright`         | Medium | Accessibility Testing guide       |
| `playwright sap docker ci cd`                       | Medium | Docker & CI/CD guide              |
| `sap ui5 openui5 test framework`                    | Medium | Homepage                          |
| `selenium to playwright sap migration`              | High   | Migration from Selenium guide     |
| `tosca to playwright sap migration`                 | High   | Migration from Tosca guide        |
| `sap transaction testing automation`                | Medium | Transaction Mapping guide         |
| `playwright sap azure workspaces`                   | Medium | Azure Playwright Workspaces guide |
| `sap business analyst test automation`              | Low    | Business Analyst guide            |

---

## Keyword Usage Guidelines

### For npm package.json

Use the top 25 most relevant keywords. npm search weighs:

1. Package name match (highest)
2. Description keywords (high)
3. Keywords array (medium)
4. README content (lower)

### For doc page frontmatter

```yaml
---
title: 'Page Title — Include Primary Keyword'
description: '150-160 char description with 1-2 target keywords naturally included.'
keywords:
  - primary keyword
  - secondary keyword
  - long-tail keyword
---
```

### For blog posts

- Title: Include exact target keyword
- First paragraph: Include primary + secondary keyword
- H2 headings: Include variations of target keywords
- Meta description: 150-160 chars with call-to-action

### For GitHub

- Repository description: Include "Playwright", "SAP", "UI5", "test automation"
- Topics: Map to top 20 keywords (already well-done)
- README first paragraph: Include primary keywords naturally
