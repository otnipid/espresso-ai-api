# Code Formatting Rules

## Prettier Formatting Guidelines

Based on common Prettier formatting issues encountered during CI/CD debugging.

### ✅ Required Formatting Patterns

#### 1. Blank Line Rules
- **No excessive blank lines**: Remove unnecessary empty lines
- **Single blank line separation**: Use exactly one blank line between logical blocks
- **No trailing whitespace**: Remove spaces at end of lines

**Example:**
```typescript
// ❌ WRONG - Excessive blank lines
const mockRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
};

        
if (entity === Shot) {
  return mockRepo;
}

// ✅ CORRECT - Single blank line
const mockRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
};

if (entity === Shot) {
  return mockRepo;
}
```

#### 2. Object and Array Formatting
- **Consistent spacing**: Use single spaces around colons and commas
- **Proper line breaks**: Break long objects/arrays across multiple lines
- **Trailing commas**: Include trailing commas in multi-line structures

**Example:**
```typescript
// ❌ WRONG - Inconsistent spacing
const config = {host:'localhost',port:5432};

// ✅ CORRECT - Proper spacing
const config = { host: 'localhost', port: 5432 };

// ❌ WRONG - No trailing comma
const mockRepo = {
  findOne: jest.fn(),
  save: jest.fn()
};

// ✅ CORRECT - With trailing comma
const mockRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
};
```

#### 4. Function Parameter Formatting
- **No extra spaces**: Remove unnecessary spaces in function parameters
- **Consistent spacing**: Single spaces around function parameters
- **Proper line breaks**: Break long parameter lists across multiple lines

**Example:**
```typescript
// ❌ WRONG - Extra space in parameter
findOne: jest.fn().mockImplementation((entity) => {

// ❌ WRONG - Extra space in nested parameter
findOne: jest.fn().mockImplementation((options) => {

// ✅ CORRECT - Proper spacing
findOne: jest.fn().mockImplementation(entity => {

// ✅ CORRECT - Proper spacing for nested parameters
findOne: jest.fn().mockImplementation(options => {
```

#### 5. Blank Line Consistency
- **Single blank lines**: Use exactly one blank line between logical blocks
- **No excessive blank lines**: Remove unnecessary empty lines
- **Consistent spacing**: Maintain consistent spacing patterns

**Example:**
```typescript
// ❌ WRONG - Excessive blank lines
}
          
// Default mock for other entities

// ✅ CORRECT - Single blank line
}

// Default mock for other entities
```

#### 6. Import and Export Statements
- **Alphabetical ordering**: Group imports logically
- **Consistent spacing**: Single spaces around import keywords
- **Line length**: Break long imports across multiple lines

**Example:**
```typescript
// ❌ WRONG - Inconsistent spacing and ordering
import {Shot} from '../entities/Shot';
import {Machine} from'../entities/Machine';
import {BeanBatch} from '../entities/BeanBatch';

// ✅ CORRECT - Proper spacing and logical grouping
import { BeanBatch } from '../entities/BeanBatch';
import { Machine } from '../entities/Machine';
import { Shot } from '../entities/Shot';
```

### 🛠️ Prevention Strategies

#### Before Committing
1. **Run Prettier locally**: `npx prettier --write src/`
2. **Check formatting**: `npx prettier --check src/`
3. **Use editor integration**: Configure Prettier in IDE for auto-formatting

#### CI/CD Integration
1. **Early formatting check**: Run Prettier before other tests
2. **Clear error messages**: Show specific files with formatting issues
3. **Auto-fix suggestions**: Provide `npx prettier --write` command in error output

### 📋 Common Fix Patterns

#### Pattern 1: Remove Extra Blank Lines
```bash
# Find files with excessive blank lines
npx prettier --check src/

# Fix automatically
npx prettier --write src/
```

#### Pattern 2: Fix Object Spacing
```typescript
// Before
const config={host:'localhost',port:5432};

// After
const config = { host: 'localhost', port: 5432 };
```

#### Pattern 3: Function Parameter Spacing
```typescript
// Before - Extra space in parameter
findOne: jest.fn().mockImplementation((entity) => {

// Before - Extra space in nested parameter  
findOne: jest.fn().mockImplementation((options) => {

// After - Proper spacing
findOne: jest.fn().mockImplementation(entity => {

// After - Proper spacing for nested parameters
findOne: jest.fn().mockImplementation(options => {
```

#### Pattern 4: Blank Line Consistency
```typescript
// Before - Excessive blank lines
}
          
// Default mock for other entities

// After - Single blank line
}

// Default mock for other entities
```

#### Pattern 5: Consistent Import Formatting
```typescript
// Before
import {Shot} from'../entities/Shot';
import {Machine} from '../entities/Machine';

// After
import { Machine } from '../entities/Machine';
import { Shot } from '../entities/Shot';
```

### 🎯 Quality Gates

#### Must Pass Before Merge
- [ ] All files pass `npx prettier --check src/`
- [ ] No formatting warnings in CI
- [ ] Consistent style across all TypeScript files

#### Automated Enforcement
- **Pre-commit hooks**: Run Prettier automatically
- **CI checks**: Fail build on formatting issues
- **IDE integration**: Format on save

### 🔧 Troubleshooting

#### Common Issues
1. **Mixed spaces and tabs**: Configure editor for spaces only
2. **Inconsistent line endings**: Set Git to LF (`git config core.autocrlf false`)
3. **Prettier conflicts**: Ensure `.prettierrc.json` is properly configured

#### Quick Fixes
```bash
# Format all files
npx prettier --write src/

# Check specific file
npx prettier --check src/path/to/file.ts

# Format specific file
npx prettier --write src/path/to/file.ts
```

### 📚 Reference Configuration

Current `.prettierrc.json` settings:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "bracketSameLine": true,
  "proseWrap": "preserve"
}
```

---

**Rule**: Always run `npx prettier --write src/` before committing to prevent CI failures.
