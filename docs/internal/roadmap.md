# Future Work Roadmap

Items explicitly deferred from the 2026-06-10 improvement programme (spec §9).

## Near-term (next minor/major)

- **Extension registries:** Open auth-strategy and interaction-strategy factories as public
  extension points. "Bring your own auth strategy" is the #1 enterprise SAP ask.
- **CI PR-title guard:** commitlint or similar check on PR titles to prevent non-conventional
  merge commits from reaching the changelog.
- **Remaining `src/cli` coverage:** Files beyond ide-installer/uninstall/preuninstall (currently
  excluded from coverage) — doctor.ts, init.ts, scaffolder.ts, etc.

## Medium-term (2.0 planning)

- **UI5 2.x facade:** Centralize the 5 deprecated UI5 global call sites behind a version-detecting
  facade. Re-enable `praman/no-deprecated-ui5-globals: error` in the main lint gate.
- **CJS sunset:** Deprecate CJS output in docs, plan removal for 2.0.
- **Standalone-API demotion:** Move standalone functions (`getTableRows(page, ...)`) to a
  `/standalone` subpath to reduce main entry surface.
- **Monorepo evaluation:** Consider splitting `ai`/`reporters`/`cli` into separate packages
  with `playwright-praman` as the slim core.

## Not planned

- Deprecation warnings in 1.x (D2: explicit maintainer decision).
- UI5 2.x public testing matrix (blocked: no public UI5 2.x Fiori sandbox available).
