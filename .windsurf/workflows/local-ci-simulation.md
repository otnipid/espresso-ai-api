---
description: Simulate CI workflow locally to validate changes before pushing
---

# Local CI Simulation Workflow

This workflow helps you simulate the GitHub Actions CI workflow locally to catch issues before pushing to the repository.

## Steps

### Step 1: Analyze the Current CI Workflow

First, examine the current CI workflow to understand what it does:

```bash
# View the main CI workflow
cat .github/workflows/ci.yml
```

**Key sections to identify:**

- **Lint Job**: Code quality checks
- **Test Job**: Unit tests with PostgreSQL
- **Integration Test Job**: Docker-based integration tests
- **Security Job**: Vulnerability scanning
- **Build Job**: Docker image building
- **Performance Job**: Performance tests (if any)
- **Documentation Job**: Documentation generation

### Step 2: Simulate Each Job Locally

#### **2.1 Code Quality (Lint Job)**

```bash
# TypeScript compilation
npm run build

# TypeScript check
npx tsc --noEmit

# ESLint (if configured)
if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
  npx eslint src/ --max-warnings=0
else
  echo "ESLint not configured, skipping..."
fi

# Prettier check (if configured)
if [ -f ".prettierrc" ] || [ -f ".prettierrc.json" ]; then
  npx prettier --check src/
else
  echo "Prettier not configured, skipping..."
fi
```

#### **2.2 Unit Tests (Test Job)**

```bash
# Run unit tests with coverage
npm run test:unit

# If unit tests fail, check specific issues:
npm run test:unit -- --verbose
```

#### **2.3 Integration Tests (Integration Test Job)**

```bash
# Start Docker services
docker-compose --profile local down
docker-compose --profile local up --build -d

# Wait for services to be ready
sleep 10

# Run integration tests in Docker
docker-compose --profile local exec api npm run test:integration

# Check results
docker-compose --profile local exec api npm run test:integration 2>&1 | tail -5

# Cleanup
docker-compose --profile local down
```

#### **2.4 Security Scan (Security Job)**

```bash
# Check for vulnerabilities
npm audit --audit-level=moderate

# Fix if needed
npm audit fix

# Verify fix
npm audit --audit-level=moderate
```

#### **2.5 Docker Build (Build Job)**

```bash
# Build Docker image
docker-compose --profile local build

# Test that image starts successfully
docker-compose --profile local up -d

# Test health endpoint (if available)
curl -f http://localhost:3001/health || echo "Health endpoint not available"

# Cleanup
docker-compose --profile local down
```

### Step 3: Validate Results

#### **3.1 Check Test Results**

```bash
# Unit tests
npm run test:unit 2>&1 | grep -E "(Test Suites:|Tests:|PASS|FAIL)"

# Integration tests
docker-compose --profile local up --build -d
docker-compose --profile local exec api npm run test:integration 2>&1 | grep -E "(Test Suites:|Tests:|PASS|FAIL)"
docker-compose --profile local down
```

#### **3.2 Check Build Status**

```bash
# TypeScript build
npm run build && echo "✅ Build successful" || echo "❌ Build failed"

# Security audit
npm audit --audit-level=moderate && echo "✅ Security OK" || echo "❌ Security issues found"
```

### Step 4: Decision Matrix

Based on results, decide whether to push:

| Component         | Status  | Action         |
| ----------------- | ------- | -------------- |
| TypeScript Build  | ✅ PASS | Continue       |
| Unit Tests        | ✅ PASS | Continue       |
| Integration Tests | ✅ PASS | Continue       |
| Security Audit    | ✅ PASS | Continue       |
| Docker Build      | ✅ PASS | **PUSH**       |
| Any Component     | ❌ FAIL | Fix and re-run |

## Flexible CI Workflow Adaptation

### **When CI Workflow Changes**

When the `.github/workflows/ci.yml` file changes, update this workflow:

1. **Analyze New Jobs**: Look for new job sections in the CI workflow
2. **Add Simulation Steps**: Create corresponding local simulation steps
3. **Update Validation**: Add new checks to the decision matrix
4. **Test New Steps**: Verify the new simulation steps work locally

### **Common CI Changes to Watch For:**

#### **New Test Commands**

```bash
# If CI adds new test scripts, update local simulation:
# CI: npm run test:e2e
# Local: npm run test:e2e || echo "E2E tests not configured"
```

#### **New Environment Variables**

```bash
# If CI adds new env vars, add them to local simulation:
export NEW_VAR="value"
```

#### **New Docker Services**

```bash
# If CI adds new services, update docker-compose:
docker-compose --profile extended up -d
```

#### **New Security Tools**

```bash
# If CI adds new security scans, add them locally:
npx semgrep --config=auto src/
```

## Automation Script

Create a script to automate the CI simulation:

```bash
#!/bin/bash
# ci-simulation.sh

echo "🚀 Starting Local CI Simulation..."

# Step 1: Code Quality
echo "📋 Running code quality checks..."
npm run build || exit 1
npx tsc --noEmit || exit 1

# Step 2: Unit Tests
echo "🧪 Running unit tests..."
npm run test:unit || exit 1

# Step 3: Security Audit
echo "🔒 Running security audit..."
npm audit --audit-level=moderate || exit 1

# Step 4: Integration Tests
echo "🐳 Running integration tests..."
docker-compose --profile local down
docker-compose --profile local up --build -d || exit 1
docker-compose --profile local exec api npm run test:integration || exit 1
docker-compose --profile local down

# Step 5: Docker Build
echo "🏗️ Testing Docker build..."
docker-compose --profile local build || exit 1

echo "✅ All CI checks passed! Ready to push."
```

Make it executable:

```bash
chmod +x ci-simulation.sh
```

## Troubleshooting

### **Common Issues and Solutions**

#### **Docker Jest Issues**

```bash
# If Jest fails in Docker, rebuild container:
docker-compose down && docker system prune -f && docker-compose up --build -d
```

#### **Database Connection Issues**

```bash
# Check PostgreSQL health:
docker-compose exec postgres pg_isready

# Reset database if needed:
docker-compose down && docker volume rm backend_postgres_data
```

#### **Port Conflicts**

```bash
# Check what's using ports:
lsof -i :5432
lsof -i :3001

# Kill conflicting processes:
kill -9 <PID>
```

#### **Permission Issues**

```bash
# Fix Docker permissions:
sudo chown -R $USER:$USER .
```

## Best Practices

### ✅ Do:

- Run this workflow before every push
- Keep the simulation script updated with CI changes
- Test in a clean environment regularly
- Document any workarounds found
- Use the same Node.js version as CI

### ❌ Don't:

- Skip steps to save time
- Ignore security warnings
- Push without running integration tests
- Use different dependency versions locally
- Forget to cleanup Docker resources

## Integration with Git Hooks

Add a pre-push hook to automate:

```bash
# .git/hooks/pre-push
#!/bin/bash
./ci-simulation.sh
```

This ensures the CI simulation runs before every push.
