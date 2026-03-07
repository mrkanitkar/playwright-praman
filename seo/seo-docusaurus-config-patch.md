/\*\*

- SEO Configuration Patch for docusaurus.config.ts
-
- Apply these changes to improve search engine visibility.
- Each change is annotated with its SEO impact.
  \*/

// ── CHANGE 0: Migrate to praman.dev (DO FIRST) ──
// Change:
// url: 'https://mrkanitkar.github.io',
// baseUrl: '/playwright-praman/',
// To:
// url: 'https://praman.dev',
// baseUrl: '/',
//
// This fixes sitemap URLs, canonical URLs, OG URLs, and llms.txt link tags — all at once.
// Also update all JSON-LD URLs in headTags from 'mrkanitkar.github.io/playwright-praman' to 'praman.dev'.
// Also update Root.tsx DOCS_URL constant to 'https://praman.dev'.

// ── CHANGE 1: llms.txt link tags ──
// With baseUrl '/', the existing href: '/llms.txt' and '/llms-full.txt' are now correct.
// No change needed after domain migration.

// ── CHANGE 2: Add Google/Bing verification meta tags (CRITICAL) ──
// In themeConfig.metadata array, uncomment and fill:
//
// { name: 'google-site-verification', content: 'YOUR_GOOGLE_CODE' },
// { name: 'msvalidate.01', content: 'YOUR_BING_CODE' },

// ── CHANGE 3: Enhance global metadata (HIGH) ──
// In themeConfig.metadata array, add these additional meta tags:
//
// { name: 'author', content: 'Zestest' },
// { name: 'robots', content: 'index, follow' },
// { property: 'og:type', content: 'website' },
// { property: 'og:site_name', content: 'Praman — SAP UI5 Test Automation' },

// ── CHANGE 4: Improve title template (MEDIUM) ──
// Change:
// title: 'playwright-praman',
// To:
// title: 'Praman',
// titleDelimiter: '|',
//
// This produces: "Getting Started | Praman" instead of
// "Getting Started | playwright-praman" (shorter, more brandable)

// ── CHANGE 5: Enhance sitemap plugin config (HIGH) ──
// The default classic preset includes sitemap, but add explicit config:
//
// In the 'classic' preset options, add:
//
// sitemap: {
// lastmod: 'date',
// changefreq: 'weekly',
// priority: 0.5,
// filename: 'sitemap.xml',
// // Give higher priority to key pages
// // (Docusaurus v3+ supports this via createSitemapItems)
// },

// ── CHANGE 6: Blog SEO improvements (MEDIUM) ──
// In the blog config, enhance:
//
// blog: {
// showReadingTime: true,
// blogTitle: 'Praman Blog — SAP UI5 Test Automation',
// blogDescription:
// 'Guides, releases, and best practices for SAP UI5 test automation with Playwright and Praman.',
// postsPerPage: 10,
// feedOptions: {
// type: 'all',
// title: 'Praman Blog',
// description:
// 'SAP UI5 test automation with Playwright — guides, releases, and best practices.',
// },
// },

// ── CHANGE 7: Enhanced footer links for SEO (LOW) ──
// In footer.links, add a "Guides" section with direct links to high-value pages:
//
// {
// title: 'Guides',
// items: [
// { label: 'Getting Started', to: '/docs/guides/getting-started' },
// { label: 'Authentication', to: '/docs/guides/authentication' },
// { label: 'Fiori Elements', to: '/docs/guides/fiori-elements' },
// { label: 'Migration from wdi5', to: '/docs/guides/migration-from-wdi5' },
// { label: 'SAP Control Cookbook', to: '/docs/guides/sap-control-cookbook' },
// ],
// },

// ── CHANGE 8: Docs editUrl for community contributions (LOW) ──
// In docs config, add editUrl to encourage PRs (GitHub activity signal):
//
// docs: {
// sidebarPath: './sidebars.ts',
// editUrl: 'https://github.com/mrkanitkar/playwright-praman/edit/main/docs/',
// showLastUpdateTime: true, // Changed from false — shows freshness signals
// showLastUpdateAuthor: false,
// },

export {};
