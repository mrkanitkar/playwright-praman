---
sidebar_position: 40
title: IDE Setup Guide
---

Step-by-step guide for setting up VS Code (and other IDEs) for Praman development. Covers
essential extensions, debugging configuration, code navigation, and productivity tips.

## VS Code Setup

### Required Extensions

Install these extensions for the best Praman development experience:

| Extension                | ID                         | Purpose                                        |
| ------------------------ | -------------------------- | ---------------------------------------------- |
| ESLint                   | `dbaeumer.vscode-eslint`   | Lint TypeScript with Praman's 11-plugin config |
| Playwright Test          | `ms-playwright.playwright` | Run/debug tests, view traces                   |
| TypeScript               | Built-in                   | TypeScript language support                    |
| Vitest                   | `vitest.explorer`          | Run unit tests from sidebar                    |
| Pretty TypeScript Errors | `yoavbls.pretty-ts-errors` | Readable type error messages                   |

### Recommended Extensions

| Extension           | ID                                   | Purpose                      |
| ------------------- | ------------------------------------ | ---------------------------- |
| Error Lens          | `usernamehw.errorlens`               | Inline error/warning display |
| GitLens             | `eamodio.gitlens`                    | Git blame, history, compare  |
| Path Intellisense   | `christian-kohler.path-intellisense` | Auto-complete file paths     |
| Markdown All in One | `yzhang.markdown-all-in-one`         | Docs authoring               |

### Install via CLI

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension ms-playwright.playwright
code --install-extension vitest.explorer
code --install-extension yoavbls.pretty-ts-errors
code --install-extension usernamehw.errorlens
```

## VS Code Settings

Create or update `.vscode/settings.json` in your test project:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.defaultFormatter": "dbaeumer.vscode-eslint",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": ["typescript"],
  "testing.defaultGutterClickAction": "debug",
  "playwright.reuseBrowser": true,
  "playwright.showTrace": true
}
```

## Debugging Praman Tests

