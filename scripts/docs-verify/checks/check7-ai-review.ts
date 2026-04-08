/**
 * Check 7: AI Review
 *
 * Uses Claude to review documentation against mapped source files
 * for factual accuracy. Only flags provably wrong facts.
 *
 * Requires DOCS_VERIFY_AI_API_KEY env var. Skips gracefully if not set.
 * Tracks cumulative cost and stops when budget is exceeded.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import type {
  DocCheck,
  CheckResult,
  CheckFinding,
  DocUnderTest,
  SharedContext,
} from '../lib/types.js';

/** Approximate costs per million tokens (Claude Sonnet 4) */
const INPUT_COST_PER_M = 3.0;
const OUTPUT_COST_PER_M = 15.0;

const SYSTEM_PROMPT = `You are a documentation accuracy reviewer for a Playwright-based SAP UI5 test automation library called "playwright-praman".

Your task: compare the documentation against the actual source code and identify ONLY provably wrong facts.

Rules:
- ONLY flag statements that are demonstrably incorrect based on the source code provided.
- Do NOT flag style issues, formatting, or missing information.
- Do NOT flag subjective opinions or aspirational statements.
- Do NOT flag content that cannot be verified from the provided source files.
- Focus on: wrong function signatures, wrong parameter names, wrong default values, wrong behavior descriptions, wrong type names, non-existent APIs described as existing.

Return a JSON array of findings. Each finding must have:
- "severity": "error" for provably wrong facts, "warning" for likely inaccurate but not certain
- "line": approximate line number in the doc (or null if not determinable)
- "message": concise description of the inaccuracy
- "suggestion": how to fix it

If everything looks accurate, return an empty array: []

IMPORTANT: Return ONLY the JSON array, no markdown fences, no explanation.`;

interface AiFinding {
  severity: 'error' | 'warning';
  line: number | null;
  message: string;
  suggestion?: string;
}

/**
 * Check 7: AI-powered documentation accuracy review.
 */
export class Check7AiReview implements DocCheck {
  readonly name = 'ai-review' as const;

  private cumulativeCostUsd = 0;
  private client: InstanceType<typeof Anthropic> | undefined;
  private model: string;
  private maxCostUsd: number;

  constructor() {
    this.model = process.env['DOCS_VERIFY_AI_MODEL'] ?? 'claude-sonnet-4-6';
    this.maxCostUsd = parseFloat(process.env['DOCS_VERIFY_AI_MAX_COST_USD'] ?? '5.00');
  }

  async run(doc: DocUnderTest, context: SharedContext): Promise<CheckResult> {
    const start = Date.now();

    // Check if API key is set
    const apiKey = process.env['DOCS_VERIFY_AI_API_KEY'];
    if (!apiKey) {
      return {
        check: 'ai-review',
        status: 'skip',
        errors: [],
        warnings: [],
        skipReason: 'DOCS_VERIFY_AI_API_KEY not set',
        durationMs: Date.now() - start,
      };
    }

    // Check budget
    if (this.cumulativeCostUsd >= this.maxCostUsd) {
      return {
        check: 'ai-review',
        status: 'skip',
        errors: [],
        warnings: [],
        skipReason: `Budget cap exceeded ($${this.cumulativeCostUsd.toFixed(2)} / $${this.maxCostUsd.toFixed(2)})`,
        durationMs: Date.now() - start,
      };
    }

    // Check for mapped source files
    if (doc.mappedSourceFiles.length === 0) {
      return {
        check: 'ai-review',
        status: 'skip',
        errors: [],
        warnings: [],
        skipReason: 'No mapped source files',
        durationMs: Date.now() - start,
      };
    }

    // Initialize client lazily
    if (!this.client) {
      this.client = new Anthropic({ apiKey });
    }

    // Load source files
    const sourceContents = this.loadSourceFiles(doc.mappedSourceFiles);
    if (sourceContents.length === 0) {
      return {
        check: 'ai-review',
        status: 'skip',
        errors: [],
        warnings: [],
        skipReason: 'No mapped source files found on disk',
        durationMs: Date.now() - start,
      };
    }

    // Build user prompt
    const userPrompt = this.buildUserPrompt(doc, sourceContents);

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });

      // Track cost
      const inputTokens = response.usage?.input_tokens ?? 0;
      const outputTokens = response.usage?.output_tokens ?? 0;
      this.cumulativeCostUsd +=
        (inputTokens / 1_000_000) * INPUT_COST_PER_M +
        (outputTokens / 1_000_000) * OUTPUT_COST_PER_M;

      // Parse response
      const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const findings = this.parseFindings(text);

      const errors = findings.filter((f) => f.severity === 'error');
      const warnings = findings.filter((f) => f.severity === 'warning');

      const status = errors.length > 0 ? 'fail' : warnings.length > 0 ? 'warn' : 'pass';

      return {
        check: 'ai-review',
        status,
        errors,
        warnings,
        durationMs: Date.now() - start,
      };
    } catch {
      // API error — skip gracefully
      return {
        check: 'ai-review',
        status: 'skip',
        errors: [],
        warnings: [],
        skipReason: 'AI API call failed',
        durationMs: Date.now() - start,
      };
    }
  }

  /**
   * Load source files from disk.
   */
  private loadSourceFiles(paths: string[]): Array<{ path: string; content: string }> {
    const results: Array<{ path: string; content: string }> = [];
    for (const p of paths) {
      const fullPath = resolve(p);
      if (existsSync(fullPath)) {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          results.push({ path: p, content });
        } catch {
          // Skip unreadable files
        }
      }
    }
    return results;
  }

  /**
   * Build the user prompt with doc content and source code.
   */
  private buildUserPrompt(
    doc: DocUnderTest,
    sources: Array<{ path: string; content: string }>,
  ): string {
    const sourceSection = sources
      .map((s) => `### Source: ${s.path}\n\`\`\`typescript\n${s.content}\n\`\`\``)
      .join('\n\n');

    return `## Documentation to Review

File: ${doc.filePath}

\`\`\`markdown
${doc.content}
\`\`\`

## Source Code (ground truth)

${sourceSection}

Review the documentation above against the source code. Return a JSON array of findings for any provably wrong facts.`;
  }

  /**
   * Parse AI response text into CheckFinding[].
   */
  private parseFindings(text: string): CheckFinding[] {
    try {
      // Strip markdown code fences if present
      const cleaned = text.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '');
      const parsed = JSON.parse(cleaned) as AiFinding[];
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter(
          (f) =>
            f &&
            typeof f.message === 'string' &&
            (f.severity === 'error' || f.severity === 'warning'),
        )
        .map((f) => ({
          severity: f.severity,
          line: typeof f.line === 'number' ? f.line : undefined,
          message: f.message,
          suggestion: f.suggestion,
        }));
    } catch {
      return [];
    }
  }

  /** Get cumulative cost for reporting */
  getCumulativeCost(): number {
    return this.cumulativeCostUsd;
  }
}

export const check7AiReview: DocCheck = new Check7AiReview();
