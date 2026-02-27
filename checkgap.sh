#!/usr/bin/env bash
# =============================================================================
# Codebase Cleanup Audit Script
# Runs multiple static analysis tools and generates a combined report
# Usage: ./codebase-audit.sh [project-root] [src-glob]
# Example: ./codebase-audit.sh . "src/**/*.ts"
# =============================================================================

set -euo pipefail

PROJECT_ROOT="${1:-.}"
SRC_GLOB="${2:-src/**/*.ts}"
REPORT_DIR="${PROJECT_ROOT}/audit-report"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
REPORT_FILE="${REPORT_DIR}/audit-${TIMESTAMP}.md"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_ISSUES=0
declare -A CATEGORY_COUNTS

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

ensure_tool() {
    local tool="$1"
    if ! command -v "$tool" &>/dev/null && ! npx --yes "$tool" --help &>/dev/null 2>&1; then
        log_warn "$tool not available, will attempt via npx"
    fi
}

append_section() {
    local title="$1"
    local content="$2"
    local count="$3"

    TOTAL_ISSUES=$((TOTAL_ISSUES + count))
    CATEGORY_COUNTS["$title"]=$count

    {
        echo ""
        echo "---"
        echo ""
        echo "## $title"
        echo ""
        if [ "$count" -eq 0 ]; then
            echo "✅ **No issues found.**"
        else
            echo "⚠️ **$count issue(s) found.**"
            echo ""
            echo '```'
            echo "$content"
            echo '```'
        fi
        echo ""
    } >> "$REPORT_FILE"
}

# -----------------------------------------------------------------------------
# Setup
# -----------------------------------------------------------------------------
cd "$PROJECT_ROOT"
mkdir -p "$REPORT_DIR"

{
    echo "# Codebase Cleanup Audit Report"
    echo ""
    echo "- **Project**: $(basename "$(pwd)")"
    echo "- **Date**: $(date)"
    echo "- **Source Glob**: \`$SRC_GLOB\`"
    echo ""
} > "$REPORT_FILE"

log_info "Starting codebase audit in $(pwd)..."
echo ""

# =============================================================================
# 1. TODO / FIXME / HACK Markers (leasot)
# =============================================================================
log_info "1/8 Scanning for TODO/FIXME/HACK markers (leasot)..."
LEASOT_OUTPUT=""
LEASOT_COUNT=0
if LEASOT_OUTPUT=$(npx --yes leasot "$SRC_GLOB" --reporter table 2>/dev/null); then
    LEASOT_COUNT=$(echo "$LEASOT_OUTPUT" | grep -cE "TODO|FIXME|HACK|XXX|TEMP|WORKAROUND" || true)
    log_ok "Found $LEASOT_COUNT markers"
else
    # leasot exits with code 1 when it finds markers
    LEASOT_COUNT=$(echo "$LEASOT_OUTPUT" | grep -cE "TODO|FIXME|HACK|XXX|TEMP|WORKAROUND" || true)
    if [ "$LEASOT_COUNT" -gt 0 ]; then
        log_warn "Found $LEASOT_COUNT markers"
    else
        log_warn "leasot failed or no matching files"
        LEASOT_OUTPUT="Tool could not run. Try manually: npx leasot '$SRC_GLOB'"
    fi
fi
append_section "TODO / FIXME / HACK Markers" "$LEASOT_OUTPUT" "$LEASOT_COUNT"

# =============================================================================
# 2. Unused Exports (ts-prune)
# =============================================================================
log_info "2/8 Scanning for unused exports (ts-prune)..."
TSPRUNE_OUTPUT=""
TSPRUNE_COUNT=0
if TSPRUNE_OUTPUT=$(npx --yes ts-prune 2>/dev/null | grep -v "used in module" || true); then
    TSPRUNE_COUNT=$(echo "$TSPRUNE_OUTPUT" | grep -c "." || true)
    log_ok "Found $TSPRUNE_COUNT unused exports"
else
    log_warn "ts-prune failed"
    TSPRUNE_OUTPUT="Tool could not run. Try manually: npx ts-prune"
fi
append_section "Unused Exports (ts-prune)" "$TSPRUNE_OUTPUT" "$TSPRUNE_COUNT"

# =============================================================================
# 3. Comprehensive Scan (knip)
# =============================================================================
log_info "3/8 Running comprehensive scan (knip)..."
KNIP_OUTPUT=""
KNIP_COUNT=0
if KNIP_OUTPUT=$(npx --yes knip --reporter compact 2>/dev/null || true); then
    KNIP_COUNT=$(echo "$KNIP_OUTPUT" | grep -cE "^(Unused|Unlisted)" || true)
    log_ok "Found $KNIP_COUNT knip categories with issues"
else
    log_warn "knip failed"
    KNIP_OUTPUT="Tool could not run. Try manually: npx knip"
fi
append_section "Comprehensive Analysis (knip)" "$KNIP_OUTPUT" "$KNIP_COUNT"

