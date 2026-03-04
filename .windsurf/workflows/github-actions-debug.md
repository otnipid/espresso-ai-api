---
description: Debug failed GitHub Actions runs by systematically addressing each failed step
---

# GitHub Actions Debugging Workflow

This workflow helps you systematically debug failed GitHub Actions runs by identifying the root cause of each failure and implementing fixes step-by-step.

## Steps

### Step 1: Get Run Details

```bash
# Get detailed information about the specific run
gh run view $RUN_ID --repo $REPO --log
```

### Step 2: Get Error Details

For each failed job, get the specific error details

### Step 3: Analyze the Failure Pattern

For each error, categorize the failure type:

#### **Common Failure Categories:**

- **Build Failures**: TypeScript compilation, dependency issues
- **Test Failures**: Unit tests, integration tests, test setup
- **Docker Failures**: Container build, service startup, networking
- **Environment Issues**: Missing variables, authentication failures
- **Infrastructure Failures**: Service availability, resource limits
- **Configuration Issues**: YAML syntax, workflow configuration

### Step 4: Create Failure Analysis Report

Document each failure systematically using the specific run ID:

```bash
# Create a failure analysis file with specific run ID
RUN_ID=<run-id>
REPO=<owner>/<repo>

cat > ci-failure-analysis-$RUN_ID.md << EOF
# CI Failure Analysis - Run $RUN_ID

## Run Information
- **Run ID**: $RUN_ID
- **Repository**: $REPO
- **Branch**: $(gh run view $RUN_ID --repo $REPO --json | jq -r '.headBranch')
- **Commit**: $(gh run view $RUN_ID --repo $REPO --json | jq -r '.headSha')
- **Timestamp**: $(gh run view $RUN_ID --repo $REPO --json | jq -r '.createdAt')
- **Workflow**: $(gh run view $RUN_ID --repo $REPO --json | jq -r '.name')

## Failed Jobs
EOF

# Extract failed jobs automatically
FAILED_JOBS=$(gh run view $RUN_ID --repo $REPO --json | jq -r '.jobs[] | select(.conclusion == "failure") | .name')

for job in $FAILED_JOBS; do
  echo "### Job: $job" >> ci-failure-analysis-$RUN_ID.md
  echo "- **Status**: ❌ Failed" >> ci-failure-analysis-$RUN_ID.md

  # Get failed step
  FAILED_STEP=$(gh run view $RUN_ID --repo $REPO --job "$job" --json | jq -r '.steps[] | select(.conclusion == "failure") | .name')
  echo "- **Failed Step**: $FAILED_STEP" >> ci-failure-analysis-$RUN_ID.md

  # Get error message
  ERROR_LOG=$(gh run view $RUN_ID --repo $REPO --job "$job" --log | grep -E "Error:|error:" | head -1)
  echo "- **Error**: $ERROR_LOG" >> ci-failure-analysis-$RUN_ID.md
  echo "" >> ci-failure-analysis-$RUN_ID.md
done

echo "📄 Analysis report created: ci-failure-analysis-$RUN_ID.md"
```

### Step 5: Address Each Error Systematically

#### **5.1 Build Failures**

**Symptoms:**

- TypeScript compilation errors
- Dependency installation failures
- Build script errors

**Debugging Steps:**

```bash
# Check TypeScript compilation locally
npm run build

# Check for dependency issues
npm install
npm audit

# Verify build scripts
npm run build -- --verbose

# Check TypeScript configuration
npx tsc --noEmit --listFiles
```

**Common Fixes:**

```bash
# Fix TypeScript errors
# - Add missing imports
# - Fix type annotations
# - Resolve circular dependencies

# Fix dependency issues
npm install <missing-package>
npm audit fix

# Fix build configuration
# - Update tsconfig.json
# - Fix webpack/rollup config
# - Update build scripts
```

#### **5.2 Test Failures**

**Symptoms:**

- Unit test failures
- Integration test failures
- Test setup issues

**Debugging Steps:**

```bash
# Run failing tests locally
npm run test:unit -- --testNamePattern="<failing-test>"
npm run test:integration -- --testNamePattern="<failing-test>"

# Check test configuration
npx jest --showConfig

# Debug specific test
npx jest <test-file> --verbose

# Check test environment
echo $NODE_ENV
npm run test -- --detectOpenHandles
```

