import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Praman',
  titleDelimiter: '|',
  tagline: 'Agent-First SAP UI5 Test Automation Plugin for Playwright',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  // Custom domain: praman.dev (Cloudflare DNS → GitHub Pages)
  url: 'https://praman.dev',
  baseUrl: '/',

  organizationName: 'mrkanitkar',
  projectName: 'playwright-praman',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // ── HTML <head> tags ──
  headTags: [
    // SVG favicon for modern browsers (sharper than .ico)
    {
      tagName: 'link',
      attributes: {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/img/favicon.svg',
      },
    },
    // IndexNow — instant indexing for Bing, Yandex, DuckDuckGo
    {
      tagName: 'meta',
      attributes: {
        name: 'indexnow-key',
        content: '09108a83dd0eab0bd47638c90ac5fb12',
      },
    },
    // AI agent discoverability (llmstxt.org standard)
    {
      tagName: 'link',
      attributes: {
        rel: 'alternate',
        type: 'text/plain',
        href: '/llms.txt',
        title: 'LLM-friendly documentation index',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'alternate',
        type: 'text/plain',
        href: '/llms-full.txt',
        title: 'LLM-friendly full documentation',
      },
    },

    // JSON-LD: SoftwareApplication
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'playwright-praman',
        description:
          'Agent-First SAP UI5 Test Automation Plugin for Playwright. ' +
          'Enterprise-grade testing with agentic AI, typed proxies, and 21 fixtures.',
        url: 'https://praman.dev',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Windows, macOS, Linux',
        programmingLanguage: 'TypeScript',
        runtimePlatform: 'Node.js',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        license: 'https://opensource.org/licenses/Apache-2.0',
        codeRepository: 'https://github.com/mrkanitkar/playwright-praman',
        downloadUrl: 'https://www.npmjs.com/package/playwright-praman',
        softwareRequirements: 'Playwright, Node.js >= 22',
        author: {
          '@type': 'Organization',
          name: 'Zestest',
          url: 'https://praman.dev',
        },
      }),
    },

    // JSON-LD: WebSite (enables sitelinks search box in Google)
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'playwright-praman',
        url: 'https://praman.dev',
        description: 'Agent-First SAP UI5 Test Automation Plugin for Playwright',
        inLanguage: 'en',
        publisher: {
          '@type': 'Organization',
          name: 'Zestest',
          url: 'https://praman.dev',
          logo: {
            '@type': 'ImageObject',
            url: 'https://praman.dev/img/logo.svg',
          },
        },
      }),
    },

    // JSON-LD: FAQPage (triggers Google FAQ rich results)
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What SAP systems does Praman support?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Praman supports SAP S/4HANA (on-premise and cloud), SAP BTP applications, SAP Fiori Launchpad, and any web application built with SAPUI5 or OpenUI5. It works with both SAP Fiori Elements and custom UI5 freestyle apps.',
            },
          },
          {
            '@type': 'Question',
            name: 'Do I need access to SAP source code to use Praman?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. Praman interacts with UI5 controls through the public runtime API (sap.ui.getCore()). It queries the control registry at runtime, so you only need browser access to the application.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I use Praman with existing Playwright tests?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Praman extends Playwright — it does not replace it. You can mix Praman fixtures (ui5, ui5Navigation, ui5Table) with native Playwright APIs (page.click(), page.locator()) in the same test file.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does Praman compare to wdi5?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Both access the UI5 control registry. Praman is built on Playwright (faster, modern), while wdi5 uses WebdriverIO. Praman adds typed control proxies with full IntelliSense, AI-powered test generation, Fiori Elements page-object helpers, OData V2/V4 mock/intercept utilities, and 10 UI5-specific Playwright matchers.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does AI test generation work in Praman?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Praman integrates with AI coding agents (Claude Code, GitHub Copilot, Cursor, Jules). You describe what to test in business language, and the agent generates production-ready Playwright tests using Praman fixtures with typed control proxies — not brittle selectors.',
            },
          },
          {
            '@type': 'Question',
            name: 'What authentication methods does Praman support for SAP?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Praman supports 6 authentication strategies: BTP SAML, Basic Auth, Office 365, Client Certificate, Custom IDP, and Manual login. Authentication is handled in seed tests and sessions are reused across test runs.',
            },
          },
          {
            '@type': 'Question',
            name: 'How many SAP UI5 controls does Praman support?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Praman supports 199 UI5 control types across 8 SAP libraries: sap.m, sap.ui.table, sap.ui.comp, sap.uxap, sap.f, sap.ui.mdc, sap.ui.unified, and sap.ui.core. Each control type has a fully typed proxy with IntelliSense.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is Praman free and open source?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Praman is licensed under Apache-2.0 and is completely free. It has only 3 production dependencies (commander, pino, zod), all MIT-licensed. The source code is available on GitHub.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does Praman compare to Playwright-SAP?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Both extend Playwright for SAP testing. Praman provides 199 typed UI5 control proxies with IntelliSense, AI-powered test generation via coding agents, OData V2/V4 testing utilities, Fiori Elements page-object helpers, 6 SAP auth strategies, and 10 custom matchers. Playwright-SAP provides SAP-aware locators (getByRoleUI5, locateSID) and auto-login helpers. Praman is a deeper plugin with fixtures and AI; Playwright-SAP is a lighter locator extension.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is Praman an alternative to Tricentis Tosca for SAP testing?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Praman is a free, open-source alternative to Tricentis Tosca and Worksoft for SAP S/4HANA testing. It uses Playwright (78,000+ GitHub stars) as its engine and adds AI-powered test generation, typed UI5 proxies, and SAP-specific fixtures. Unlike Tricentis, there are no license costs, no vendor lock-in, and tests are standard TypeScript.',
            },
          },
          {
            '@type': 'Question',
            name: 'Does Praman support SAP S/4HANA migration testing?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Praman is designed for SAP RISE, public cloud, and on-premise S/4HANA migration testing. It supports greenfield, brownfield, and bluefield deployment models. Features include behavioral equivalence testing (ECC vs S/4HANA), data integrity validation, business flow performance heatmaps, and compliance reporting for migration cutover.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can Praman test SAP Fiori Launchpad and Fiori Elements apps?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Praman provides dedicated fixtures for SAP Fiori Launchpad navigation (9 methods including semantic object routing and BTP WorkZone support) and Fiori Elements page-object helpers for List Report, Object Page, and Overview Page. It handles tile navigation, intent-based routing, and FLP shell interactions natively.',
            },
          },
        ],
      }),
    },
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    // TypeDoc plugin — auto-generates API reference pages from TSDoc
    [
      'docusaurus-plugin-typedoc',
      {
        entryPoints: [
          '../src/index.ts',
          '../src/ai/index.ts',
          '../src/intents/index.ts',
          '../src/vocabulary/index.ts',
          '../src/fe/index.ts',
          '../src/reporters/index.ts',
        ],
        tsconfig: '../tsconfig.json',
        out: 'docs/api',
        sidebar: {
          autoConfiguration: true,
          pretty: true,
        },
        readme: 'none',
        excludePrivate: true,
        excludeProtected: true,
        excludeInternal: true,
        // SEO: disable "Defined in: src/...ts:NN" lines — they become garbage
        // meta descriptions ("Defined in107") because Docusaurus uses the first
        // paragraph as <meta name="description"> when no frontmatter description exists.
        disableSources: true,
      },
    ],

    // SEO fix: patch TypeDoc descriptions before docs plugin reads them
    './src/plugins/fix-typedoc-seo.ts',

    // LLM-friendly docs — generates llms.txt following llmstxt.org standard
    [
      'docusaurus-plugin-llms',
      {
        title: 'Praman — Agent-First SAP UI5 Test Automation Plugin for Playwright',
        description:
          'Praman extends Playwright with deep SAP UI5 awareness — typed control proxies, ' +
          'UI5 stability synchronization, FLP navigation, OData operations, Fiori Elements ' +
          'testing, and AI-powered test generation. Single npm package: playwright-praman.',
        version: '1.0',

        // ── Generation flags ──
        generateLLMsTxt: true,
        generateLLMsFullTxt: true,
        generateMarkdownFiles: true,

        // ── Content cleaning (best practice for LLM consumption) ──
        excludeImports: true,
        removeDuplicateHeadings: true,

        // ── Exclude API docs from main files (280 TypeDoc pages are too noisy) ──
        ignoreFiles: ['api/**/*', '**/typedoc-sidebar.cjs'],

        // ── Document ordering: most important guides first ──
        includeOrder: [
          'intro.md',
          'guides/getting-started.md',
          'guides/configuration.md',
          'guides/fixtures.md',
          'guides/selectors.md',
          'guides/control-interactions.md',
          'guides/typed-controls.md',
          'guides/custom-matchers.md',
          'guides/authentication.md',
          'guides/navigation.md',
          'guides/fiori-elements.md',
          'guides/odata-operations.md',
          'guides/odata-mocking.md',
          'guides/sap-control-cookbook.md',
          'guides/errors.md',
          'guides/debugging.md',
          'guides/capabilities.md',
          'guides/capabilities-recipes.md',
          'guides/intent-api.md',
          'guides/vocabulary-system.md',
          'guides/discovery-and-interaction.md',
          'guides/fixture-composition.md',
          'guides/control-proxy.md',
          'guides/bridge-internals.md',
          'guides/architecture-overview.md',
          'guides/ai-integration.md',
          'guides/agent-setup.md',
          'guides/agent-framework-integrations.md',
          'guides/gold-standard-test.md',
          'guides/playwright-primer.md',
          'guides/reporters.md',
          'guides/docker-cicd.md',
          'guides/cross-browser.md',
          'guides/visual-regression.md',
          'guides/accessibility-testing.md',
          'guides/component-testing.md',
          'guides/performance-benchmarks.md',
          'guides/lifecycle-extensibility.md',
          'guides/multi-tool-integration.md',
          'guides/cloud-alm-integration.md',
          'guides/sap-activate-alignment.md',
          'guides/transaction-mapping.md',
          'guides/business-process-examples.md',
          'guides/upgrade-testing.md',
          'guides/behavioral-equivalence.md',
          'guides/glossary.md',
          'guides/migration-from-playwright.md',
          'guides/migration-from-wdi5.md',
          'guides/migration-from-tosca.md',
          'guides/migration-from-selenium.md',
          'guides/sap-business-analyst-guide.md',
          'guides/running-your-agent.md',
          'guides/azure-playwright-workspaces.md',
          'guides/example-reports.md',
          'guides/test-data-management.md',
          'guides/parallel-execution.md',
          'guides/custom-controls.md',
          'guides/i18n-testing.md',
          'guides/security-testing.md',
          'guides/websocket-testing.md',
          'changelog.md',
          'security.md',
          'examples/*',
        ],
        includeUnmatchedLast: true,

        // ── Performance ──
        processingBatchSize: 100,
        logLevel: 'normal',

        // ── Custom intro text ──
        rootContent:
          '> Praman is an AI-first SAP UI5 test automation plugin for Playwright.\n' +
          '> Install: `npm install playwright-praman @playwright/test`\n' +
          "> Import: `import { test, expect } from 'playwright-praman';`",
        fullRootContent:
          '> This file contains the complete Praman documentation (excluding auto-generated API reference).\n' +
          '> For topic-specific context, see llms-quickstart.txt, llms-sap-testing.txt, ' +
          'llms-migration.txt, and llms-architecture.txt.',

        // ── Topic-specific custom files for AI agent personas ──
        customLLMFiles: [
          {
            filename: 'llms-quickstart.txt',
            title: 'Praman Quick Start Guide',
            description:
              'Essential setup and core concepts: installation, configuration, fixtures, selectors, matchers.',
            includePatterns: [
              'intro.md',
              'guides/getting-started.md',
              'guides/running-your-agent.md',
              'guides/sap-business-analyst-guide.md',
              'guides/configuration.md',
              'guides/fixtures.md',
              'guides/fixture-composition.md',
              'guides/selectors.md',
              'guides/control-interactions.md',
              'guides/typed-controls.md',
              'guides/custom-matchers.md',
              'guides/errors.md',
              'guides/debugging.md',
              'guides/playwright-primer.md',
              'examples/basic-test.md',
              'guides/test-data-management.md',
              'guides/parallel-execution.md',
              'guides/custom-controls.md',
              'guides/i18n-testing.md',
              'guides/security-testing.md',
              'guides/websocket-testing.md',
            ],
            fullContent: true,
          },
          {
            filename: 'llms-sap-testing.txt',
            title: 'Praman SAP UI5 Testing Guide',
            description:
              'Authentication, navigation, FLP, OData, Fiori Elements, control cookbook, ' +
              'gold standard tests, and SAP-specific examples.',
            includePatterns: [
              'guides/authentication.md',
              'guides/navigation.md',
              'guides/fiori-elements.md',
              'guides/odata-operations.md',
              'guides/odata-mocking.md',
              'guides/sap-control-cookbook.md',
              'guides/typed-controls.md',
              'guides/gold-standard-test.md',
              'guides/discovery-and-interaction.md',
              'guides/intent-api.md',
              'guides/vocabulary-system.md',
              'guides/capabilities.md',
              'guides/capabilities-recipes.md',
              'guides/sap-activate-alignment.md',
              'guides/transaction-mapping.md',
              'guides/business-process-examples.md',
              'examples/auth-setup.md',
              'examples/dialog-handling.md',
              'examples/gold-standard-bom.md',
              'examples/table-operations.md',
              'examples/hybrid-login.md',
              'examples/odata-crud.md',
              'examples/fiori-elements.md',
              'examples/intent-api.md',
              'examples/vocabulary-discovery.md',
              'examples/btp-multi-tenant.md',
            ],
            fullContent: true,
          },
          {
            filename: 'llms-migration.txt',
            title: 'Praman Migration Guides',
            description:
              'Step-by-step migration from vanilla Playwright, Selenium WebDriver, wdi5, and Tosca to Praman.',
            includePatterns: [
              'guides/migration-from-playwright.md',
              'guides/migration-from-selenium.md',
              'guides/migration-from-wdi5.md',
              'guides/migration-from-tosca.md',
              'guides/behavioral-equivalence.md',
            ],
            fullContent: true,
          },
          {
            filename: 'llms-architecture.txt',
            title: 'Praman Architecture & Design Decisions',
            description:
              'Five-layer architecture, bridge internals, control proxy pattern, and ADRs.',
            includePatterns: [
              'guides/architecture-overview.md',
              'guides/bridge-internals.md',
              'guides/control-proxy.md',
              'guides/ai-integration.md',
              'guides/agent-framework-integrations.md',
              'guides/lifecycle-extensibility.md',
              'reference/capability-registry.md',
            ],
            fullContent: true,
          },
        ],
      },
    ],

    // Image zoom — click-to-zoom on doc images (medium-style)
    'docusaurus-plugin-image-zoom',

    // Ideal Image — responsive srcsets, lazy loading, WebP/AVIF
    [
      '@docusaurus/plugin-ideal-image',
      {
        quality: 70,
        max: 1030,
        min: 640,
        steps: 2,
        disableInDev: false,
      },
    ],
  ],

  // ── Themes ──
  themes: [
    // Local search — offline full-text search, no Algolia account needed
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['en'],
        indexDocs: true,
        indexPages: true,
        docsRouteBasePath: '/docs',
        highlightSearchTermsOnTargetPage: true,
        searchResultLimits: 8,
        searchResultContextMaxLength: 50,
        explicitSearchResultPath: true,
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/mrkanitkar/playwright-praman/edit/main/docs/',
          showLastUpdateTime: true,
          showLastUpdateAuthor: false,
          lastVersion: 'current',
          versions: {
            current: {
              label: '1.x',
              badge: true,
            },
          },
        },
        blog: {
          showReadingTime: true,
          blogTitle: 'Praman Blog',
          blogDescription:
            'Updates, releases, and guides for Praman — AI-first SAP UI5 test automation for Playwright',
          postsPerPage: 10,
          tags: 'tags.yml',
          feedOptions: {
            type: 'all',
            title: 'Praman Blog',
            description:
              'Updates, releases, and guides for Praman — AI-first SAP UI5 test automation for Playwright',
            copyright: `Copyright (c) ZesTest 2025-2030`,
          },
        },
        sitemap: {
          lastmod: 'date',
          changefreq: 'weekly',
          priority: 0.5,
          filename: 'sitemap.xml',
          async createSitemapItems(params) {
            const { defaultCreateSitemapItems, ...rest } = params;
            const items = await defaultCreateSitemapItems(rest);

            // ── SEO: Ensure every URL has a lastmod (Google crawl signal) ──
            // TypeDoc-generated API pages lack git history, so inject build date
            const today = new Date().toISOString().split('T')[0];
            const withLastmod = items.map((item) =>
              item.lastmod ? item : { ...item, lastmod: today },
            );

            // ── SEO: Filter out low-value pages that waste crawl budget ──
            // Blog tag/archive/author aggregation pages are near-empty
            const excludePatterns = [
              /\/blog\/tags\//, // individual tag pages (thin aggregation)
              /\/blog\/tags\/?$/, // tag index
              /\/blog\/authors\/?$/, // authors index
              /\/blog\/archive\/?$/, // archive page
            ];

            return withLastmod
              .filter((item) => !excludePatterns.some((re) => re.test(item.url)))
              .map((item) => {
                const url = item.url;
                if (url.endsWith('/praman.dev/') || url.endsWith('/praman.dev')) {
                  return { ...item, priority: 1.0, changefreq: 'daily' };
                }
                if (/\/(docs|architecture|features|personas|blog)\/?$/.test(url)) {
                  return { ...item, priority: 0.9, changefreq: 'weekly' };
                }
                if (/\/(demo|example-reports)\/?$/.test(url)) {
                  return { ...item, priority: 0.7, changefreq: 'weekly' };
                }
                if (
                  /\/docs\/guides\/(getting-started|configuration|fixtures|selectors|authentication|agent-setup)\/?$/.test(
                    url,
                  )
                ) {
                  return { ...item, priority: 0.8, changefreq: 'weekly' };
                }
                if (/\/docs\/guides\//.test(url)) {
                  return { ...item, priority: 0.7 };
                }
                if (/\/blog\//.test(url)) {
                  return { ...item, priority: 0.6 };
                }
                // API module index pages get higher priority than leaf pages
                if (/\/docs\/api\/(index|ai|fe|intents|reporters|vocabulary)\/?$/.test(url)) {
                  return { ...item, priority: 0.5 };
                }
                if (/\/docs\/api\//.test(url)) {
                  return { ...item, priority: 0.3 };
                }
                // Legal/boilerplate pages — lowest priority
                if (/\/(code-of-conduct|disclaimer|license|notice|contributing)\/?$/.test(url)) {
                  return { ...item, priority: 0.1 };
                }
                return item;
              });
          },
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/praman-social-card.png',
    metadata: [
      {
        name: 'description',
        content:
          'AI agents generate production-ready Playwright tests for SAP S/4HANA, Fiori & UI5. ' +
          '199 controls, OData, Fiori Elements. Open-source SAP test automation plugin.',
      },
      {
        name: 'keywords',
        content:
          'praman, playwright-praman, playwright sap, sap testing, sap test automation, ' +
          'sap ui5 testing, sapui5 test automation, sap fiori testing, fiori launchpad testing, ' +
          'sap s/4hana testing, s4hana migration testing, sap rise testing, sap btp testing, ' +
          'playwright plugin sap, sap e2e testing, end-to-end testing sap, ' +
          'sap odata testing, fiori elements testing, sap webgui testing, ' +
          'ai sap test generation, agentic testing sap, ai test automation sap, ' +
          'wdi5 alternative, tricentis alternative, tosca alternative, worksoft alternative, ' +
          'selenium to playwright sap, sap test automation open source, free sap testing tool, ' +
          'sap ui5 locators, sap codegen, sap login automation, flake-free sap testing, ' +
          'typed ui5 proxies, sap control proxy, playwright fixtures sap',
      },
      {
        name: 'robots',
        content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      },
      // og:type and og:site_name are truly global — keep them
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'playwright-praman' },
      // NOTE: og:title, og:description, og:url are auto-generated per-page by Docusaurus.
      // Do NOT set them globally — it creates duplicate meta tags and prevents
      // per-page values from being used by Google and social platforms.
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'author', content: 'Maheshwar Kanitkar' },
    ],
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Praman',
      logo: {
        alt: 'Praman Logo',
        src: 'img/logo.svg',
      },
      hideOnScroll: true,
      items: [
        // ── Dropdown 1: Product ──
        {
          type: 'dropdown',
          label: 'Product',
          position: 'left',
          items: [
            { to: '/architecture', label: 'Architecture' },
            { to: '/features', label: 'Features' },
            { to: '/personas', label: 'Personas' },
            { to: '/demo', label: 'Demo' },
          ],
        },
        // ── Menu: Documentation ──
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        // ── Dropdown 2: API ──
        {
          type: 'dropdown',
          label: 'API',
          position: 'left',
          items: [
            { to: '/docs/api', label: 'API Reference' },
            {
              href: 'pathname:///api-html/index.html',
              label: 'TypeDoc API',
              target: '_self',
            },
          ],
        },
        // ── Dropdown 3: Examples ──
        {
          type: 'dropdown',
          label: 'Examples',
          position: 'left',
          items: [
            { to: '/example-reports', label: 'Example Reports' },
            { to: '/blog/tags/example-prompts', label: 'Example Prompts' },
          ],
        },
        // ── Menu: Blog ──
        {
          to: '/blog',
          position: 'left',
          label: 'Blog',
        },
        // ── Right side ──
        {
          type: 'search',
          position: 'right',
        },
        {
          href: 'https://github.com/mrkanitkar/playwright-praman',
          'aria-label': 'GitHub',
          position: 'right',
          className: 'header-github-link',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            { label: 'Introduction', to: '/docs' },
            { label: 'API Reference', to: '/docs/api' },
            {
              label: 'TypeDoc API',
              href: 'pathname:///api-html/index.html',
            },
            { label: 'llms.txt', href: 'pathname:///llms.txt' },
            { label: 'Example Prompts', to: '/blog/tags/example-prompts' },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/mrkanitkar/playwright-praman',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/playwright-praman',
            },
          ],
        },
        {
          title: 'Legal',
          items: [
            { label: 'License', to: '/license' },
            { label: 'Notice', to: '/notice' },
            { label: 'Disclaimer', to: '/disclaimer' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'Contributing', to: '/contributing' },
            { label: 'Code of Conduct', to: '/code-of-conduct' },
            {
              label: 'GitHub Discussions',
              href: 'https://github.com/mrkanitkar/playwright-praman/discussions',
            },
          ],
        },
      ],
      logo: {
        alt: 'Praman',
        src: 'img/logo.svg',
        width: 50,
        height: 50,
      },
      copyright: `Crafted with Prudence. Powered by Purpose. | Playwright + Praman — Better Together<br/>Copyright (c) ZesTest 2025-2030. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript'],
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
    // Image zoom — click-to-zoom on doc images (medium-style)
    zoom: {
      selector: '.markdown :not(em) > img',
      background: {
        light: 'rgb(255, 255, 255)',
        dark: 'rgb(50, 50, 50)',
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
