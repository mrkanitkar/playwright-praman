# SEO Audit Report — Praman (playwright-praman)

**Audit Date:** 2026-03-07
**Site URL:** https://praman.dev (migrating from mrkanitkar.github.io/playwright-praman/)
**npm Package:** [playwright-praman](https://www.npmjs.com/package/playwright-praman)
**GitHub:** [mrkanitkar/playwright-praman](https://github.com/mrkanitkar/playwright-praman)

---

## Executive Summary

Praman has a **strong technical foundation** for SEO — JSON-LD structured data, comprehensive robots.txt with AI crawler allowlists, llms.txt standard compliance, and 70+ documentation pages. However, several **critical issues** are actively preventing indexing and ranking:

1. **Sitemap URLs point to the old domain** (`praman.zestest.in` instead of `mrkanitkar.github.io/playwright-praman`)
2. **Published npm homepage still points to old domain** — every npm visitor lands on a dead URL
3. **Social card image doesn't exist** — OpenGraph sharing shows a broken image
4. **95% of doc pages lack `description` frontmatter** — Google generates its own snippets (poorly)
5. **Google Search Console and Bing Webmaster Tools are not connected** — no indexing verification

---

## 1. Repository & Package Metadata

### 1.1 package.json

| Field         | Current Value                                                                  | Issue                                                                                                                       | Severity |
| ------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | -------- |
| `name`        | `playwright-praman`                                                            | Good — unique, searchable, includes "playwright"                                                                            | OK       |
| `description` | `AI-First SAP UI5 Test Automation Platform for Playwright`                     | Good but short (56 chars). Could use more keywords within 255 char limit                                                    | Medium   |
| `keywords`    | 25 keywords                                                                    | Good count but **published version only shows 8** — npm truncates. Many keywords use mixed case which npm normalizes anyway | High     |
| `homepage`    | `https://praman.zestest.in/` (published) — must update to `https://praman.dev` | **CRITICAL: Published npm package points to dead URL**                                                                      | Critical |
| `repository`  | Correct GitHub URL                                                             | OK                                                                                                                          | OK       |
| `bugs`        | Correct GitHub issues URL                                                      | OK                                                                                                                          | OK       |

**Published npm keywords** (only 8 visible on npmjs.com):
`playwright`, `sap`, `ui5`, `testing`, `automation`, `fiori`, `ai-first`, `enterprise`

**Local keywords** (25 — will take effect on next publish):
Includes SAP-specific terms like `SAP S/4HANA`, `Fiori Elements`, `SAP Cloud ALM`, etc.

**Missing high-value keywords:**

- `playwright-plugin` (what users search for)
- `sap-testing` (hyphenated form people search)
- `s4hana` (without slash — search-friendly)
- `odata` (major SAP protocol)
- `test-generation` (differentiator)
- `wdi5-alternative` (captures competitor traffic)

### 1.2 README.md

| Aspect                                    | Status                                              | Severity |
| ----------------------------------------- | --------------------------------------------------- | -------- |
| First paragraph contains primary keywords | Yes — "Playwright", "SAP S/4HANA", "AI agents"      | OK       |
| Badges (npm, CI, license, platform)       | Yes — 8 badges including Socket security            | OK       |
| Install command visible above fold        | Yes — Quick Start section                           | OK       |
| Heading hierarchy (single H1)             | Yes — `# playwright-praman`                         | OK       |
| Comparison table vs competitors           | Partial — FAQ mentions wdi5 but no comparison table | High     |
| "Getting Started" section                 | Yes — with install + init + verify                  | OK       |
| FAQ section                               | Yes — 5 questions with keyword-rich answers         | OK       |
| Internal links to docs site               | Yes — Documentation table with 10 links             | OK       |

**Missing from README:**

- Dedicated comparison table (praman vs wdi5 vs qmate vs playwright-sap)
- npm download badge (`shields.io/npm/dw/playwright-praman`)
- GitHub stars badge
- "Used by" or testimonials section
- Table of Contents for long README

### 1.3 GitHub Repository

| Signal               | Current                                           | Recommended                                 | Severity |
| -------------------- | ------------------------------------------------- | ------------------------------------------- | -------- |
| Description          | "AI-First SAP UI5 Test Automation for Playwright" | Good — contains key terms                   | OK       |
| Topics               | 20 topics (comprehensive)                         | Excellent — well-tagged                     | OK       |
| Website URL          | `https://mrkanitkar.github.io/playwright-praman/` | Correctly set                               | OK       |
| Stars                | 1                                                 | Needs growth strategy                       | High     |
| Forks                | 1                                                 | Needs growth strategy                       | High     |
| Discussions          | Enabled                                           | Good for community SEO signals              | OK       |
| Wiki                 | Disabled                                          | Consider enabling for supplementary content | Low      |
| CONTRIBUTING.md      | Exists                                            | Good for project health signals             | OK       |
| Issue templates      | 4 templates (bug, feature, question, regression)  | Excellent                                   | OK       |
| Discussion templates | 3 templates                                       | Excellent                                   | OK       |
| CODEOWNERS           | Exists                                            | Good                                        | OK       |
| FUNDING.yml          | Missing                                           | Consider for visibility                     | Low      |
| Release tags         | Unknown                                           | Should use semver releases                  | Medium   |

---

## 2. Documentation Site SEO Health

### 2.1 Technical SEO Fundamentals

| Check                 | Status                                                                           | Details                                                                              | Severity     |
| --------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------ |
| robots.txt            | Excellent                                                                        | Comprehensive AI crawler allowlist, sitemap reference                                | OK           |
| sitemap.xml           | **BROKEN**                                                                       | All URLs use `praman.zestest.in` instead of `mrkanitkar.github.io/playwright-praman` | **Critical** |
| Canonical URLs        | Auto-generated by Docusaurus                                                     | OK                                                                                   | OK           |
| `<title>` tags        | Present via Docusaurus                                                           | OK                                                                                   | OK           |
| `<meta description>`  | **Missing on 95%+ of pages** — only 2 guide pages have `description` frontmatter | **Critical**                                                                         |
| Google Search Console | **Not connected** — verification code is commented out in config                 | **Critical**                                                                         |
| Bing Webmaster Tools  | **Not connected** — verification code is commented out in config                 | **Critical**                                                                         |
| HTTPS                 | Yes — GitHub Pages enforces HTTPS                                                | OK                                                                                   |
| `noindex` tags        | None found — good                                                                | OK                                                                                   |

### 2.2 Sitemap Issue Details

The sitemap plugin generates URLs based on `docusaurus.config.ts` `url` + `baseUrl`. The current config:

```
url: 'https://mrkanitkar.github.io'
baseUrl: '/playwright-praman/'
```

But the **built** `sitemap.xml` contains `praman.zestest.in` URLs — this means the build was done before the domain migration. The sitemap needs to be **rebuilt and redeployed**.

### 2.3 Page-Level SEO

| Check                     | Status                                                   | Severity |
| ------------------------- | -------------------------------------------------------- | -------- |
| Frontmatter `title`       | Present on all guide pages                               | OK       |
| Frontmatter `description` | **Only 2 out of 50+ guide pages**                        | Critical |
| Frontmatter `keywords`    | **0 pages** have keywords frontmatter                    | High     |
| Heading hierarchy         | Correct — proper H1-H6 nesting                           | OK       |
| Image alt text            | SVGs use `aria-hidden="true"` (correct for decorative)   | OK       |
| Internal linking          | Good — sidebar + cross-references                        | OK       |
| OpenGraph meta            | Configured globally but **social card image is missing** | High     |
| Twitter Card              | Set to `summary_large_image`                             | OK       |

### 2.4 Social Card Image

The config references `img/praman-social-card.png` but only `img/docusaurus-social-card.jpg` (the default) exists. Every social share shows a broken image or the Docusaurus default.

### 2.5 llms.txt Link Tags

The `headTags` in docusaurus.config.ts reference:

```html
<link rel="alternate" href="/llms.txt" ... /> <link rel="alternate" href="/llms-full.txt" ... />
```

With the migration to `praman.dev` (baseUrl `/`), these hrefs become correct as-is. No change needed after migration.

### 2.6 Content & Structure

| Metric                    | Value                                                                            |
| ------------------------- | -------------------------------------------------------------------------------- |
| Total documentation pages | ~70 guides + ~200 API reference pages                                            |
| Blog posts                | **1** (v1 release announcement)                                                  |
| Example pages             | 12                                                                               |
| Landing pages             | 7 (index, architecture, features, personas, demo, example-reports, contributing) |
| Thin pages (< 300 words)  | Several API reference pages (auto-generated, acceptable)                         |

### 2.7 AI Discoverability

| Feature                   | Status                                                     |
| ------------------------- | ---------------------------------------------------------- |
| llms.txt (index)          | Excellent — well-structured with categories                |
| llms-full.txt             | Excellent — complete docs minus API reference              |
| Topic-specific llms files | 4 files (quickstart, sap-testing, migration, architecture) |
| ai-plugin.json            | Present in `.well-known/`                                  |
| "Ask AI" floating button  | Present on all pages — links to ChatGPT and Perplexity     |
| robots.txt AI crawlers    | 20+ AI bots explicitly allowed                             |

**AI discoverability is a significant differentiator** — no competitor has this level of AI-agent support.

---

## 3. npm Package Discoverability

### 3.1 npm Search Ranking Factors

| Factor                      | Status                                                   | Impact   |
| --------------------------- | -------------------------------------------------------- | -------- |
| Package name relevance      | High — `playwright-praman` matches "playwright" searches | Positive |
| Description keyword density | Moderate — 56 chars, could be richer                     | Medium   |
| README quality score        | High — comprehensive, structured                         | Positive |
| Weekly downloads            | 677/week                                                 | Growing  |
| Keyword completeness        | Published version only shows 8 keywords                  | Negative |
| Maintenance score           | Active — recent publish                                  | Positive |
| Dependencies (3 prod)       | Excellent — lightweight                                  | Positive |
| Provenance                  | Enabled                                                  | Positive |
| TypeScript types            | Included                                                 | Positive |

### 3.2 Critical npm Issue

**The published homepage URL is `https://praman.zestest.in/`** — this is a dead domain. Every user who clicks "Homepage" on npmjs.com gets a broken page. This damages trust signals and npm quality scores.

**Fix:** Publish a new version with the updated `homepage` field pointing to `https://praman.dev`.

---

## 4. Summary of Critical Issues

| #   | Issue                                                                     | Impact                                   | Fix Effort                                    |
| --- | ------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------- |
| 0   | **Migrate to `praman.dev`** — update docusaurus config, DNS, GitHub Pages | All SEO work must target final domain    | 1 hour                                        |
| 1   | Sitemap URLs use old domain (`praman.zestest.in`)                         | Google indexing broken                   | Fixed by migration                            |
| 2   | Published npm homepage points to dead domain                              | npm visitors get 404                     | 5 min (npm publish with `https://praman.dev`) |
| 3   | Social card image `praman-social-card.png` doesn't exist                  | Broken OG images on social shares        | 30 min (create image)                         |
| 4   | 95% of doc pages lack `description` frontmatter                           | Poor Google snippets                     | 2 hours                                       |
| 5   | Google Search Console not connected                                       | No indexing verification                 | 15 min (register `praman.dev`)                |
| 6   | Bing Webmaster Tools not connected                                        | No Bing indexing                         | 15 min                                        |
| 7   | llms.txt link tags missing baseUrl prefix                                 | Fixed by migration (baseUrl becomes `/`) | Fixed by migration                            |
| 8   | Only 1 blog post                                                          | Minimal content marketing signal         | Ongoing                                       |
| 9   | No comparison table in README                                             | Missing high-intent search capture       | 1 hour                                        |
| 10  | 1 GitHub star                                                             | Low social proof                         | Ongoing (promotion)                           |