**Common Fixes:**

```bash
# Fix unit tests
# - Update test expectations
# - Mock external dependencies
# - Fix test data setup

# Fix integration tests
# - Check database connection
# - Verify Docker services
# - Update test environment variables

# Fix test setup
# - Update jest.config.js
# - Fix setup files
# - Check test utilities
```

#### **5.3 Docker Failures**

**Symptoms:**

- Container build failures
- Service startup failures
- Networking issues

**Debugging Steps:**

```bash
# Check Docker build locally
docker-compose build <service>

# Check service logs
docker-compose logs <service>

# Test service startup
docker-compose up <service>
docker-compose ps

# Check networking
docker-compose exec <service> ping <other-service>
```

**Common Fixes:**

```bash
# Fix Docker build
# - Update Dockerfile
# - Fix dependency installation
# - Update build context

# Fix service startup
# - Check health checks
# - Update environment variables
# - Fix entrypoint scripts

# Fix networking
# - Update docker-compose.yml
# - Check service dependencies
# - Fix port mappings
```

#### **5.4 Environment Issues**

**Symptoms:**

- Missing environment variables
- Authentication failures
- Permission issues

**Debugging Steps:**

```bash
# Check environment variables
env | grep -E "(NODE_ENV|DB_|API_)"

# Check secrets
gh secret list --repo <owner>/<repo>

# Test authentication
# - Test API keys
# - Check service accounts
# - Verify permissions
```

**Common Fixes:**

```bash
# Fix environment variables
# - Add missing variables to workflow
# - Update .env files
# - Check variable naming

# Fix authentication
# - Update secrets
# - Refresh tokens
# - Fix permissions

# Fix configuration
# - Update workflow YAML
# - Check service configurations
# - Verify credentials
```

### Step 6: Implement and Test Fixes

#### **6.1 Create Issue In GitHub**

```bash
# Create issue for tracking
gh issue create --title "CI Failure: Run <run-id>" --body "Detailed description of the failure..."
```

#### **6.2 Create Fix Branch**

```bash
# Create branch for fixes
git checkout -b fix/ci-failure-<run-id>

# Implement fixes for each issue
# ... make changes ...

# Test fixes locally
npm run build
npm run test
docker-compose up --build -d
```

#### **6.3 Validate Each Fix**

```bash
# Test build fixes
npm run build && echo "✅ Build fixed" || echo "❌ Build still failing"

# Test unit fixes
npm run test:unit && echo "✅ Unit tests fixed" || echo "❌ Unit tests still failing"

# Test integration fixes
docker-compose --profile local up --build -d
docker-compose --profile local exec api npm run test:integration
docker-compose --profile local down

# Test Docker fixes
docker-compose build && echo "✅ Docker build fixed" || echo "❌ Docker build still failing"
```

### Step 7: Re-run CI and Verify

#### **7.1 Push Fixes**

```bash
# Commit and push fixes
git add .
git commit -m "fix: resolve CI failure for run <run-id>

- Fix build compilation errors
- Resolve test failures
- Fix Docker service issues
- Update environment configuration

Fixes: #<issue-number>"
git push origin fix/ci-failure-<run-id>
```

#### **7.2 Trigger Workflow (Manually)**

```bash
# Trigger workflow manually (if needed)
gh workflow run ci.yml --repo <owner>/<repo> --ref fix/ci-failure-<run-id>
```

#### **7.3 Monitor CI Run**

```bash
# Watch the CI run
gh run watch --repo <owner>/<repo>

# Check status
gh run list --repo <owner>/<repo> --limit 3

# Get detailed results
gh run view <new-run-id> --repo <owner>/<repo> --log
```

Keep running Steps 5-7.3 until the CI run passes.

### **7.4 Update Issue Status**

If run passes, then update the issue with a comment and close it:

```bash
# Update the issue with fix details
gh issue comment <issue-number> --body "Fix implemented in commit <commit-hash>. CI run <new-run-id> passed successfully."
gh issue close <issue-number>
```

### Step 8: Post-Failure Analysis

#### **8.1 Document Lessons Learned**

