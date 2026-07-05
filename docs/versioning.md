# Versioning Policy

playwright-praman follows [Semantic Versioning 2.0.0](https://semver.org/).

## From v1.3.4 onward

- **Patch** (1.3.x): bug fixes, documentation, internal refactors — no user-visible behavior changes.
- **Minor** (1.x.0): new features, new config options, new fixtures — backwards-compatible.
- **Major** (x.0.0): breaking changes — removed APIs, changed defaults, raised engine floors.

Breaking changes are enforced by [release-please](https://github.com/googleapis/release-please):
any commit with a `!` suffix or `BREAKING CHANGE:` footer triggers a major version bump.

## Node.js support

We support **Active LTS and later**. When a Node.js version reaches end-of-life,
we raise the engine floor in the next minor or major release with a changelog entry.

| Node version | Status                   | Praman support               |
| ------------ | ------------------------ | ---------------------------- |
| 22.x         | Active LTS               | ✅ Supported (current floor) |
| 24.x         | Current                  | ✅ Supported                 |
| 20.x         | End-of-life (2026-04-30) | ❌ Dropped in v1.3.3         |

## Historical note (v1.3.3)

v1.3.3 shipped two breaking changes (Node 20→22 floor, CJS output addition) that were
changelog'd under the unpublished v1.3.2 and reached npm as a patch bump. This was a
process error in the release-please bootstrap migration. From v1.3.4 onward, the semver
contract above is enforced by tooling and CI.

## Release override: v1.3.4

v1.3.4 includes a `feat:` commit (failure attachments) that would naturally produce v1.4.0.
The maintainer used `release-as: 1.3.4` to override the version number. This is a one-time
override documented here for transparency. The changelog content is honest — the feature is
listed under Features.
