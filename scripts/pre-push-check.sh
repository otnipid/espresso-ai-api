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

# 3. Run unit tests (mimics CI unit test job with coverage)
print_status "info" "Running unit tests with coverage instrumentation..."

if ! npm run test:unit:coverage; then
    print_status "error" "Unit tests with coverage failed!"
    exit 1
fi

print_status "success" "All unit tests with coverage passed"

# 4. Run integration tests (mimics CI integration test job)
print_status "info" "Running integration tests with Vitest..."

# Check if Docker is running and PostgreSQL is available
if ! docker info > /dev/null 2>&1; then
    print_status "warning" "Docker is not running - skipping integration tests"
    print_status "info" "To run integration tests locally, start Docker with:"
    print_status "info" "  docker-compose --profile test up -d postgres"
else
    # Check if PostgreSQL test container is running
    if ! docker ps --format "table {{.Names}}" | grep -q "postgres"; then
        print_status "info" "Starting PostgreSQL test container..."
        if ! docker-compose --profile test up -d postgres; then
            print_status "warning" "Failed to start PostgreSQL - skipping integration tests"
        else
            print_status "info" "Waiting for PostgreSQL to be ready..."
            sleep 5
            
            # Run integration tests with Vitest
            if ! npm run test:integration; then
                print_status "error" "Integration tests failed!"
                print_status "info" "To debug integration tests locally:"
                print_status "info" "  npm run test:integration:watch"
                exit 1
            fi
            
            print_status "success" "All integration tests passed"
        fi
    else
        # PostgreSQL is already running, run integration tests
        if ! npm run test:integration; then
            print_status "error" "Integration tests failed!"
            print_status "info" "To debug integration tests locally:"
            print_status "info" "  npm run test:integration:watch"
            exit 1
        fi
        
        print_status "success" "All integration tests passed"
    fi
fi

# 5. Check TypeScript compilation
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
echo "   - Unit Tests with coverage instrumentation"
echo "   - Integration Tests with Vitest (when Docker is available)"
echo "   - TypeScript compilation"
echo ""
echo "If any of these checks fail, the CI will also fail."
echo ""
echo "🐳 Integration Tests Note:"
echo "   - Requires Docker and PostgreSQL to run"
echo "   - Automatically starts test database if needed"
echo "   - Skipped gracefully if Docker is not available"
echo "   - Use 'npm run test:integration:watch' for debugging"
