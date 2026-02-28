---
sidebar_position: 49
title: Cloud ALM Integration
---

# Cloud ALM Integration

:::warning Correction notice
Earlier versions of this page incorrectly described a push model where test results are sent to Cloud ALM via HTTP POST. **That is not how Cloud ALM works.** The correct model is described below.
:::

## How the Integration Actually Works

SAP Cloud ALM Test Automation uses a **pull model**, not a push model:

| Direction             | What happens                                                                       |
| --------------------- | ---------------------------------------------------------------------------------- |
| Cloud ALM → Your tool | Cloud ALM calls your registered endpoint to trigger test runs and poll for results |
| Your tool → Cloud ALM | You can GET test cases from Cloud ALM using the Test Automation API                |

You **cannot** push test results to Cloud ALM. Cloud ALM **pulls** them from your tool on its own schedule.

## Integration Model

To integrate a custom test automation tool with Cloud ALM, you must expose an API that Cloud ALM calls. Cloud ALM acts as the client; your tool acts as the server.

```text
┌─────────────────────────────────────────────────────────┐
│  SAP Cloud ALM                                          │
│                                                         │
│  1. Sends test run trigger  ──────────►  Your tool API  │
│  2. Polls for results       ──────────►  Your tool API  │
│  3. Displays pulled results                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Your tool (Playwright + Praman)                        │
│                                                         │
│  GET test cases  ───────────────────►  Cloud ALM API    │
│  (optional — to know what to run)                       │
└─────────────────────────────────────────────────────────┘
```

## What You Can Do Today

### Fetch Test Cases from Cloud ALM

You can read test cases out of Cloud ALM using the Test Automation API. This lets you query which tests are scheduled for a given test plan or run configuration.

The API is available at SAP API Business Hub:

- [CALM_TEST_AUTOMATION API reference and tryout](https://api.sap.com/api/CALM_TEST_AUTOMATION/tryout)

Authentication uses OAuth 2.0. You can use the [SAP Cloud SDK for JavaScript](https://sap.github.io/cloud-sdk/docs/js/getting-started) to handle the credential and token management if you are building a Node.js integration layer.

### Generate JUnit XML from Playwright

Playwright's built-in JUnit reporter produces XML that Cloud ALM can consume once your tool exposes it via an endpoint Cloud ALM can poll:

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [['html'], ['junit', { outputFile: 'reports/results.xml' }]],
});
```

This XML file is what Cloud ALM will pull from your tool's result endpoint — you do not POST it to Cloud ALM.

## Registering as a Test Automation Provider

To connect Cloud ALM to your Playwright + Praman setup, you register your tool as a test automation provider in Cloud ALM's configuration. Cloud ALM then uses HTTP destination configuration to call your tool's endpoints.

SAP documentation for this setup:

- [Integrating Test Automation Providers](https://help.sap.com/docs/cloud-alm/setup-administration/integrating-test-automation-providers?locale=en-US)
- [Other Test Automation Providers](https://help.sap.com/docs/cloud-alm/setup-administration/other-test-automation-providers?locale=en-US)
- [Test Automation Tool for S/4HANA Cloud](https://help.sap.com/docs/cloud-alm/setup-administration/test-automation-tool-for-s4hana-cloud?locale=en-US)

Your tool must expose at minimum:

- An endpoint to **receive a test run trigger** from Cloud ALM
- An endpoint for Cloud ALM to **poll test results**

The exact API contract your tool must implement is defined in the provider integration guide linked above.

## What Praman Provides

Praman does not include a Cloud ALM provider server — that is an application layer your team builds on top. What Praman contributes:

| Praman output                     | Use in Cloud ALM integration                             |
| --------------------------------- | -------------------------------------------------------- |
| JUnit XML (`reports/results.xml`) | Serve from your result endpoint so Cloud ALM can pull it |
| Playwright HTML report            | Internal visibility; not consumed by Cloud ALM           |
| `test.step()` names               | Appear as step details in JUnit XML                      |
| Exit code 0/1                     | Signal pass/fail to your trigger endpoint handler        |

## API Reference

| Resource                      | Link                                                                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloud ALM Test Automation API | [help.sap.com — Test Automation API](https://help.sap.com/docs/cloud-alm/apis/test-automation-api?locale=en-US)                                       |
| API tryout (SAP API Hub)      | [api.sap.com — CALM_TEST_AUTOMATION](https://api.sap.com/api/CALM_TEST_AUTOMATION/tryout)                                                             |
| Provider setup guide          | [Integrating Test Automation Providers](https://help.sap.com/docs/cloud-alm/setup-administration/integrating-test-automation-providers?locale=en-US)  |
| Other providers guide         | [Other Test Automation Providers](https://help.sap.com/docs/cloud-alm/setup-administration/other-test-automation-providers?locale=en-US)              |
| S/4HANA Cloud specific        | [Test Automation Tool for S/4HANA Cloud](https://help.sap.com/docs/cloud-alm/setup-administration/test-automation-tool-for-s4hana-cloud?locale=en-US) |
| SAP Cloud SDK for JS          | [sap.github.io/cloud-sdk](https://sap.github.io/cloud-sdk/docs/js/getting-started)                                                                    |
