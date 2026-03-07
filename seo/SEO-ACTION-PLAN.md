# SEO Action Plan — Praman (playwright-praman)

**Created:** 2026-03-07 | **Revised:** 2026-03-07 (praman.dev booked)
**Goal:** Top 3 ranking on Google, npm search, and GitHub search for SAP UI5 test automation queries.
**Canonical Domain:** `praman.dev` (Cloudflare registrar, GitHub Pages hosting)

---

## Priority 0: Domain Migration (Do First — Everything Else Depends on This)

All SEO actions (Search Console, sitemap, backlinks, blog posts, npm homepage) must target `praman.dev`. Doing them on the old URL and migrating later wastes effort and loses accumulated signals.

### P0.1 DNS Setup in Cloudflare (10 min)

- [ ] Add CNAME record: `praman.dev` → `mrkanitkar.github.io`
- [ ] If using `www` subdomain too: add CNAME `www` → `mrkanitkar.github.io`
- [ ] Ensure Cloudflare proxy is enabled (orange cloud) for SSL + CDN
- [ ] Submit `praman.dev` for categorization at https://sitereview.zscaler.com/ (request "Technology/Internet")

### P0.2 GitHub Pages Custom Domain (5 min)

- [ ] Go to repo Settings → Pages → Custom domain
- [ ] Enter `praman.dev`
- [ ] Wait for DNS check to pass (~2-5 min)
- [ ] Check "Enforce HTTPS" (auto-provisions Let's Encrypt cert via GitHub, ~15 min)
- [ ] Verify: `https://praman.dev` loads the docs site

### P0.3 Update docusaurus.config.ts (15 min)

- [ ] Change `url` and `baseUrl`:
  ```typescript
  url: 'https://praman.dev',
  baseUrl: '/',
  ```
- [ ] Update all JSON-LD `url` fields in `headTags` from `mrkanitkar.github.io/playwright-praman` to `praman.dev`
- [ ] Update `robots.txt` sitemap line: `Sitemap: https://praman.dev/sitemap.xml`
- [ ] Update `ai-plugin.json` URLs to `praman.dev`
- [ ] The llms.txt link hrefs (`/llms.txt`, `/llms-full.txt`) are now correct as-is since baseUrl is `/`
- [ ] Update `Root.tsx` DOCS_URL constant: `'https://praman.dev'`

### P0.4 Update package.json (5 min)

- [ ] Set `homepage`: `"https://praman.dev"`
- [ ] Set `author.url`: `"https://praman.dev"`
- [ ] Apply enhanced `description` and `keywords` from `seo-package-json-patch.json`

### P0.5 Update README.md (15 min)

- [ ] Update all documentation table links from `mrkanitkar.github.io/playwright-praman` to `praman.dev`
- [ ] Update discovery & interaction strategies link
- [ ] Update any other hardcoded URLs

### P0.6 Update GitHub Repo Settings (2 min)

- [ ] Change "Website" URL to `https://praman.dev`

### P0.7 Build, Deploy, Verify (10 min)

- [ ] `cd docs && npx docusaurus build`
- [ ] Verify `docs/build/sitemap.xml` contains `https://praman.dev/` URLs
- [ ] Deploy to GitHub Pages (push or manual workflow)
- [ ] Verify: `https://praman.dev` loads correctly
- [ ] Verify: `https://mrkanitkar.github.io/playwright-praman/` auto-redirects to `https://praman.dev/`
- [ ] Verify: `https://praman.dev/sitemap.xml` is accessible
- [ ] Verify: `https://praman.dev/llms.txt` is accessible
- [ ] Verify: `https://praman.dev/robots.txt` references correct sitemap

### P0.8 Publish to npm (5 min)

- [ ] Bump patch version or publish as-is
- [ ] `npm publish`
- [ ] Verify on npmjs.com: "Homepage" link goes to `https://praman.dev`

---

## Priority 1: Critical (Do Same Day as Migration)

### P1.1 Register Google Search Console (15 min)

- [ ] Go to https://search.google.com/search-console
- [ ] Add property: `https://praman.dev`
- [ ] Use HTML tag verification method
- [ ] Add `google-site-verification` meta tag to `docusaurus.config.ts` metadata array
- [ ] Submit sitemap: `https://praman.dev/sitemap.xml`
- [ ] Request indexing of homepage

### P1.2 Register Bing Webmaster Tools (15 min)

- [ ] Go to https://www.bing.com/webmasters
- [ ] Import from Google Search Console or add `https://praman.dev` manually
- [ ] Add `msvalidate.01` meta tag to `docusaurus.config.ts` metadata array
- [ ] Submit sitemap

### P1.3 Create Social Card Image (30 min)

- [ ] Create `docs/static/img/praman-social-card.png` (1200x630px)
- [ ] Include: Praman logo, tagline "AI-First SAP UI5 Test Automation for Playwright", key stats
- [ ] Config already references `img/praman-social-card.png`
- [ ] Test with Facebook Debugger and Twitter Card Validator

### P1.4 Add `description` Frontmatter to Top 15 Pages (2 hours)

- [ ] Add SEO-optimized `description` (150-160 chars) to these pages:

| Page                                  | Recommended Description                                                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `guides/getting-started.md`           | `Get started with Praman in 5 minutes. Install the Playwright plugin, configure SAP credentials, and run your first SAP UI5 end-to-end test.`           |
| `guides/configuration.md`             | `Complete Praman configuration reference. Zod-validated config schema with defaults for SAP UI5 test automation, auth strategies, and bridge settings.` |
| `guides/fixtures.md`                  | `Reference for all 21 Praman Playwright fixtures: ui5, sapAuth, ui5Navigation, ui5Table, fe, odata, pramanAI, and more. Destructure and test.`          |
| `guides/authentication.md`            | `6 SAP authentication strategies for Playwright tests: BTP SAML, Basic Auth, Office 365, Client Certificate, Custom IDP, and Manual login.`             |
| `guides/selectors.md`                 | `UI5Selector reference for Praman. Find SAP UI5 controls by controlType, id, properties, bindingPath, ancestor, and descendant selectors.`              |
| `guides/migration-from-wdi5.md`       | `Step-by-step guide to migrate from wdi5 to Praman. Complete API mapping from browser.asControl() to ui5.control() with Playwright.`                    |
| `guides/fiori-elements.md`            | `Test SAP Fiori Elements apps with Praman. Page-object helpers for List Report, Object Page, Overview Page, and FE Table operations.`                   |
| `guides/odata-operations.md`          | `OData V2 and V4 testing with Praman. Browser-side model operations and Node-side HTTP CRUD for SAP OData services.`                                    |
| `guides/errors.md`                    | `Complete Praman error reference: 14 error classes, 58 error codes with retryable flags and actionable suggestions for SAP UI5 testing.`                |
| `guides/ai-integration.md`            | `AI-powered SAP test generation with Praman. LLM service integration, page discovery, agentic test handler, and capability registry.`                   |
| `guides/custom-matchers.md`           | `10 UI5-specific Playwright matchers: toHaveUI5Text, toBeUI5Visible, toBeUI5Enabled, and more. Extend expect() for SAP testing.`                        |
| `guides/navigation.md`                | `9 FLP navigation methods for Praman. Navigate SAP Fiori Launchpad apps by semantic object and action, with BTP WorkZone support.`                      |
| `guides/discovery-and-interaction.md` | `Praman discovery and interaction strategies: direct-id, recordreplay, registry lookup. 3 interaction modes: ui5-native, dom-first, opa5.`              |
| `guides/sap-control-cookbook.md`      | `Recipes for testing common SAP UI5 controls with Praman: SmartTable, SmartField, DatePicker, Dialog, ComboBox, Tree, and more.`                        |
| `guides/docker-cicd.md`               | `Run Praman SAP UI5 tests in Docker and CI/CD. Container setup, 3-OS GitHub Actions matrix, and quality gate configuration.`                            |

---

## Priority 2: High (Do This Month) — Growth Accelerators

### P2.1 Add Comparison Table to README (1 hour)

- [ ] Add a "Comparison" section to README.md:

```markdown
## How Does Praman Compare?

| Feature                    | Praman         | wdi5          | Qmate         | playwright-sap |
| -------------------------- | -------------- | ------------- | ------------- | -------------- |
| Test runner                | Playwright     | WebdriverIO   | WebdriverIO   | Playwright     |
| AI test generation         | Yes            | No            | No            | No             |
| Typed control proxies      | Yes (61 types) | Partial       | No            | No             |
| UI5 stability sync         | Yes            | Yes           | Yes           | Yes            |
| Custom Playwright matchers | 10             | N/A           | N/A           | N/A            |
| OData V2/V4 mock/intercept | Yes            | No            | No            | No             |
| Fiori Elements helpers     | Yes            | No            | No            | No             |
| FLP navigation             | Yes            | Yes           | Yes           | Yes            |
| Auth strategies            | 6              | Manual        | Manual        | 2              |
| llms.txt (AI agents)       | Yes            | No            | No            | No             |
| Cross-platform             | Win/Mac/Linux  | Win/Mac/Linux | Win/Mac/Linux | Win/Mac/Linux  |
| npm downloads/week         | 677            | 2             | 852           | 173            |
| License                    | Apache-2.0     | Apache-2.0    | Apache-2.0    | Proprietary    |
```

### P2.2 Add npm Downloads + GitHub Stars Badges to README (5 min)

- [ ] `[![npm downloads](https://img.shields.io/npm/dw/playwright-praman)](https://www.npmjs.com/package/playwright-praman)`
- [ ] `[![GitHub stars](https://img.shields.io/github/stars/mrkanitkar/playwright-praman)](https://github.com/mrkanitkar/playwright-praman)`

### P2.3 Create "Praman vs wdi5" Dedicated Page (2 hours)

- [ ] Create `docs/docs/guides/praman-vs-wdi5.md` with:
  - Detailed feature comparison table
  - Code side-by-side: wdi5 syntax vs Praman syntax
  - Migration path summary
  - When to choose each tool
  - SEO frontmatter targeting "wdi5 vs praman", "wdi5 alternative playwright"

### P2.4 Create "SAP UI5 Testing with Playwright" Blog Post (3 hours)

- [ ] Create `docs/blog/2026-03-XX-sap-ui5-testing-playwright-complete-guide.md`
- [ ] Target keywords: "sap ui5 testing playwright", "how to automate sap fiori testing"
- [ ] Include: Why Playwright for SAP, setup walkthrough, code examples, comparison
- [ ] Internal links to: Getting Started, Configuration, Fixtures, Authentication

### P2.5 Apply Remaining Docusaurus SEO Config (1 hour)

- [ ] Add Google/Bing verification meta tags (once you have the codes)
- [ ] Change site title to `'Praman'` with `titleDelimiter: '|'`
- [ ] Add sitemap config with `lastmod: 'date'`
- [ ] Add blog `feedOptions` for RSS
- [ ] Add `editUrl` to docs config
- [ ] Enable `showLastUpdateTime: true`

### P2.6 Add `keywords` Frontmatter to Top 15 Pages (1 hour)

- [ ] Add `keywords` array to the same 15 pages from P1.4
- [ ] Use keywords from `seo-keywords-master-list.md` matched to each page's topic

### P2.7 Create FAQ Schema Page (1 hour)

- [ ] Add JSON-LD FAQPage schema (from `seo-structured-data.json`) to a dedicated FAQ page
- [ ] Include the 5 README FAQs + 10 more SAP-specific questions
- [ ] Triggers Google FAQ rich results

### P2.8 Submit to Playwright Community Plugins (30 min)

- [ ] Check if Playwright has an official community plugins page or awesome-list
- [ ] Submit Praman for inclusion
- [ ] High-authority backlink from `playwright.dev` or related repo

---

## Priority 3: Medium (Do This Quarter) — Authority Building

### P3.1 SAP Community Blog Posts (3-4 hours each)

- [ ] Write and publish on SAP Community (community.sap.com):
  1. "AI-First SAP UI5 Testing with Playwright and Praman"
  2. "Migrating from wdi5 to Praman: A Practical Guide"
  3. "The State of SAP UI5 Testing in 2026: OPA5, wdi5, Qmate, and Praman"
- [ ] Each post links back to `praman.dev` = high-authority backlink from `sap.com` domain

### P3.2 Stack Overflow Presence (Ongoing)

- [ ] Monitor questions tagged `sapui5 + testing`, `sap-fiori + testing`, `playwright + sap`
- [ ] Create canonical Q&A: "How to automate SAP UI5 testing with Playwright?"
- [ ] Reference Praman with `praman.dev` links

### P3.3 Content Marketing — 8 Blog Posts (per seo-content-calendar.md)

- [ ] Publish 8 blog posts over 8 weeks targeting specific search queries
- [ ] Each post targets 1-2 keywords from the keyword master list
- [ ] Internal linking between blog posts and documentation pages

### P3.4 GitHub Growth Strategy

- [ ] Add "Star us on GitHub" CTA to README, docs footer, blog posts, SAP Community posts
- [ ] Create GitHub Releases for each version with detailed changelogs
- [ ] Respond to every issue and discussion within 24 hours

### P3.5 Awesome-Lists and Directories

- [ ] Submit to `awesome-playwright`, `awesome-sap`, `awesome-ui5` lists
- [ ] Playwright community ecosystem page
- [ ] npm discovery sites (npms.io, bundlephobia)

### P3.6 Dev.to / Hashnode Cross-Posting

- [ ] Cross-post blog posts with canonical URL pointing to `praman.dev`
- [ ] Tag: `#sap`, `#testing`, `#playwright`, `#ai`

### P3.7 Conference Talk Proposals

- [ ] SAP TechEd 2026 — "AI-Powered SAP Test Automation with Playwright"
- [ ] Playwright Conf — "Extending Playwright for Enterprise SAP Testing"
- [ ] SAP Inside Track events

---

## Priority 4: Low (Ongoing Maintenance)

### P4.1 Monitor Search Console Performance

- [ ] Weekly: Check indexing status, crawl errors, search queries
- [ ] Monthly: Review which queries drive traffic, adjust content strategy
- [ ] Quarterly: Full SEO audit refresh

### P4.2 Keep Structured Data Updated

- [ ] Update JSON-LD version numbers on each release
- [ ] Add new FAQ items as they emerge
- [ ] Test with Google Rich Results Test

### P4.3 Backlink Monitoring

- [ ] Set up Google Alerts for "praman", "playwright-praman", "praman sap"
- [ ] Track competitor mentions for response opportunities
- [ ] Monitor SAP Community for UI5 testing discussions
