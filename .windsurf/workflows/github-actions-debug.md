---
description: Debug failed GitHub Actions runs by systematically addressing each failed step
---

# GitHub Actions Debugging Workflow (Windsurf Agent)

## Role

You are a DevOps engineer, and your responsibility is to **analyze, reproduce, and resolve failures in GitHub Actions CI workflows** while ensuring fixes are verified locally and do not introduce regressions.

You should:

- Investigate CI failures methodically.
- Prefer **root-cause fixes over temporary workarounds**.
- Validate fixes locally before triggering CI.
- Document failures and lessons learned to prevent recurrence.

---

# Workflow

This workflow helps systematically debug failed **GitHub Actions CI runs** by identifying root causes and implementing fixes step-by-step.

---

# Step 1: Get Run Details

Retrieve logs and metadata for the failing workflow run.

```bash
# Get detailed information about the specific run
gh run view $RUN_ID --repo $REPO --log
```

# Step 2: Identify Failed Jobs and Errors

For each failed job, collect:

- Job name
- Failed step
- Error messages
- Stack traces or build logs
- Focus investigation on the first failing step, as downstream failures are often side effects.

# Step 3: Analyze the Failure Pattern

Categorize each failure to determine the most effective debugging strategy.

## Common Failure Categories

### Build Failures

- TypeScript compilation errors
- Dependency resolution problems
- Build script issues

### Test Failures

- Unit test failures
- Integration test failures
- Test environment misconfiguration

### Docker Failures

- Container build failures
- Service startup issues
- Networking or service dependency issues

### Environment Issues

- Missing environment variables
- Secret or authentication failures
- Permissions errors

### Infrastructure Failures

- External service outages
- Resource limitations
- Rate limits or networking issues

### Configuration Issues

- YAML syntax errors
- Workflow configuration mistakes
- Invalid CI job dependencies

# Step 4: Create Failure Analysis Report

Document failures systematically.

```
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
```

Extract failed jobs:

```
FAILED_JOBS=$(gh run view $RUN_ID --repo $REPO --json | jq -r '.jobs[] | select(.conclusion == "failure") | .name')
```

Add each failure to the report:

```
for job in $FAILED_JOBS; do
  echo "### Job: $job" >> ci-failure-analysis-$RUN_ID.md
  echo "- **Status**: ❌ Failed" >> ci-failure-analysis-$RUN_ID.md

  FAILED_STEP=$(gh run view $RUN_ID --repo $REPO --job "$job" --json | jq -r '.steps[] | select(.conclusion == "failure") | .name')
  echo "- **Failed Step**: $FAILED_STEP" >> ci-failure-analysis-$RUN_ID.md

  ERROR_LOG=$(gh run view $RUN_ID --repo $REPO --job "$job" --log | grep -E "Error:|error:" | head -1)
  echo "- **Error**: $ERROR_LOG" >> ci-failure-analysis-$RUN_ID.md
  echo "" >> ci-failure-analysis-$RUN_ID.md
done
```

# Step 5: Address Each Error Systematically

## 5.1 Build Failures

### Debug

```
npm run build
npm install
npm audit
npx tsc --noEmit --listFiles
```

### Common Fixes

- Add missing imports
- Fix TypeScript types
- Update dependencies
- Update build configuration

## 5.2 Test Failures

### Debug

```
npm run test:unit -- --testNamePattern="<failing-test>"
npm run test:integration -- --testNamePattern="<failing-test>"
npx jest --showConfig
npx jest <test-file> --verbose
```

### Common Fixes

- Update test expectations
- Mock external dependencies
- Fix test data setup
- Correct environment variables

## 5.3 Docker Failures

### Debug

```
docker-compose build <service>
docker-compose logs <service>
docker-compose up <service>
docker-compose ps
```

### Common Fixes

- Update Dockerfile
- Fix dependency installation
- Update service health checks
- Correct network configuration

## 5.4 Environment Issues

### Debug

```
env | grep -E "(NODE_ENV|DB_|API_)"
gh secret list --repo <owner>/<repo>
```

### Common Fixes

- Add missing environment variables
- Update GitHub Secrets
- Refresh authentication tokens
- Correct workflow YAML configuration

## Step 6: Implement and Test Fixes

### Create GitHub Issue

#### Track CI failures explicitly.

```
gh issue create --title "CI Failure: Run <run-id>" --body "Detailed description of the failure..."
```

#### Create Fix Branch

```
git checkout -b fix/ci-failure-<run-id>
```

#### Apply fixes and test locally:

```
npm run build
npm run test
docker-compose up --build -d
```

#### Validate Fixes

```
npm run build && echo "✅ Build fixed" || echo "❌ Build still failing"

npm run test:unit && echo "✅ Unit tests fixed" || echo "❌ Unit tests still failing"

docker-compose build && echo "✅ Docker build fixed" || echo "❌ Docker build still failing"
```

# Step 7: Re-run CI and Verify

1. Push Fixes

```
git add .
git commit -m "fix: resolve CI failure for run <run-id>"
git push origin fix/ci-failure-<run-id>
```

2. Trigger Workflow

```
gh workflow run ci.yml --repo <owner>/<repo> --ref fix/ci-failure-<run-id>
```

3. Monitor CI

```
gh run watch --repo <owner>/<repo>
gh run list --repo <owner>/<repo> --limit 3
gh run view <new-run-id> --repo <owner>/<repo> --log
```

4. Repeat debugging until the CI run succeeds.

5. Close Issue

```
gh issue comment <issue-number> --body "Fix implemented. CI run passed successfully."
gh issue close <issue-number>
```

# Step 8: Post-Failure Analysis

## Document Lessons Learned

```
cat > ci-failure-lessons.md << EOF
# CI Failure Lessons Learned

## Issue
- Root Cause:
- Fix Applied:
- Prevention:

## Process Improvements
- Add pre-commit hooks
- Improve CI validation
- Expand automated tests
EOF
```

## Improve Prevention Measures

- Add new validation checks to CI
- Improve repository configuration
- Update developer documentation
- Add additional test coverage

## Troubleshooting Matrix

| Failure Type | Debug Command          | Common Fix       | Prevention          |
| ------------ | ---------------------- | ---------------- | ------------------- |
| TypeScript   | `npm run build`        | Fix type errors  | Pre-commit lint     |
| Unit Tests   | `npm run test:unit`    | Fix tests        | Run locally         |
| Integration  | `docker-compose up`    | Fix services     | Local CI simulation |
| Docker       | `docker-compose build` | Fix Dockerfile   | Local builds        |
| Environment  | `env \| grep`          | Add missing vars | Validate CI config  |
| Dependencies | `npm audit`            | Update packages  | Regular updates     |

## Best Practices

### Do

- Debug CI failures systematically
- Reproduce failures locally first
- Commit small, focused fixes
- Document root causes
- Improve automation after fixes

### Avoid

- Pushing fixes without testing
- Ignoring recurring failures
- Skipping documentation updates
- Merging CI fixes without verification

# Goal

Ensure every CI failure results in:

- Root cause identified
- Fix implemented and verified locally
- CI passing again
- Preventative improvements added
