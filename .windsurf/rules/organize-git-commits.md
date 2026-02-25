---
description: Organize Git commits systematically for better debugging and version control
---

# Organize Git Commits Workflow

This workflow helps you systematically organize changes into logical Git commits that are easy to debug and follow semantic versioning principles.

## When to Use This Workflow

Use this workflow when you have made multiple changes across different files and need to organize them into logical commits before pushing to version control.

## Steps

### Step 1: Analyze Current Changes
Run `git status` to see all modified and untracked files:
```bash
git status
```

### Step 2: Get Change Overview
Check the scope and scale of changes:
```bash
git diff --stat
git diff --name-only
```

### Step 3: Group Changes Logically
Analyze the changes and group them into logical categories:

#### Common Categories:
- **Infrastructure/Setup**: Config files, build tools, test setup
- **Dependencies**: Package.json, lock files, new libraries
- **Core Features**: Main application logic, services, controllers
- **Tests**: Test files, test configuration, test utilities
- **Documentation**: README, docs, workflows, comments
- **Refactoring**: Code cleanup, imports, organization
- **Bug Fixes**: Specific issue resolutions
- **New Features**: New functionality

### Step 4: Create Commit Plan
For each logical group, create a commit with:
- **Semantic type**: `feat`, `fix`, `refactor`, `docs`, `chore`, `style`, `perf`, `test`
- **Clear description**: What was changed and why
- **Atomic scope**: One logical change per commit
- **Debug-friendly**: Easy to revert if issues arise

#### Commit Message Format:
```
<type>: <clear, concise description>

<optional longer description>

- <bullet point 1>
- <bullet point 2>
- <bullet point 3>
```

### Step 5: Execute Commits Sequentially
Execute commits one at a time, allowing review between each:
```bash
git add <files-for-this-commit>
git commit -m "<commit-message>"
```

### Step 6: Verify Each Commit
After each commit, verify:
- Tests still pass: `npm test`
- Application builds: `npm run build`
- No obvious issues introduced

### Step 7: Push When Complete
When all commits are created and verified:
```bash
git push origin <branch-name>
```

## Examples

### Example 1: Test Infrastructure Setup
```bash
# Files: jest.config.js, package.json, babel.config.js
git add jest.config.js package.json babel.config.js
git commit -m "feat: implement Jest testing infrastructure

- Add Jest configuration with TypeScript support
- Configure Babel for test coverage instrumentation
- Update package.json with test scripts
- Add test environment variables setup"
```

### Example 2: Bug Fix
```bash
# Files: src/services/UserService.ts, src/__tests__/unit/UserService.test.ts
git add src/services/UserService.ts src/__tests__/unit/UserService.test.ts
git commit -m "fix: resolve user authentication validation error

- Fix email validation regex in UserService
- Add unit tests for edge cases
- Update error handling for invalid emails
- Ensure all tests pass"
```

### Example 3: Refactoring
```bash
# Files: src/controllers/*.ts (cleanup)
git add src/controllers/user.controller.ts src/controllers/auth.controller.ts
git commit -m "refactor: clean up controller imports and dependencies

- Remove unused imports in controller files
- Standardize import organization
- Remove redundant type imports
- Clean up controller code structure"
```

## Best Practices

### ✅ Do:
- Make commits atomic and focused
- Use semantic commit types
- Write clear, descriptive messages
- Test between commits
- Group related changes together
- Consider revertability

### ❌ Don't:
- Mix unrelated changes in one commit
- Use vague commit messages
- Commit broken code
- Skip testing between commits
- Create overly large commits
- Forget to add all relevant files

## Debugging Tips

If issues arise after a commit:
1. `git log --oneline -5` - See recent commits
2. `git revert <commit-hash>` - Revert problematic commit
3. `git diff <commit-hash>~1 <commit-hash>` - See what changed
4. Test the reverted state before proceeding

## Integration with Version Bumping

This workflow works well with semantic versioning:
- **feat**: Minor version (1.x.0)
- **fix**: Patch version (1.x.1)
- **refactor**: Patch version (1.x.1)
- **docs**: Patch version (1.x.1)
- **chore**: Patch version (1.x.1)
- **style**: Patch version (1.x.1)
- **perf**: Minor version (1.x.0)
- **test**: Patch version (1.x.1)

## Automation

This workflow can be automated with scripts that:
- Analyze git status and suggest groupings
- Generate commit messages based on file patterns
- Run tests between commits
- Validate commit message format
