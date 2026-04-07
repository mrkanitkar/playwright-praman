# Changelog

## [2.0.0](https://github.com/mrkanitkar/playwright-praman/compare/v1.1.2...v2.0.0) (2026-04-07)


### ⚠ BREAKING CHANGES

* **deps:** Minimum Node.js version raised from 20 to 22

### Features

* add extension system, matcher registry, and fix lint errors ([64903fb](https://github.com/mrkanitkar/playwright-praman/commit/64903fb02d5797771d3bec128380d77efdae45a2))
* **api:** export Space navigation and WorkZone manager from root ([2410866](https://github.com/mrkanitkar/playwright-praman/commit/241086655a1b19938891aeab6a423e699b4ac7b1))
* **ci:** add Playwright canary (next) to integration matrix ([afe0bb6](https://github.com/mrkanitkar/playwright-praman/commit/afe0bb650b390dda23f392bb6d61948c67468deb))
* **ci:** add TS 5.9/6.0 compat matrix and build fixes ([c05deab](https://github.com/mrkanitkar/playwright-praman/commit/c05deab112b65c899e2fe8e82b7ff91967f9fe18))
* **cli,docs:** remove inspect, safe uninstall, 61→199 ([7ec473b](https://github.com/mrkanitkar/playwright-praman/commit/7ec473b8b07982b5925c33c6386a5ab95da878b4))
* **cli:** add 'config' command to display resolved configuration ([4beafd7](https://github.com/mrkanitkar/playwright-praman/commit/4beafd7dfacceb66f7ea98e6d2c60e7b66d4b9d9))
* **cli:** add init-agents command for lightweight ide-specific agent installation ([6519f28](https://github.com/mrkanitkar/playwright-praman/commit/6519f288638d6f28eff21dc6fbb3d979ce102a19))
* **cli:** add Playwright CLI support as token-efficient alternative to MCP ([33ebae0](https://github.com/mrkanitkar/playwright-praman/commit/33ebae07f8453611b9f02dbb10e1a45e6745c0c9))
* **cli:** implement interactive inspect command ([9bfbeb8](https://github.com/mrkanitkar/playwright-praman/commit/9bfbeb8ed7d6439c7d8f320485953677f633b89b))
* **cli:** implement Playwright CLI integration for SAP UI5 test automation ([d2b8582](https://github.com/mrkanitkar/playwright-praman/commit/d2b85823c378060fcc15e20072c2170407826783))
* **cli:** install CLI agents by default; add MCP vs CLI to README and website ([f35f1f8](https://github.com/mrkanitkar/playwright-praman/commit/f35f1f870e26d420b26dc5555d4f0bdb736f6dc3))
* **config:** add nested env var support for auth, ai, telemetry, odataTracing ([cbb67a4](https://github.com/mrkanitkar/playwright-praman/commit/cbb67a4e350ca5c3a5fee337134678ae5bc22250))
* **deps:** raise minimum Node.js to 22, drop EOL Node 20 ([87aeba9](https://github.com/mrkanitkar/playwright-praman/commit/87aeba98b6989d4c5369fa02e093fe4df6a08b4c))
* **deps:** upgrade Playwright to 1.59.0, add feature flags ([295e984](https://github.com/mrkanitkar/playwright-praman/commit/295e9840569da71e83c496ddeab287363fc37741))
* **deps:** upgrade TypeScript 5.9.3 → 6.0.2 ([f6204bd](https://github.com/mrkanitkar/playwright-praman/commit/f6204bd3249d96d0979b2f746a2ba9ffa132f9e7))
* **docs,ci:** add SAP test automation comparison blog + fix lint/build compliance ([2dc7832](https://github.com/mrkanitkar/playwright-praman/commit/2dc78321ad83f391ef95b22e12bff93253d90cfa))
* **docs:** add IndexNow key for Bing/Yandex/DuckDuckGo instant indexing ([53175ab](https://github.com/mrkanitkar/playwright-praman/commit/53175ab3c720693e7ca038b4e8f107fedf0b7b79))
* **docs:** add SEO meta tags, social card, sitemap priorities, and persistent H1 ([df73079](https://github.com/mrkanitkar/playwright-praman/commit/df730795f084e3b0a6093e31a8e7e729745013cf))
* **docs:** seo overhaul for api descriptions, keywords, competitive positioning ([f24593c](https://github.com/mrkanitkar/playwright-praman/commit/f24593c09a9d07618afc46731bed0ae644488e0b))
* dx audit — 19 developer experience improvements (F-01–F-19) ([64d68c0](https://github.com/mrkanitkar/playwright-praman/commit/64d68c03b87d172d642bdc195affddaa94790e54))
* enhance npm discoverability and readme for growth ([2f67ad6](https://github.com/mrkanitkar/playwright-praman/commit/2f67ad66b6825db520ef0df7bd7c2c360fadf44c))
* **errors:** add docs url to error messages, json, and ai context ([0754979](https://github.com/mrkanitkar/playwright-praman/commit/0754979c9943914c0f01727dda68af26e21d6a94))
* **selectors:** add :not(), :labeled(), positional and sibling selectors ([dc5961d](https://github.com/mrkanitkar/playwright-praman/commit/dc5961d04fa13e43a16deb1822b7d4f203b9d1e6))
* **selectors:** unify UI5 selector engine with fontoxpath + css-selector-parser ([4b3fda8](https://github.com/mrkanitkar/playwright-praman/commit/4b3fda8a9dfa536f57ed8e35063060dd2eb5b1e5))


### Bug Fixes

* **bridge:** add v8 ignore for browser-context functions in opa5-strategy ([#77](https://github.com/mrkanitkar/playwright-praman/issues/77)) ([5ba7c34](https://github.com/mrkanitkar/playwright-praman/commit/5ba7c34e08cd663e1d925d67aaaf36de54673eb9))
* **bridge:** implement searchOpenDialogs priority and add FLP Space Tab navigation ([7d2dfd8](https://github.com/mrkanitkar/playwright-praman/commit/7d2dfd8de7e35a46737def05a04f816465c36d60))
* **ci:** add @playwright/cli to knip ignoreDependencies ([67664b0](https://github.com/mrkanitkar/playwright-praman/commit/67664b0e3e2906ae8ae30c8a3e18bbc4f70bb993))
* **ci:** add CSpell check to pre-push hook ([5b85a35](https://github.com/mrkanitkar/playwright-praman/commit/5b85a35ad28c9bb875986ba41b2fa5cb7d1402ef))
* **ci:** add generated report/planning docs to markdownlint ignore ([1eaf3b5](https://github.com/mrkanitkar/playwright-praman/commit/1eaf3b5981ac4120adc1d193b8c2f3da9aae454f))
* **ci:** add missing commit scopes (deps, release, adapter) ([0c202aa](https://github.com/mrkanitkar/playwright-praman/commit/0c202aaec57cbf433244b1032c94105b7753455c))
* **ci:** add missing words to CSpell dictionary ([6cfdb73](https://github.com/mrkanitkar/playwright-praman/commit/6cfdb7365172f83b077f459b894038c8121621b9))
* **ci:** add preuninstall to cspell dictionary ([9793e11](https://github.com/mrkanitkar/playwright-praman/commit/9793e1126621282c856a9e38607788e55b75521f))
* **ci:** add specs/ to eslint ignores, move gold-standard spec ([071870b](https://github.com/mrkanitkar/playwright-praman/commit/071870bf902edd3333f0f1f6b87304a24486f128))
* **ci:** handle corrupted npm on macOS ARM64 runners ([b03ab59](https://github.com/mrkanitkar/playwright-praman/commit/b03ab59c90abdb0bcd6f62b0997c3f8111755d97))
* **ci:** regenerate lockfile and fix docs broken links ([9114f77](https://github.com/mrkanitkar/playwright-praman/commit/9114f77fcc28189677bb3cc526318f8ce49112c1))
* **ci:** regenerate lockfile for strict npm ci on Node.js 24 ([a5af8b1](https://github.com/mrkanitkar/playwright-praman/commit/a5af8b1982f4462b78a1378dc644a803f53aa017))
* **ci:** remove export validation from ts-compat job ([9f1643d](https://github.com/mrkanitkar/playwright-praman/commit/9f1643df6ef4c74e80b5464a538a118a7dadb8d1))
* **ci:** resolve knip unused export warnings ([9500766](https://github.com/mrkanitkar/playwright-praman/commit/9500766005a51f59d76a90c731b756f00f729b70))
* **ci:** skip azure playwright job when secret not configured ([d6c4154](https://github.com/mrkanitkar/playwright-praman/commit/d6c41541cf981c774201b5af47ad883ed9c6dc85))
* **ci:** skip DTS in ts-compat job for TS 5.9 ([bcf2b5e](https://github.com/mrkanitkar/playwright-praman/commit/bcf2b5e7dbae4b227049566c3beb7c6478bc9c37))
* **cli:** add iife wrappers, unexport cleanEmptyDirs, remove unused logger fns ([b4b03fe](https://github.com/mrkanitkar/playwright-praman/commit/b4b03fea6899d11639dc037fea799f8b7d6d5bb7))
* **cli:** fix mock-filesystem readdir for Windows path separators ([3066ffd](https://github.com/mrkanitkar/playwright-praman/commit/3066ffdb2bbd9743ecf956c8afc56c2ce4135a91))
* **cli:** fix playwright-cli integration — config, build, and docs ([bc026be](https://github.com/mrkanitkar/playwright-praman/commit/bc026be9ebe0e3e32c5659f7f99452023d66fdcb))
* **cli:** pass cli flag to scaffoldIDEFiles in new project path ([277ade8](https://github.com/mrkanitkar/playwright-praman/commit/277ade89a4cd42eddc3f478995141df21d30f9d0))
* **cli:** remove logRaw and logDivider from test mocks ([ae2e37f](https://github.com/mrkanitkar/playwright-praman/commit/ae2e37f45a32df91179c47fe9d7dbe9137b3f392))
* **cli:** remove redundant package install step from init command ([709139c](https://github.com/mrkanitkar/playwright-praman/commit/709139cc3b70af6048614de8c5fb204a04a03a65))
* **cli:** remove unused export on runEslintCheck (knip) ([6b1c0ea](https://github.com/mrkanitkar/playwright-praman/commit/6b1c0ea126b66a30130cc52a6d764629d702463a))
* **config:** add screencast to cspell dictionary ([0083b9b](https://github.com/mrkanitkar/playwright-praman/commit/0083b9b6bea9651a26a4b912b69cca4e0ec4adc4))
* **core:** resolve lint errors in control-tree tests ([79040a1](https://github.com/mrkanitkar/playwright-praman/commit/79040a1e9258026354ca1b9918a3773985cf3849))
* **cspell:** add pwtest and British serialise variants to project dictionary ([3cf74a0](https://github.com/mrkanitkar/playwright-praman/commit/3cf74a0d64031bd2f251cb97e11a6416fa460784))
* **deps:** resolve all npm audit vulnerabilities (0 remaining) ([1df96dc](https://github.com/mrkanitkar/playwright-praman/commit/1df96dc8d7dbca1c212894b4ce613e6f238e9aa4))
* **deps:** resolve docs vulnerabilities (0 remaining) ([f2a0f70](https://github.com/mrkanitkar/playwright-praman/commit/f2a0f70bd3733d7323b017cba3794cc626de97fd))
* **docs:** add lastmod to all sitemap urls including typedoc api pages ([f8c113a](https://github.com/mrkanitkar/playwright-praman/commit/f8c113a393c0f5e6700118d5bfcb9afca962283d))
* **docs:** add Playwright-Praman to page titles for SEO ([a1100c8](https://github.com/mrkanitkar/playwright-praman/commit/a1100c8fe5e9c36a28834383339f6206460505a0))
* **docs:** mobile nav menu hidden by backdrop-filter containing block ([3b8e185](https://github.com/mrkanitkar/playwright-praman/commit/3b8e18577f0600963dac2c55fe9fedab634028ad))
* **docs:** navbar logo clipping and menu overflow ([06463ea](https://github.com/mrkanitkar/playwright-praman/commit/06463ea432e7f51bf03e3058bb8c1bd2e2ed49b8))
* **docs:** remove duplicate h1 tag from carousel slide 1 ([b20b063](https://github.com/mrkanitkar/playwright-praman/commit/b20b06387e74ed9c0b946b88f7ef27e08d6f6023))
* **docs:** replace placeholder logo with Praman verification seal ([ae142bf](https://github.com/mrkanitkar/playwright-praman/commit/ae142bfb4f6867ff4bde6e1108d2710de9adb7fc))
* **docs:** resolve 3 agent audit warnings (W-1, W-2, W-3) ([db2ceac](https://github.com/mrkanitkar/playwright-praman/commit/db2ceac0dc520de04f7b5006aa01e267100dea37))
* **docs:** simplify landing page h1 and tagline, fix &amp; encoding in jsx ([ddfa98f](https://github.com/mrkanitkar/playwright-praman/commit/ddfa98fc3181c64437eb07736c47a575f0f1d97b))
* **docs:** sitemap priority tuning — demote legal pages, promote demo ([aba7174](https://github.com/mrkanitkar/playwright-praman/commit/aba717479fffb024c3320048536249d63f78e97d))
* **docs:** standardize messaging across all pages ([994942e](https://github.com/mrkanitkar/playwright-praman/commit/994942eb884e633bbd32eba953a0c0ef8894b332))
* **docs:** update title and description for docs, personas, demo, migration pages ([a2ffecd](https://github.com/mrkanitkar/playwright-praman/commit/a2ffecd0b62d7813186bf5fcd2245b59f5029bb0))
* remove 17 `as never` casts via interface return type fixes ([5071573](https://github.com/mrkanitkar/playwright-praman/commit/5071573f09a94b7e9e8d726446263c36ecf99cab))
* replace 5 `as never` casts with BridgeInjectablePage interface ([f2e63ef](https://github.com/mrkanitkar/playwright-praman/commit/f2e63efc816499a28691f4faf241898b6ab6eef1))
* resolve OData exactOptionalPropertyTypes incompatibility ([b5dee52](https://github.com/mrkanitkar/playwright-praman/commit/b5dee526496de5495e28ff76228f1e7c0f449581))
* **selectors:** fix ui5:property() type fidelity, error surfacing, and tree builder gaps ([7eaebeb](https://github.com/mrkanitkar/playwright-praman/commit/7eaebeb2cf481b75de7ee8981ccde751dfd4f9ef))
* **selectors:** preserve array types, align area node name, handle negative nth-child ([737dafd](https://github.com/mrkanitkar/playwright-praman/commit/737dafd020c55cd3737ed0b2c166f8f770412d2e))
* **test:** increase scaffolder test timeout for Windows CI ([#78](https://github.com/mrkanitkar/playwright-praman/issues/78)) ([4160640](https://github.com/mrkanitkar/playwright-praman/commit/41606406d5cef5647b2fdf3c07176c1f7b660191))
* **test:** update config test to match simplified CLI template ([b786342](https://github.com/mrkanitkar/playwright-praman/commit/b7863420338b6f8e23eaac40a40f03ca10652cd1))

## [1.2.0] (2026-04-01)

### Features

* **deps:** upgrade Playwright to 1.59.0, add feature flags for screencast, ariaSnapshotDepth, setStorageState, locatorNormalize, urlPatternMatcher ([295e984](https://github.com/mrkanitkar/playwright-praman/commit/295e984))
* **deps:** upgrade TypeScript 5.9.3 → 6.0.2, add TS 5.9/6.0 compat CI matrix ([f6204bd](https://github.com/mrkanitkar/playwright-praman/commit/f6204bd))
* **deps:** raise minimum Node.js to 22, drop EOL Node 20 ([87aeba9](https://github.com/mrkanitkar/playwright-praman/commit/87aeba9))
* **selectors:** unify UI5 selector engine with fontoxpath + css-selector-parser ([4b3fda8](https://github.com/mrkanitkar/playwright-praman/commit/4b3fda8))
* **selectors:** add :not(), :labeled(), positional and sibling selectors ([dc5961d](https://github.com/mrkanitkar/playwright-praman/commit/dc5961d))
* **cli:** implement interactive inspect command ([9bfbeb8](https://github.com/mrkanitkar/playwright-praman/commit/9bfbeb8))
* **cli:** add 'config' command to display resolved configuration ([4beafd7](https://github.com/mrkanitkar/playwright-praman/commit/4beafd7))
* **cli:** add init-agents command for lightweight IDE-specific agent installation ([6519f28](https://github.com/mrkanitkar/playwright-praman/commit/6519f28))
* **cli:** install Playwright CLI agents by default; add --no-cli opt-out for init and init-agents
* **cli:** auto-install @playwright/test, @playwright/cli, dotenv when missing during init
* **config:** add nested env var support for auth, ai, telemetry, odataTracing ([cbb67a4](https://github.com/mrkanitkar/playwright-praman/commit/cbb67a4))
* **errors:** add docs url to error messages, JSON, and AI context ([0754979](https://github.com/mrkanitkar/playwright-praman/commit/0754979))
* **core:** add extension system and matcher registry ([64903fb](https://github.com/mrkanitkar/playwright-praman/commit/64903fb))
* **ci:** add Playwright canary (next) to integration matrix ([afe0bb6](https://github.com/mrkanitkar/playwright-praman/commit/afe0bb6))

### Bug Fixes

* **deps:** resolve all npm audit vulnerabilities (0 remaining) ([1df96dc](https://github.com/mrkanitkar/playwright-praman/commit/1df96dc))
* **deps:** resolve docs vulnerabilities (0 remaining) ([f2a0f70](https://github.com/mrkanitkar/playwright-praman/commit/f2a0f70))
* **selectors:** preserve array types, align area node name, handle negative nth-child ([737dafd](https://github.com/mrkanitkar/playwright-praman/commit/737dafd))
* **selectors:** fix ui5:property() type fidelity, error surfacing, and tree builder gaps ([7eaebeb](https://github.com/mrkanitkar/playwright-praman/commit/7eaebeb))
* **ci:** add missing commit scopes (deps, release, adapter) ([0c202aa](https://github.com/mrkanitkar/playwright-praman/commit/0c202aa))
* **ci:** handle corrupted npm on macOS ARM64 runners ([87aeba9](https://github.com/mrkanitkar/playwright-praman/commit/87aeba9))
* **docs:** fix documentation accuracy — eliminate fictional APIs across 42 files ([973a779](https://github.com/mrkanitkar/playwright-praman/commit/973a779))

### Breaking Changes

* `enableXpathEngine` config field removed — unified engine replaces it automatically
* Minimum Node.js raised from 20 → 22 (Node 20 is EOL)

## [1.1.2](https://github.com/mrkanitkar/playwright-praman/compare/v1.1.1...v1.1.2) (2026-03-07)


### Bug Fixes

* **build:** disable chunk splitting to resolve Socket.dev obfuscation alert ([bdbc93e](https://github.com/mrkanitkar/playwright-praman/commit/bdbc93e30e68f875367a14d5f8d98f8c908b7d90))

## [1.1.1](https://github.com/mrkanitkar/playwright-praman/compare/v1.1.0...v1.1.1) (2026-03-07)


### Features

* **docs:** simplify onboarding to 2 commands, elevate AI agent pipeline ([c325010](https://github.com/mrkanitkar/playwright-praman/commit/c3250109cf8221b95b094c4d7681094ca46d3e0c))
* **prompts:** add prompt factory with two SAP prompts and disclaimers ([92e3c68](https://github.com/mrkanitkar/playwright-praman/commit/92e3c68b6c12c2cdfc8d6a85a9886f8bf1c57671))


### Bug Fixes

* **ci:** add SAP domain words to cspell dictionary ([9089051](https://github.com/mrkanitkar/playwright-praman/commit/9089051f516a02e7461faa9488048a6fe19df476))
* **ci:** inline upload-pages-artifact for SHA-pinning compliance ([68b89b5](https://github.com/mrkanitkar/playwright-praman/commit/68b89b588799ce51cef9bd27ec507bcd940df513))

## [1.1.0](https://github.com/mrkanitkar/playwright-praman/compare/v1.0.4...v1.1.0) (2026-03-07)


### Features

* **docs:** add SEO badges, keywords, FAQ schema, config ([5fc93bb](https://github.com/mrkanitkar/playwright-praman/commit/5fc93bbbc708f92b1e4254944fe4aecb794b7c3c))


### Bug Fixes

* **docs:** resolve Bing SEO scan issues and update footer copyright ([c831ac3](https://github.com/mrkanitkar/playwright-praman/commit/c831ac3e5151da95eba0222d601f5c4e4e2ef62b))
* **docs:** revert manual version bump, let release-please manage ([8d47917](https://github.com/mrkanitkar/playwright-praman/commit/8d47917b4ad5707d5411a932c9b2fb2004deab8e))

## [1.0.4](https://github.com/mrkanitkar/playwright-praman/compare/v1.0.3...v1.0.4) (2026-03-07)


### Bug Fixes

* **ci:** ignore auto-generated CHANGELOG.md in markdownlint ([a65c1b9](https://github.com/mrkanitkar/playwright-praman/commit/a65c1b994e34ee05bec8279e552ba0c2be505163))
* **security:** harden regex anchoring, XSS escaping, and hostname checks ([3c1cbe9](https://github.com/mrkanitkar/playwright-praman/commit/3c1cbe95f22c4d03a5b5326d36db41ee1850e322))

## [1.0.3](https://github.com/mrkanitkar/playwright-praman/compare/v1.0.2...v1.0.3) (2026-03-07)


### Bug Fixes

* **ci:** auto-increment canary alpha version from npm ([c8f3dc2](https://github.com/mrkanitkar/playwright-praman/commit/c8f3dc2216cf539c4a2be0f4d6a3e8a3ea3b3448))
* **ci:** disable FORCE_COLOR for canary version stamp ([71e307e](https://github.com/mrkanitkar/playwright-praman/commit/71e307eb2d7bde18cca16f44f40865648204bfbb))

## [1.0.1] - 2026-02-23

### Added

- LICENSE copyright holder updated
- NOTICE file for Apache 2.0 attribution
- SECURITY.md vulnerability disclosure policy
- Package metadata improvements (author, files)

## 1.0.0 (2026-02-16)

### Breaking Changes

- Build output now includes CJS alongside ESM

### Features

- **eslint:** add comprehensive best practices configuration ([ea794d6](https://github.com/mrkanitkar/playwright-praman/commit/ea794d6809e9b4b9aec8bc22d58d1da6901b5573))
- multi-OS, multi-IDE, dual ESM+CJS build, AI agents support ([860d52c](https://github.com/mrkanitkar/playwright-praman/commit/860d52c4cad11c2a227c2254920f1a23625beed5))

### Bug Fixes

- **ci:** add docs-check job, security eslint, sbom step, fix defineConfig export ([8d8a74c](https://github.com/mrkanitkar/playwright-praman/commit/8d8a74ca3f1177ab650e5686e19835a0c7cb4df3))
- **ci:** resolve all GitHub Actions workflow failures ([5c3f212](https://github.com/mrkanitkar/playwright-praman/commit/5c3f21237b8ef61ceb3f8a509c7e0d64b0556d60))
- **ci:** set coverage thresholds to 0% for initial release ([5b35d37](https://github.com/mrkanitkar/playwright-praman/commit/5b35d37afb05fe78c2f79f6938acc6d56c1e8072))
- **ci:** update husky hooks to use tsx instead of deleted bash script ([bee1620](https://github.com/mrkanitkar/playwright-praman/commit/bee1620afe278317b6d1a52fe937a199f78ec3e6))

## Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Automated via [release-please](https://github.com/googleapis/release-please) from Conventional Commits.
