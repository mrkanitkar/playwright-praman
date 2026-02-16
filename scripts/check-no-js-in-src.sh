#!/bin/bash
# Prevent JavaScript files from being committed to src/
# This is a strict TypeScript project - only .ts files allowed in src/

set -e

# Get list of staged JS files in src/
JS_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '^src/.*\.(js|jsx|mjs|cjs)$' || true)

if [ -n "$JS_FILES" ]; then
  echo ""
  echo "❌ ERROR: JavaScript files are not allowed in src/"
  echo ""
  echo "This is a strict TypeScript project. The following files were rejected:"
  echo ""
  echo "$JS_FILES" | sed 's/^/  - /'
  echo ""
  echo "💡 Solutions:"
  echo "  • Convert these files to TypeScript (.ts)"
  echo "  • If these are config files, move them to the project root"
  echo "  • Configuration files like eslint.config.mjs belong in the root, not src/"
  echo ""
  exit 1
fi

echo "✓ No JavaScript files in src/"
exit 0
