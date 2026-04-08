/**
 * Git diff utility for PR mode — identifies changed files to scope verification.
 */

import { execSync } from 'node:child_process';

/**
 * Get the list of files changed in the current PR or since last commit.
 *
 * In CI (GitHub Actions), uses the merge base against the target branch.
 * Locally, falls back to `HEAD~1`.
 */
export function getChangedFiles(): string[] {
  try {
    // GitHub Actions sets GITHUB_BASE_REF for pull requests
    const baseRef = process.env['GITHUB_BASE_REF'];
    const diffTarget = baseRef ? `origin/${baseRef}...HEAD` : 'HEAD~1';

    const output = execSync(`git diff --name-only ${diffTarget}`, {
      encoding: 'utf-8',
      timeout: 10_000,
    });

    return output.trim().split('\n').filter(Boolean);
  } catch {
    // If git diff fails (shallow clone, detached HEAD, etc.), return empty
    return [];
  }
}