# =============================================================================
# 4. Unused Dependencies (depcheck)
# =============================================================================
log_info "4/8 Checking for unused dependencies (depcheck)..."
DEPCHECK_OUTPUT=""
DEPCHECK_COUNT=0
if DEPCHECK_OUTPUT=$(npx --yes depcheck 2>/dev/null || true); then
    DEPCHECK_COUNT=$(echo "$DEPCHECK_OUTPUT" | grep -c "^\* " || true)
    log_ok "Found $DEPCHECK_COUNT dependency issues"
else
    log_warn "depcheck failed"
    DEPCHECK_OUTPUT="Tool could not run. Try manually: npx depcheck"
fi
append_section "Unused Dependencies (depcheck)" "$DEPCHECK_OUTPUT" "$DEPCHECK_COUNT"

# =============================================================================
# 5. Unimported Files
# =============================================================================
log_info "5/8 Checking for unimported files (unimported)..."
UNIMPORTED_OUTPUT=""
UNIMPORTED_COUNT=0
if UNIMPORTED_OUTPUT=$(npx --yes unimported 2>/dev/null || true); then
    UNIMPORTED_COUNT=$(echo "$UNIMPORTED_OUTPUT" | grep -cE "^\s+-\s+" || true)
    log_ok "Found $UNIMPORTED_COUNT unimported entries"
else
    log_warn "unimported failed"
    UNIMPORTED_OUTPUT="Tool could not run. Try manually: npx unimported"
fi
append_section "Unimported Files" "$UNIMPORTED_OUTPUT" "$UNIMPORTED_COUNT"

# =============================================================================
# 6. Grep-based Checks (no external deps)
# =============================================================================
log_info "6/8 Running grep-based checks..."

# 6a. console.log/warn/error in source
CONSOLE_OUTPUT=$(grep -rn "console\.\(log\|warn\|error\|debug\|info\)" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=test --exclude-dir=tests --exclude-dir=__tests__ . 2>/dev/null || true)
CONSOLE_COUNT=$(echo "$CONSOLE_OUTPUT" | grep -c "." || true)

# 6b. @ts-ignore / @ts-expect-error / @ts-nocheck
TSIGNORE_OUTPUT=$(grep -rn "@ts-ignore\|@ts-expect-error\|@ts-nocheck" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=dist . 2>/dev/null || true)
TSIGNORE_COUNT=$(echo "$TSIGNORE_OUTPUT" | grep -c "." || true)

# 6c. "any" type usage
ANY_OUTPUT=$(grep -rn ": any\b\|as any\b\|<any>" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=dist . 2>/dev/null || true)
ANY_COUNT=$(echo "$ANY_OUTPUT" | grep -c "." || true)

# 6d. Empty catch blocks
EMPTY_CATCH_OUTPUT=$(grep -rn -A1 "catch" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=dist . 2>/dev/null | grep -B1 "{\s*}" || true)
EMPTY_CATCH_COUNT=$(echo "$EMPTY_CATCH_OUTPUT" | grep -c "catch" || true)

# 6e. Not implemented throws
NOT_IMPL_OUTPUT=$(grep -rn "not implemented\|Not implemented\|NOT IMPLEMENTED\|throw new Error" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=test --exclude-dir=tests . 2>/dev/null || true)
NOT_IMPL_COUNT=$(echo "$NOT_IMPL_OUTPUT" | grep -c "." || true)

# 6f. Commented-out code blocks (heuristic: lines starting with // followed by code-like patterns)
COMMENTED_CODE_OUTPUT=$(grep -rn "^[[:space:]]*//[[:space:]]*\(import\|export\|const\|let\|var\|function\|class\|return\|if\|for\|while\|await\|async\)" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=dist . 2>/dev/null || true)
COMMENTED_CODE_COUNT=$(echo "$COMMENTED_CODE_OUTPUT" | grep -c "." || true)

log_ok "Grep checks complete"

GREP_COMBINED="### console.log/warn/error in source ($CONSOLE_COUNT)
$CONSOLE_OUTPUT

### @ts-ignore / @ts-expect-error ($TSIGNORE_COUNT)
$TSIGNORE_OUTPUT

### 'any' type usage ($ANY_COUNT)
$ANY_OUTPUT

### Empty catch blocks ($EMPTY_CATCH_COUNT)
$EMPTY_CATCH_OUTPUT

### Not implemented / stub throws ($NOT_IMPL_COUNT)
$NOT_IMPL_OUTPUT

### Commented-out code ($COMMENTED_CODE_COUNT)
$COMMENTED_CODE_OUTPUT"

GREP_TOTAL=$((CONSOLE_COUNT + TSIGNORE_COUNT + ANY_COUNT + EMPTY_CATCH_COUNT + NOT_IMPL_COUNT + COMMENTED_CODE_COUNT))
append_section "Grep-based Code Smell Checks" "$GREP_COMBINED" "$GREP_TOTAL"

# Store subcategories
CATEGORY_COUNTS["  ├─ console.log in source"]=$CONSOLE_COUNT
CATEGORY_COUNTS["  ├─ @ts-ignore/expect-error"]=$TSIGNORE_COUNT
CATEGORY_COUNTS["  ├─ 'any' type usage"]=$ANY_COUNT
CATEGORY_COUNTS["  ├─ Empty catch blocks"]=$EMPTY_CATCH_COUNT
CATEGORY_COUNTS["  ├─ Not implemented stubs"]=$NOT_IMPL_COUNT
CATEGORY_COUNTS["  └─ Commented-out code"]=$COMMENTED_CODE_COUNT