```bash
# Update documentation
cat > ci-failure-lessons.md << EOF
# CI Failure Lessons Learned

## Issue: <failure-description>
- **Root Cause**: <actual-cause>
- **Fix Applied**: <solution-implemented>
- **Prevention**: <how-to-prevent-future>

## Process Improvements
- Add pre-commit hooks for <issue-type>
- Update local CI simulation workflow
- Improve error messages in <component>
- Add monitoring for <service>

## Checklist Updates
- [ ] Check <item> before pushing
- [ ] Verify <component> configuration
- [ ] Test <scenario> locally
EOF
```

#### **8.2 Update Prevention Measures**

```bash
# Update local CI simulation workflow
# - Add new validation steps
# - Update troubleshooting guide
# - Add new test cases

# Update repository configuration
# - Add branch protection rules
# - Update required status checks
# - Add automated checks

# Update documentation
# - Update README.md
# - Update contribution guidelines
# - Update development setup

# Update Memories For Cascade Model
# - Update rules/ci-debugging.md with lessons learned from resolving issue
```

## Automation Script

Create a script to automate the debugging process with specific run ID support:

```bash
#!/bin/bash
# ci-debug.sh

set -e

# Check for required parameters
if [ $# -lt 1 ]; then
  echo "Usage: $0 <run-id> [repo]"
  echo ""
  echo "Examples:"
  echo "  $0 123456789"
  echo "  $0 123456789 otnipid/espresso-ml-api"
  echo ""
  echo "If repo is not specified, it will be detected from git remote origin."
  exit 1
fi

RUN_ID=$1
REPO=${2:-$(git config --get remote.origin.url | sed 's/.*://;s/\.git//')}

echo "🔍 Analyzing CI failure for run $RUN_ID in repo $REPO"

# Validate run ID exists
echo "📋 Validating run ID..."
if ! gh run view "$RUN_ID" --repo "$REPO" --json > /dev/null 2>&1; then
  echo "❌ Run ID $RUN_ID not found in repo $REPO"
  echo "� Available runs:"
  gh run list --repo "$REPO" --limit 10
  exit 1
fi

# Get run details
echo "📋 Getting run details..."
gh run view "$RUN_ID" --repo "$REPO" --log > "ci-run-$RUN_ID.log"

# Extract failed jobs
echo "❌ Identifying failed jobs..."
FAILED_JOBS=$(gh run view "$RUN_ID" --repo "$REPO" --json | jq -r '.jobs[] | select(.conclusion == "failure") | .name')

if [ -z "$FAILED_JOBS" ]; then
  echo "✅ No failed jobs found for run $RUN_ID"
  echo "📊 Run status: $(gh run view "$RUN_ID" --repo "$REPO" --json | jq -r '.conclusion')"
  exit 0
fi

# Create analysis report
echo "📄 Creating analysis report..."
cat > "ci-failure-analysis-$RUN_ID.md" << EOF
# CI Failure Analysis - Run $RUN_ID

## Run Information
- **Run ID**: $RUN_ID
- **Repository**: $REPO
- **Branch**: $(gh run view "$RUN_ID" --repo "$REPO" --json | jq -r '.headBranch')
- **Commit**: $(gh run view "$RUN_ID" --repo "$REPO" --json | jq -r '.headSha')
- **Timestamp**: $(gh run view "$RUN_ID" --repo "$REPO" --json | jq -r '.createdAt')
- **Workflow**: $(gh run view "$RUN_ID" --repo "$REPO" --json | jq -r '.name')
- **Status**: $(gh run view "$RUN_ID" --repo "$REPO" --json | jq -r '.conclusion')

## Failed Jobs
EOF

# Analyze each failed job
for job in $FAILED_JOBS; do
  echo "🔍 Analyzing job: $job"

  # Get job details
  JOB_DETAILS=$(gh run view "$RUN_ID" --repo "$REPO" --job "$job" --log)

  # Extract failure information
  FAILED_STEP=$(gh run view "$RUN_ID" --repo "$REPO" --job "$job" --json | jq -r '.steps[] | select(.conclusion == "failure") | .name')
  ERROR_MESSAGE=$(echo "$JOB_DETAILS" | grep -E "Error:|error:" | head -1)

  # Add to analysis
  cat >> "ci-failure-analysis-$RUN_ID.md" << EOF
### $job
- **Status**: ❌ Failed
- **Failed Step**: $FAILED_STEP
- **Error**: $ERROR_MESSAGE

EOF
done

# Add next steps
cat >> "ci-failure-analysis-$RUN_ID.md" << EOF
## Next Steps
1. [ ] Review each failed job above
2. [ ] Implement fixes for each issue
3. [ ] Test fixes locally
4. [ ] Create fix branch: git checkout -b fix/ci-failure-$RUN_ID
5. [ ] Push fixes and re-run CI

## Debug Commands
\`\`\`bash
# View full logs
gh run view $RUN_ID --repo $REPO --log

# View specific job logs
gh run view $RUN_ID --repo $REPO --job <job-name> --log

# Monitor new run after fixes
gh run watch --repo $REPO
\`\`\`
EOF

echo "✅ Analysis complete!"
echo "📄 Report created: ci-failure-analysis-$RUN_ID.md"
echo "📋 Full logs: ci-run-$RUN_ID.log"
echo "🔧 Review the report and implement fixes systematically"

# Show summary
echo ""
echo "📊 Summary:"
echo "- Failed jobs: $(echo "$FAILED_JOBS" | wc -l | tr -d ' ')"
echo "- Analysis file: ci-failure-analysis-$RUN_ID.md"
echo "- Log file: ci-run-$RUN_ID.log"
echo ""
echo "🚀 Next command:"
echo "  cat ci-failure-analysis-$RUN_ID.md"
```