### Launch Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Current Test File",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/playwright",
      "args": ["test", "${relativeFile}", "--headed", "--workers=1"],
      "console": "integratedTerminal",
      "env": {
        "PWDEBUG": "1",
        "SAP_BASE_URL": "https://your-sap-system.example.com",
        "SAP_USERNAME": "your-user",
        "SAP_PASSWORD": "your-password"
      }
    },
    {
      "name": "Debug Specific Test",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/playwright",
      "args": ["test", "${relativeFile}", "--headed", "--workers=1", "-g", "${selectedText}"],
      "console": "integratedTerminal",
      "env": {
        "PWDEBUG": "1"
      }
    },
    {
      "name": "Debug Unit Tests (Vitest)",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/vitest",
      "args": ["run", "${relativeFile}"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Debugging with Playwright Inspector

Set `PWDEBUG=1` to launch the Playwright Inspector:

```bash
PWDEBUG=1 npx playwright test tests/my-test.spec.ts --headed --workers=1
```

The Inspector lets you:

- Step through test actions one at a time
- Inspect the UI5 control tree in the browser
- View selectors and their matches
- Record new actions

### Debugging with Playwright Trace Viewer

After a test run, open the trace:

```bash
npx playwright show-trace test-results/my-test/trace.zip
```

The Trace Viewer shows:

- Action timeline with screenshots
- Network requests (OData calls)
- Console logs
- DOM snapshots at each step

## Code Navigation

### Path Aliases

Praman uses TypeScript path aliases. Configure VS Code to resolve them:

```json
// tsconfig.json (already configured in playwright-praman)
{
  "compilerOptions": {
    "paths": {
      "#core/*": ["./src/core/*"],
      "#bridge/*": ["./src/bridge/*"],
      "#proxy/*": ["./src/proxy/*"],
      "#fixtures/*": ["./src/fixtures/*"]
    }
  }
}
```

VS Code resolves these automatically when `typescript.tsdk` points to the project's TypeScript.

### Go to Definition

- `F12` or `Cmd+Click` on any Praman fixture or function
- Works with `ui5.control()`, `ui5.click()`, `feListReport.*`, etc.
- Navigates into `node_modules/playwright-praman` source

### Find All References

- `Shift+F12` on any Praman type or function
- Useful for seeing usage patterns across your test suite

## Environment Variables

### .env File

Create a `.env` file in your project root (add to `.gitignore`):

```bash
# .env
SAP_BASE_URL=https://your-sap-system.example.com
SAP_USERNAME=test-user
SAP_PASSWORD=test-password
SAP_CLIENT=100
SAP_LANGUAGE=EN
```

### dotenv Integration

Load `.env` in your Playwright config:

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import { config } from 'dotenv';

config(); // Load .env file

export default defineConfig({
  use: {
    baseURL: process.env.SAP_BASE_URL,
  },
});
```

## Snippets

Add Praman-specific code snippets to `.vscode/praman.code-snippets`:

```json
{
  "Praman Test": {
    "prefix": "ptest",
    "scope": "typescript",
    "body": [
      "import { test, expect } from 'playwright-praman';",
      "",
      "test.describe('$1', () => {",
      "  test('$2', async ({ ui5, ui5Navigation, ui5Matchers }) => {",
      "    await test.step('$3', async () => {",
      "      $0",
      "    });",
      "  });",
      "});"
    ],
    "description": "Praman test with fixtures"
  },
  "Praman Step": {
    "prefix": "pstep",
    "scope": "typescript",
    "body": ["await test.step('$1', async () => {", "  $0", "});"],
    "description": "Praman test step"
  },
  "UI5 Control Selector": {
    "prefix": "pcontrol",
    "scope": "typescript",
    "body": [
      "const ${1:control} = await ui5.control({",
      "  controlType: '${2:sap.m.Button}',",
      "  ${3:properties: { text: '$4' \\}},",
      "});"
    ],
    "description": "UI5 control selector"
  },
  "UI5 Click": {
    "prefix": "pclick",
    "scope": "typescript",
    "body": [
      "await ui5.click({",
      "  controlType: '${1:sap.m.Button}',",
      "  properties: { text: '$2' },",
      "});"
    ],
    "description": "UI5 click action"
  },
  "UI5 Fill": {
    "prefix": "pfill",
    "scope": "typescript",
    "body": [
      "await ui5.fill(",
      "  { controlType: '${1:sap.m.Input}', id: /${2:fieldId}/ },",
      "  '${3:value}'",
      ");"
    ],
    "description": "UI5 fill input"
  }
}
```

## JetBrains IDEs (WebStorm/IntelliJ)

### Playwright Plugin

1. Go to **Settings > Plugins > Marketplace**
2. Search for "Playwright" and install
3. Restart the IDE

### Run Configuration

1. Go to **Run > Edit Configurations**
2. Add **Node.js** configuration:
   - **Node interpreter**: Project's Node.js
   - **JavaScript file**: `node_modules/.bin/playwright`
   - **Application parameters**: `test tests/my-test.spec.ts --headed --workers=1`
   - **Environment variables**: `PWDEBUG=1;SAP_BASE_URL=...`

### TypeScript Path Aliases

JetBrains IDEs resolve `tsconfig.json` paths automatically. No additional configuration needed.

## Common Troubleshooting

| Problem                                | Solution                                                          |
| -------------------------------------- | ----------------------------------------------------------------- |
| ESLint not finding config              | Set `eslint.workingDirectories` in VS Code settings               |
| Path aliases not resolving             | Verify `tsconfig.json` is in the project root                     |
| Playwright extension not finding tests | Set `playwright.testMatch` pattern in settings                    |
| Debugger not hitting breakpoints       | Use `--workers=1` to disable parallelism                          |
| TypeScript errors in node_modules      | Add `"skipLibCheck": true` to tsconfig                            |
| Slow IntelliSense                      | Exclude `node_modules`, `dist`, `test-results` in `tsconfig.json` |
