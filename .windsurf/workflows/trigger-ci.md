---
description: Trigger CI workflow on current branch
---

# Trigger CI Workflow

This workflow triggers the GitHub Actions CI workflow on the current branch to test changes in the CI environment.

## When to Use This Workflow

Use this workflow when you want to:
- Test changes in the CI environment
- Verify that fixes work with coverage instrumentation
- Validate that pre-push hook changes prevent CI failures
- Debug CI-specific issues that don't appear locally

## Steps

### Step 1: Ensure Changes Are Pushed

Before triggering CI, make sure all changes are pushed:

```bash
# Check if there are uncommitted changes
git status

# If there are changes, commit and push them
git add -A
git commit -m "your commit message"
git push origin <branch-name>
```

### Step 2: Trigger CI Workflow

Trigger the CI workflow using GitHub CLI:

```bash
# Trigger CI on current branch
gh api --method POST repos/otnipid/espresso-ml-api/actions/workflows/236572881/dispatches --field ref=$(git branch --show-current)

# Or trigger on specific branch
gh api --method POST repos/otnipid/espresso-ml-api/actions/workflows/236572881/dispatches --field ref=<branch-name>
```

### Step 3: Monitor CI Execution

Monitor the workflow execution at:
```
https://github.com/otnipid/espresso-ml-api/actions
```

Look for the new workflow run with:
- **Event**: `workflow_dispatch`
- **Branch**: Your current branch
- **Status**: Should show as running, then pass/fail

### Step 4: Analyze Results

If CI fails:
1. **Check the specific failure** - Look at job logs
2. **Compare with local results** - Run pre-push hook locally
3. **Identify environment differences** - Coverage instrumentation, Node version, etc.
4. **Fix the issue** - Apply targeted fixes
5. **Re-trigger CI** - Repeat the process

## Common CI Issues and Solutions

### Coverage Instrumentation Differences

**Problem**: Tests pass locally but fail in CI due to coverage instrumentation
**Solution**: Update pre-push hook to run tests with coverage

```bash
# Update pre-push hook to use coverage
npm run test:unit:coverage  # Instead of npm run test:unit
```

### Environment Variable Differences

**Problem**: Different behavior due to environment variables
**Solution**: Ensure consistent environment setup

```bash
# Check CI environment variables in workflow file
# Ensure local .env.test matches CI expectations
```

### Node Version Differences

**Problem**: Different Node.js versions between local and CI
**Solution**: Align Node.js versions

```bash
# Check local Node version
node --version

# Check CI Node version in .github/workflows/ci.yml
```

## Workflow ID Reference

- **CI Workflow ID**: `236572881`
- **Repository**: `otnipid/espresso-ml-api`
- **Workflow Name**: "Continuous Integration"

## Best Practices

### ✅ Do:

- Always push changes before triggering CI
- Use current branch name when possible
- Monitor CI execution closely
- Compare local vs CI results when debugging
- Keep workflow documentation updated

### ❌ Don't:

- Trigger CI with uncommitted changes
- Ignore CI failures without investigation
- Assume local and CI environments are identical
- Forget to update pre-push hook when fixing CI issues

## Troubleshooting

### GitHub CLI Not Working

```bash
# Check if gh CLI is installed
gh --version

# Authenticate if needed
gh auth login

# Check permissions
gh auth status
```

### Workflow Not Found

```bash
# List available workflows
gh workflow list

# Get workflow details
gh workflow view 236572881
```

### Branch Not Found

```bash
# Check current branch
git branch --show-current

# List all branches
git branch -a

# Push branch if not on remote
git push -u origin <branch-name>
```

## Integration with Other Workflows

This workflow works well with:
- `/run-unit-tests-and-fix` - Fix tests before triggering CI
- `/organize-git-commits` - Clean up commits before CI
- `/github-actions-debug` - Debug CI failures when they occur
