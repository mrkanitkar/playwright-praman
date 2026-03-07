---
title: 'Prompt: {Prompt Display Name} — End-to-End SAP Automation'
authors: [maheshwar]
draft: true
tags: [example-prompts, prompts, sap-ui5, ai, playwright]
description: >
  A production-ready AI prompt for automating a SAP business process
  using Praman and Playwright.
keywords:
  - praman
  - playwright
  - sap
  - test automation
  - ai prompt
---

# {Prompt Display Name} — End-to-End SAP Automation Prompt

A structured, prompt-engineered template for AI agents to automate
{brief description} using Praman fixtures and OData-first selectors.

<!-- truncate -->

## Overview

| Property             | Value                             |
| -------------------- | --------------------------------- |
| **Business Process** | {e.g., Order-to-Cash (O2C)}       |
| **SAP Transactions** | {e.g., VA01, VL01N, VL06O, VL03N} |
| **Complexity**       | {low / medium / high}             |
| **Estimated Steps**  | {number}                          |
| **Praman Version**   | >= 1.1.0                          |

## How to Use This Prompt

### Option 1: Via CLI (Recommended)

```bash
npm install playwright-praman @playwright/test
npx playwright-praman init
```

Find the prompt in `praman-prompts/{name}.prompt.md` in your project.

### Option 2: Copy from Below

Copy the prompt content below and paste into your AI agent
(Claude Code, GitHub Copilot, Cursor, or any LLM).

## The Prompt

{Paste the FULL content of prompts/{name}.prompt.md here inside a
markdown code block or as a collapsible details section.}

## Test Steps Summary

{Copy the test steps table from the prompt file.}

## Key Rules Enforced

See the full architecture rules embedded in the prompt above. Key highlights:

- Fixture-only pattern, OData-first selectors, Fiori stable IDs
- `setValue()` + `fireChange()` + `waitForUI5()` for every input

## Known Limitations

- This prompt targets SAP Fiori Elements apps. Custom freestyle apps may need additional mapping.
- {Add any prompt-specific limitations here.}

## Related Resources

- [Getting Started Guide](/docs/guides/getting-started)
- [SAP Control Cookbook](/docs/guides/sap-control-cookbook)
- [Gold Standard Test Pattern](/docs/guides/gold-standard-test)
- [Praman Fixtures Reference](/docs/guides/fixtures)