# =============================================================================
# 7. Test file checks
# =============================================================================
log_info "7/8 Checking test files for .skip, .only, empty tests..."

SKIP_OUTPUT=$(grep -rn "\.skip\|xit\|xdescribe\|xtest" --include="*.test.ts" --include="*.spec.ts" --include="*.test.tsx" --include="*.spec.tsx" --exclude-dir=node_modules --exclude-dir=dist . 2>/dev/null || true)
SKIP_COUNT=$(echo "$SKIP_OUTPUT" | grep -c "." || true)

ONLY_OUTPUT=$(grep -rn "\.only" --include="*.test.ts" --include="*.spec.ts" --include="*.test.tsx" --include="*.spec.tsx" --exclude-dir=node_modules --exclude-dir=dist . 2>/dev/null || true)
ONLY_COUNT=$(echo "$ONLY_OUTPUT" | grep -c "." || true)

TEST_TOTAL=$((SKIP_COUNT + ONLY_COUNT))
TEST_COMBINED="### Skipped tests ($SKIP_COUNT)
$SKIP_OUTPUT

### Focused tests with .only ($ONLY_COUNT)
$ONLY_OUTPUT"

log_ok "Found $TEST_TOTAL test issues"
append_section "Test File Issues" "$TEST_COMBINED" "$TEST_TOTAL"
CATEGORY_COUNTS["  ├─ Skipped tests (.skip)"]=$SKIP_COUNT
CATEGORY_COUNTS["  └─ Focused tests (.only)"]=$ONLY_COUNT

# =============================================================================
# 8. Missing JSDoc on exports
# =============================================================================
log_info "8/8 Checking for public exports missing JSDoc..."

# Heuristic: find 'export' lines NOT preceded by a JSDoc comment
MISSING_JSDOC_OUTPUT=$(grep -rn "^export " --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=dist --exclude="*.test.*" --exclude="*.spec.*" --exclude="index.ts" . 2>/dev/null | head -50 || true)
MISSING_JSDOC_COUNT=$(echo "$MISSING_JSDOC_OUTPUT" | grep -c "." || true)

log_ok "Found $MISSING_JSDOC_COUNT exports to check for JSDoc"
append_section "Exports Potentially Missing JSDoc (sample)" "$MISSING_JSDOC_OUTPUT" "$MISSING_JSDOC_COUNT"

# =============================================================================
# Summary
# =============================================================================
log_info "Generating summary..."

{
    echo ""
    echo "---"
    echo ""
    echo "## Summary"
    echo ""
    echo "| Category | Count |"
    echo "|----------|------:|"

    # Sort and print categories
    for category in \
        "TODO / FIXME / HACK Markers" \
        "Unused Exports (ts-prune)" \
        "Comprehensive Analysis (knip)" \
        "Unused Dependencies (depcheck)" \
        "Unimported Files" \
        "Grep-based Code Smell Checks" \
        "  ├─ console.log in source" \
        "  ├─ @ts-ignore/expect-error" \
        "  ├─ 'any' type usage" \
        "  ├─ Empty catch blocks" \
        "  ├─ Not implemented stubs" \
        "  └─ Commented-out code" \
        "Test File Issues" \
        "  ├─ Skipped tests (.skip)" \
        "  └─ Focused tests (.only)" \
        "Exports Potentially Missing JSDoc (sample)"; do
        count="${CATEGORY_COUNTS[$category]:-0}"
        echo "| $category | $count |"
    done

    echo "| **TOTAL** | **$TOTAL_ISSUES** |"
    echo ""
    echo "---"
    echo ""
    echo "## Recommended Action Plan"
    echo ""
    echo "1. **Critical**: Fix \`.only\` in tests (blocks CI), remove \`@ts-ignore\` suppressions"
    echo "2. **High**: Remove dead/orphan code identified by knip and ts-prune"
    echo "3. **High**: Clean up unused dependencies (security & bundle size)"
    echo "4. **Medium**: Replace \`console.log\` with proper logger, replace \`any\` with real types"
    echo "5. **Medium**: Resolve all TODO/FIXME items or convert to tracked issues"
    echo "6. **Low**: Add JSDoc to public API, remove commented-out code"
    echo ""
    echo "---"
    echo ""
    echo "> **Next step**: Paste this report into Claude with your source code and ask:"
    echo '> *"Using this audit report and the codebase, give me a file-by-file cleanup plan'
    echo '>   prioritized by impact. For each item, tell me exactly what to do."*'
} >> "$REPORT_FILE"

echo ""
echo "=============================================="
echo -e "${GREEN}Audit complete!${NC}"
echo -e "Total issues found: ${YELLOW}${TOTAL_ISSUES}${NC}"
echo -e "Report saved to: ${BLUE}${REPORT_FILE}${NC}"
echo "=============================================="
