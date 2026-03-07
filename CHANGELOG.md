# Changelog

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
