import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'playwright-praman',
  tagline: 'AI-First SAP UI5 Test Automation for Playwright',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  // Custom domain: praman.zestest.in (CNAME in static/)
  url: 'https://praman.zestest.in',
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
          'AI-First SAP UI5 Test Automation Platform for Playwright. ' +
          'Enterprise-grade testing with agentic AI, typed proxies, and 32+ fixtures.',
        url: 'https://praman.zestest.in',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Windows, macOS, Linux',
        programmingLanguage: 'TypeScript',
        runtimePlatform: 'Node.js',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        license: 'https://opensource.org/licenses/Apache-2.0',
        codeRepository: 'https://github.com/mrkanitkar/playwright-praman',
        downloadUrl: 'https://www.npmjs.com/package/playwright-praman',
        softwareRequirements: 'Playwright, Node.js >= 20',
        author: {
          '@type': 'Organization',
          name: 'Zestest',
          url: 'https://praman.zestest.in',
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
        url: 'https://praman.zestest.in',
        description: 'AI-First SAP UI5 Test Automation Platform for Playwright',
        inLanguage: 'en',
        publisher: {
          '@type': 'Organization',
          name: 'Zestest',
          url: 'https://praman.zestest.in',
          logo: {
            '@type': 'ImageObject',
            url: 'https://praman.zestest.in/img/logo.svg',
          },
        },
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
      },
    ],

    // LLM-friendly docs — generates llms.txt following llmstxt.org standard
    [
      'docusaurus-plugin-llms',
      {
        title: 'Praman — AI-First SAP UI5 Test Automation for Playwright',
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
          showLastUpdateTime: false,
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
          blogDescription: 'Updates, releases, and guides for Praman',
          postsPerPage: 10,
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
      { name: 'keywords', content: 'praman, playwright, sap, ui5, testing, automation, fiori, ai' },
      { name: 'twitter:card', content: 'summary_large_image' },
      // TODO: Replace with actual codes from Google Search Console and Bing Webmaster Tools
      // { name: 'google-site-verification', content: 'YOUR_GOOGLE_VERIFICATION_CODE' },
      // { name: 'msvalidate.01', content: 'YOUR_BING_VERIFICATION_CODE' },
    ],
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    announcementBar: {
      id: 'v1_launch',
      content:
        '🚀 Praman v1.0 is under active development. <a href="/docs">Read the docs</a> to get started.',
      backgroundColor: '#1e3c72',
      textColor: '#ffffff',
      isCloseable: true,
    },
    navbar: {
      title: 'Praman',
      logo: {
        alt: 'Praman Logo',
        src: 'img/logo.svg',
      },
      hideOnScroll: true,
      items: [
        // ── Menu 1: Architecture ──
        {
          to: '/architecture',
          position: 'left',
          label: 'Architecture',
        },
        // ── Menu 2: Features ──
        {
          to: '/features',
          position: 'left',
          label: 'Features',
        },
        // ── Menu 3: Personas ──
        {
          to: '/personas',
          position: 'left',
          label: 'Personas',
        },
        // ── Menu 4: Demo ──
        {
          to: '/demo',
          position: 'left',
          label: 'Demo',
        },
        // ── Menu 5: Example Reports ──
        {
          to: '/example-reports',
          position: 'left',
          label: 'Example Reports',
        },
        // ── Menu 6: Documentation ──
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        // ── Menu 6: API Reference (auto-generated by TypeDoc) ──
        {
          to: '/docs/api',
          position: 'left',
          label: 'API Reference',
        },
        // ── Menu 7: TypeDoc API (standalone HTML) ──
        {
          href: 'pathname:///api-html/index.html',
          position: 'left',
          label: 'TypeDoc API',
          target: '_self',
        },
        // ── Menu 8: Blog ──
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
      copyright: `Crafted with Prudence. Powered by Purpose. | Playwright + Praman — Better Together<br/>Copyright © ${new Date().getFullYear()} Zestest. Built with Docusaurus.`,
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
