# SAP Authentication via CLI

## Table of Contents

1. [Login Flow](#login-flow)
2. [Post-Login Verification](#post-login-verification)
3. [Save Auth State](#save-auth-state)
4. [Restore Auth State](#restore-auth-state)
5. [Multi-System Sessions](#multi-system-sessions)
6. [Environment Variables](#environment-variables)
7. [Session Persistence](#session-persistence)
8. [Security Notes](#security-notes)

---

## Login Flow

SAP login forms are standard HTML (NOT UI5 controls). Use Playwright native
selectors to interact with them.

**Step 1**: Snapshot the login page to identify form elements.

```bash
playwright-cli -s=sap navigate https://erp.mycompany.com/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html
playwright-cli -s=sap snapshot --filename=login.yml
```

**Step 2**: Identify the login form elements from the snapshot. Typical SAP
login forms have:

- `e1` — Username input field
- `e2` — Password input field
- `e3` — Login/Submit button

**Step 3**: Fill credentials and submit.

```bash
playwright-cli -s=sap fill e1 "$SAP_USER"
playwright-cli -s=sap fill e2 "$SAP_PASS"
playwright-cli -s=sap click e3
```

> **NOTE**: Login form element references (`e1`, `e2`, `e3`) come from the
> snapshot output. Always snapshot first to confirm the correct element
> references for your system. Different SAP deployments may have different
> login page layouts.

---

## Post-Login Verification

After clicking the login button, wait for:

1. **Redirect to FLP** (login page disappears, FLP shell loads).
2. **UI5 runtime load** (SAP UI5 library initializes).
3. **Bridge ready** (Praman bridge discovers UI5 and registers adapters).

**Combined wait pattern**:

```bash
playwright-cli -s=sap run-code "async page => {
  await page.waitForFunction(
    '!!(window.__praman_bridge && window.__praman_bridge.ready)',
    { timeout: 300000 }
  );
  return 'Logged in. UI5 v' + await page.evaluate(() => sap.ui.version);
}"
```

The 300-second timeout accounts for slow SAP systems. Initial login on cold
systems can take 1-3 minutes due to UI5 bootstrap, FLP catalog loading, and
personalization sync.

---

## Save Auth State

Once logged in, save the browser session (cookies, localStorage, sessionStorage)
to a JSON file for reuse:

```bash
playwright-cli -s=sap state-save sap-auth.json
```

This writes the full browser storage state to `sap-auth.json`. The file contains:

- All cookies (including SAP session cookies like `sap-usercontext`, `MYSAPSSO2`).
- localStorage entries (FLP personalization, theme preferences).
- sessionStorage entries.

---

## Restore Auth State

Skip the login flow entirely by loading a previously saved auth state:

```bash
playwright-cli -s=sap state-load sap-auth.json
playwright-cli -s=sap navigate https://erp.mycompany.com/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html
```

After loading state, navigate to the FLP URL. The browser will use the restored
session cookies and skip the login page.

**Verify the session is still valid**:

```bash
playwright-cli -s=sap run-code "async page => {
  await page.waitForFunction(
    '!!(window.__praman_bridge && window.__praman_bridge.ready)',
    { timeout: 300000 }
  );
  return 'Session restored. UI5 v' + await page.evaluate(() => sap.ui.version);
}"
```

> **NOTE**: SAP sessions expire. If `state-load` followed by navigation lands
> on the login page, the session has expired. Re-run the login flow and save
> a fresh state file.

---

## Multi-System Sessions

Use different session names (`-s` flag) to maintain parallel sessions for
multiple SAP systems:

```bash
# Development system
playwright-cli -s=dev navigate https://dev.mycompany.com/sap/bc/ui2/flp
playwright-cli -s=dev fill e1 "$SAP_USER_DEV"
playwright-cli -s=dev fill e2 "$SAP_PASS_DEV"
playwright-cli -s=dev click e3
playwright-cli -s=dev state-save dev-auth.json

# Quality system
playwright-cli -s=qa navigate https://qa.mycompany.com/sap/bc/ui2/flp
playwright-cli -s=qa fill e1 "$SAP_USER_QA"
playwright-cli -s=qa fill e2 "$SAP_PASS_QA"
playwright-cli -s=qa click e3
playwright-cli -s=qa state-save qa-auth.json

# Production system (read-only testing)
playwright-cli -s=prod navigate https://prod.mycompany.com/sap/bc/ui2/flp
playwright-cli -s=prod fill e1 "$SAP_USER_PROD"
playwright-cli -s=prod fill e2 "$SAP_PASS_PROD"
playwright-cli -s=prod click e3
playwright-cli -s=prod state-save prod-auth.json
```

Each session name (`-s=dev`, `-s=qa`, `-s=prod`) maintains an independent
browser instance with its own cookies and storage.

**Restoring a specific system**:

```bash
playwright-cli -s=dev state-load dev-auth.json
playwright-cli -s=dev navigate https://dev.mycompany.com/sap/bc/ui2/flp
```

---

## Environment Variables

Store credentials in environment variables. Never hardcode them in scripts.

**Recommended variable naming**:

```bash
# Single system
export SAP_USER="TESTUSER"
export SAP_PASS="SecretPassword123"

# Multi-system
export SAP_USER_DEV="DEV_TESTUSER"
export SAP_PASS_DEV="DevPassword123"
export SAP_USER_QA="QA_TESTUSER"
export SAP_PASS_QA="QaPassword123"
export SAP_USER_PROD="PROD_READONLY"
export SAP_PASS_PROD="ProdPassword123"
```

**Usage in CLI commands**:

```bash
playwright-cli -s=sap fill e1 "$SAP_USER"
playwright-cli -s=sap fill e2 "$SAP_PASS"
```

For agent workflows, set these in the shell environment or in a `.env` file
that is loaded before the CLI session starts. Never include `.env` files in
version control.

---

## Session Persistence

Use the `--persistent` flag to keep the browser profile on disk across CLI
invocations. Without this flag, each session uses a temporary profile that is
discarded when the session ends.

```bash
playwright-cli -s=sap --persistent navigate https://erp.mycompany.com/sap/bc/ui2/flp
```

**Benefits of persistent sessions**:

- Browser profile (cookies, cache, localStorage) survives CLI restarts.
- Faster subsequent loads due to cached resources (UI5 libraries, FLP config).
- No need to `state-load` on every CLI invocation.

**When to use**:

- Interactive exploration sessions where you start/stop the CLI frequently.
- Long-running agent workflows that may be interrupted.

**When NOT to use**:

- CI pipelines (use `state-save`/`state-load` for reproducibility).
- Parallel test execution (persistent profiles can conflict).

---

## Security Notes

**Never commit auth state files to version control.**

Add to `.gitignore`:

```text
# SAP auth state files
*-auth.json
sap-auth.json
.auth/
```

**Additional precautions**:

- Auth state files contain session cookies that grant full access to SAP systems.
  Treat them like passwords.
- Rotate SAP test user passwords regularly.
- Use dedicated test users with minimal authorizations (principle of least privilege).
- Use different test users per environment (dev, QA, prod).
- In CI pipelines, use secrets management (GitHub Actions secrets, Azure Key Vault,
  etc.) for credentials. Never store them in pipeline config files.
- Auth state files have a limited lifespan. SAP sessions typically expire after
  30-60 minutes of inactivity or after a server-configured maximum duration.

> **WARNING**: `console.log()` inside `run-code` is silently swallowed. Always
> use `return` to produce output from `run-code` commands.

> **WARNING**: When using `snapshot` in agent workflows, always use the
> `--filename` flag (e.g., `snapshot --filename=login.yml`) to get a file
> reference (~200 tokens) instead of inlined YAML.