Make it executable:

```bash
chmod +x ci-debug.sh
```

## Troubleshooting Matrix

| Failure Type | Debug Command          | Common Fix               | Prevention          |
| ------------ | ---------------------- | ------------------------ | ------------------- |
| TypeScript   | `npm run build`        | Fix type errors          | Add pre-commit hook |
| Unit Tests   | `npm run test:unit`    | Update test expectations | Run tests locally   |
| Integration  | `docker-compose up`    | Fix Docker setup         | Local CI simulation |
| Docker Build | `docker-compose build` | Update Dockerfile        | Test build locally  |
| Environment  | `env \| grep`          | Add missing variables    | Check CI config     |
| Dependencies | `npm audit`            | Update packages          | Regular updates     |

## Best Practices

### ✅ Do:

- Analyze failures systematically
- Test fixes locally before pushing
- Document root causes and solutions
- Update prevention measures
- Use feature branches for fixes
- Monitor CI runs closely

### ❌ Don't:

- Push fixes without testing
- Ignore warning signs
- Skip documentation updates
- Merge without review
- Forget to clean up branches
- Ignore recurring issues

## Integration with Git Hooks

Add a pre-push hook to catch issues early:

```bash
# .git/hooks/pre-push
#!/bin/bash
echo "🔍 Running pre-push CI validation..."

# Build check
npm run build || exit 1

# Unit test check
npm run test:unit || exit 1

# Security check
npm audit --audit-level=moderate || exit 1

# Docker build check
docker-compose build || exit 1

echo "✅ All checks passed, safe to push"
```

This workflow ensures systematic debugging of CI failures with proper documentation and prevention measures.

## 🚀 **Usage:**

#### **Quick Start with Specific Run ID:**

```bash
# Debug a specific CI run (recommended)
./ci-debug.sh 123456789

# Debug with explicit repo
./ci-debug.sh 123456789 otnipid/espresso-ml-api

# Manual debugging with run ID
cat .windsurf/workflows/github-actions-debugging.md
```

#### **Run ID Examples:**

```bash
# Example 1: Debug recent failure
./ci-debug.sh 987654321

# Example 2: Debug specific repo run
./ci-debug.sh 987654321 otnipid/espresso-ml-api

# Example 3: Find run ID first, then debug
gh run list --repo otnipid/espresso-ml-api --limit 5
./ci-debug.sh <run-id-from-list>
```

#### **What the Script Does:**

1. **Validates** the run ID exists
2. **Extracts** failed jobs automatically
3. **Creates** detailed analysis report with run ID in filename
4. **Generates** next steps and debug commands
5. **Provides** summary with file locations

#### **Generated Files:**

- `ci-failure-analysis-<run-id>.md` - Detailed analysis report
- `ci-run-<run-id>.log` - Full CI run logs
- Branch suggestion: `fix/ci-failure-<run-id>`
