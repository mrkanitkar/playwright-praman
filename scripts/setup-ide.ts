/**
 * Interactive IDE setup script for Praman.
 *
 * @remarks
 * Detects available IDEs and generates/copies appropriate configuration files.
 * Cross-platform: works on Windows, macOS, and Linux.
 *
 * Usage: `tsx scripts/setup-ide.ts`
 */

import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');

interface IdeConfig {
  readonly name: string;
  readonly configDir: string;
  readonly description: string;
  readonly detect: () => boolean;
}

const IDE_CONFIGS: readonly IdeConfig[] = [
  {
    name: 'VS Code',
    configDir: '.vscode',
    description: 'Visual Studio Code settings, extensions, and recommended config',
    detect: () => existsSync(join(PROJECT_ROOT, '.vscode')),
  },
  {
    name: 'JetBrains (WebStorm/IntelliJ)',
    configDir: '.idea',
    description: 'Run configurations, code style, inspection profiles',
    detect: () => existsSync(join(PROJECT_ROOT, '.idea')),
  },
  {
    name: 'Cursor',
    configDir: '.cursor',
    description: 'AI rules for Praman architecture and test patterns',
    detect: () => existsSync(join(PROJECT_ROOT, '.cursor')),
  },
  {
    name: 'Google Antigravity',
    configDir: '.antigravity',
    description: 'Agent rules, workflows, and skill references',
    detect: () => existsSync(join(PROJECT_ROOT, '.antigravity')),
  },
];

const AGENT_CONFIGS = [
  { name: 'GitHub Copilot', file: '.github/copilot-instructions.md' },
  { name: 'Claude Code', file: 'CLAUDE.md' },
  { name: 'Google Jules', file: '.jules/setup.md' },
  { name: 'OpenAI Codex / Cursor AI', file: 'AGENTS.md' },
  { name: 'Copilot Coding Agents', file: '.github/agents/' },
];

function printHeader(): void {
  console.log('');
  console.log('┌─────────────────────────────────────────────┐');
  console.log('│  Praman v1.0 — IDE & Agent Setup             │');
  console.log('│  Agent-First SAP UI5 Test Automation Plugin   │');
  console.log('└─────────────────────────────────────────────┘');
  console.log('');
}

function printStatus(): void {
  console.log('🔍 Detecting IDE configurations...\n');

  for (const ide of IDE_CONFIGS) {
    const status = ide.detect() ? '✅' : '❌';
    console.log(`  ${status}  ${ide.name} (${ide.configDir}/)`);
  }

  console.log('\n🤖 Detecting AI agent configurations...\n');

  for (const agent of AGENT_CONFIGS) {
    const fullPath = join(PROJECT_ROOT, agent.file);
    const exists = existsSync(fullPath);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status}  ${agent.name} (${agent.file})`);
  }

  console.log('');
}

function copyDirRecursive(src: string, dest: string): void {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
      console.log(`  📄 ${destPath.replace(PROJECT_ROOT + '/', '')}`);
    }
  }
}

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolvePrompt) => {
    rl.question(question, (answer: string) => {
      rl.close();
      resolvePrompt(answer.trim().toLowerCase());
    });
  });
}

async function main(): Promise<void> {
  printHeader();
  printStatus();

  const missing = IDE_CONFIGS.filter((ide) => !ide.detect());

  if (missing.length === 0) {
    console.log('All IDE configurations are present. Nothing to do.\n');
    return;
  }

  console.log(`Found ${String(missing.length)} missing IDE configuration(s).\n`);

  for (const ide of missing) {
    const answer = await prompt(`Set up ${ide.name}? (${ide.description}) [y/N] `);

    if (answer === 'y' || answer === 'yes') {
      const srcDir = join(PROJECT_ROOT, ide.configDir);
      if (!existsSync(srcDir)) {
        mkdirSync(srcDir, { recursive: true });
        console.log(`  📁 Created ${ide.configDir}/`);
      }
      console.log(`  ✅ ${ide.name} configured\n`);
    } else {
      console.log(`  ⏭️  Skipped ${ide.name}\n`);
    }
  }

  console.log('Done! Run `npm run ci` to verify your setup.\n');
}

void main();
