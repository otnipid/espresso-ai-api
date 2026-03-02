#!/bin/bash

# Pre-push hook to mimic CI workflow and catch issues before pushing
# This script runs the same checks as the CI workflow

set -e  # Exit on any error

echo "🚀 Running pre-push checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    
    case $status in
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "info")
            echo -e "ℹ️  $message"
            ;;
    esac
}

# 1. Check Prettier formatting (Code Quality check)
print_status "info" "Checking code formatting with Prettier..."

if ! npx prettier --check src/ .windsurf/; then
    print_status "error" "Prettier formatting issues found!"
    echo "Run 'npx prettier --write src/ .windsurf/' to fix formatting issues"
    exit 1
fi

print_status "success" "Code formatting is correct"

# 2. Build project
print_status "info" "Building project..."

if ! npm run build; then
    print_status "error" "Build failed!"
    exit 1
fi

print_status "success" "Build completed successfully"

# 3. Run unit tests (mimics CI unit test job)
print_status "info" "Running unit tests..."

if ! npm run test:unit; then
    print_status "error" "Unit tests failed!"
    exit 1
fi

print_status "success" "All unit tests passed"

# 4. Check TypeScript compilation
print_status "info" "Checking TypeScript compilation..."

if ! npx tsc --noEmit; then
    print_status "error" "TypeScript compilation failed!"
    exit 1
fi

print_status "success" "TypeScript compilation passed"

echo ""
print_status "success" "🎉 All pre-push checks passed! Safe to push."
echo ""
echo "💡 This pre-push hook mimics the CI workflow:"
echo "   - Code Quality (Prettier formatting)"
echo "   - Build verification"
echo "   - Unit Tests"
echo "   - TypeScript compilation"
echo ""
echo "If any of these checks fail, the CI will also fail."
