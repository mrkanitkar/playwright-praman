# Praman Documentation Style Guide

> Playwright-aligned documentation patterns for consistency and quality.

## Principles

1. **Code is source of truth** — every example must match the actual API in `src/`
2. **15-minute onboarding** — a new user should run their first test within 15 minutes
3. **Progressive disclosure** — simplest usage first, advanced options later
4. **Persona-aware** — users come from Playwright, Selenium, wdi5, Tosca, or no background

## Page Structure

Every guide page follows this structure:

```markdown
---
title: Page Title
description: One-sentence description for SEO (under 160 chars)
keywords: [praman, playwright, sap, relevant-topic]
---

# Page Title

:::info[In this guide]
- What the reader will learn (3-5 bullet points)
- Each bullet is a concrete outcome, not a topic
:::

## Introduction

Why this feature exists. What problem it solves.
Frame around the user's pain point, not the API surface.

## Usage

Simplest example first. Every code block has a file-path annotation.

## Advanced Usage

<details> blocks for edge cases and advanced options.

## Common Mistakes

:::warning[Common mistake]
Show what NOT to do with explanation of why.
:::

## FAQ

<details>
<summary>Question phrased as user would ask it?</summary>
Answer with code example if applicable.
</details>

:::tip[Next steps]
- **[Related Guide →](./related-guide.md)** — One-line description
- **[Another Guide →](./another-guide.md)** — One-line description
:::
```

## Code Examples

### File-path annotations

Every code block must show which file it belongs in:

````markdown
```typescript
// tests/purchase-order.spec.ts
import { test, expect } from 'playwright-praman';

test('create purchase order', async ({ ui5, sapAuth }) => {
  // ...
});
```
````

### Import statements

Always use the correct import:

```typescript
// Correct
import { test, expect } from 'playwright-praman';

// Wrong — never import from sub-paths in test files
import { test } from '@playwright/test';
```

### Language specifiers

Every fenced code block must have a language:

- `typescript` — TypeScript/JavaScript code
- `bash` — shell commands
- `json` — JSON config
- `yaml` — YAML config
- `text` — plain text output
- `diff` — before/after comparisons

### Self-contained examples

Examples must be runnable if pasted into a fresh project after `npm init playwright-praman`:

```typescript
// tests/example.spec.ts
import { test, expect } from 'playwright-praman';

test('click a button', async ({ ui5 }) => {
  await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
});
```

## Admonitions

Use Docusaurus admonitions with consistent naming:

| Pattern | Admonition | When to use |
|---------|-----------|-------------|
| Learning objectives | `:::info[In this guide]` | Top of every guide page |
| Tips and shortcuts | `:::tip` | Helpful but not essential |
| Common mistakes | `:::warning[Common mistake]` | Things users frequently get wrong |
| Breaking patterns | `:::danger` | Anti-patterns that cause test failures |
| Next steps | `:::tip[Next steps]` | Bottom of every guide page |
| Prerequisites | `:::info[Prerequisites]` | When prior setup is needed |

## FAQ Sections

Use `<details>` for collapsible FAQ entries:

```markdown
## FAQ

<details>
<summary>Can I mix Praman selectors with Playwright locators?</summary>

Yes. Use `page.locator()` for non-UI5 elements and `ui5.control()` for UI5 controls.
See [Locator Selector Syntax](./locator-selector-syntax.md).

</details>
```

Rules:
- Minimum 3 questions per guide page
- Phrase questions as a user would search for them
- Include code examples in answers when relevant

## Cross-References

- Link to prerequisites at the top: "Before reading this, see [Getting Started](./getting-started.md)"
- Link forward at the bottom via `:::tip[Next steps]`
- Inline links to related concepts on first mention

## Frontmatter

Every page must have:

```yaml
---
title: Descriptive Title (not internal codename)
description: SEO description under 160 chars
keywords: [praman, playwright, sap, topic-specific-terms]
---
```

## Accuracy Requirements

- Every API method referenced must exist in the current source code
- Every fixture name must match `src/fixtures/index.ts` exports
- Every config key must match `PramanConfig` type
- Numbers (fixture count, control count, etc.) must match code
- Run `npm run build` in `docs/` to verify no broken links

## Markdownlint

Documentation must pass markdownlint with the `docs/.markdownlint-cli2.jsonc` config:

```bash
cd docs && npx markdownlint-cli2 "docs/guides/**/*.md"
```

Key rules enforced:
- MD040: All code blocks must have a language specifier
- MD013: Lines under 200 chars (tables excluded)
- MD001: Heading levels increment by one
- MD036: Use actual headings, not bold text as headings
