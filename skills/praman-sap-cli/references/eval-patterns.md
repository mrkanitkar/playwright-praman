# eval Patterns Quick Reference

Quick reference for `eval` command with correct function wrapper syntax.

---

## CRITICAL: Function Wrapper Required

`eval` requires a function wrapper `() => expr`. Bare expressions fail silently.

```bash
# ✅ CORRECT
playwright-cli eval "() => window.__praman_bridge?.ready"

# ❌ WRONG — fails silently
playwright-cli eval "window.__praman_bridge?.ready"
```

---

## Common eval Patterns

### Bridge Ready

```bash
playwright-cli -s=sap eval "() => window.__praman_bridge?.ready === true"
```

### UI5 Version

```bash
playwright-cli -s=sap eval "() => typeof sap !== 'undefined' ? sap.ui.version : 'UI5 not loaded'"
```

### Page Title

```bash
playwright-cli -s=sap eval "() => document.title"
```

### Current Hash

```bash
playwright-cli -s=sap eval "() => window.location.hash"
```

### Control Count

```bash
playwright-cli -s=sap eval "() => Object.keys(sap.ui.core.ElementRegistry.all()).length"
```

### BusyIndicator Status

```bash
playwright-cli -s=sap eval "() => sap.ui.core.BusyIndicator ? sap.ui.core.BusyIndicator.isActive() : false"
```

### Check Specific Control Exists

```bash
playwright-cli -s=sap eval "() => sap.ui.getCore().byId('myControlId') !== null"
```

### Get Control Value

```bash
playwright-cli -s=sap eval "() => { const c = sap.ui.getCore().byId('myInput'); return c ? c.getValue() : 'not found'; }"
```

---

## When to Use eval vs run-code

| Scenario | Use |
|----------|-----|
| Single expression check | `eval` |
| Read one property | `eval` |
| Multi-step operation | `run-code` |
| Page.evaluate with parameters | `run-code` |
| Async operations | `run-code` |
| Complex control discovery | `run-code` (or pre-built script) |
