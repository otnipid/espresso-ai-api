---
trigger: always_on
---

# Unit Tests

- A unit test should test individual functions/classes in isolation with all external dependencies mocked
- ANY test that mocks database dependencies MUST be classified as a unit test
- A unit test MUST
  - mock all external dependencies
  - test single responsibility
  - be deterministic and fast
- Unit tests CANNOT mock the unit under test (e.g. cannot mock ShotService when testing ShotService)

**File Naming Convention:**

- `*.unit.test.ts` in `src/__tests__/unit/` directory

**Criteria:**

- Uses mocked `DataSource` or repositories
- Tests business logic in isolation
- No actual database operations
- Fast execution, no external dependencies
- Tests validation, calculations, transformations

## 🚨 Unit Test Data Rules

### **Rule: Use Valid UUID Format for Test Data**

**Problem**: Tests using invalid UUID formats (like 'test-machine-id') cause database validation errors when services expect proper UUIDs.

**❌ WRONG - Invalid UUID format:**

```typescript
const result = shotService.createShot({
  machineId: 'test-machine-id', // ❌ Invalid UUID format
  beanBatchId: 'test-batch-id', // ❌ Invalid UUID format
  shot_type: 'normale' as const,
} as any);
```

**✅ CORRECT - Valid UUID format:**

```typescript
const result = shotService.createShot({
  machineId: '550e8400-e29b-41d4-a716-446655440000', // ✅ Valid UUID
  beanBatchId: '550e8400-e29b-41d4-a716-446655440001', // ✅ Valid UUID
  shot_type: 'normale' as const,
} as any);
```

**Mock Repository Setup:**

```typescript
const mockMachineRepo = {
  findOne: jest.fn().mockResolvedValue({
    id: '550e8400-e29b-41d4-a716-446655440000', // ✅ Valid UUID
    model: 'Test Machine',
    firmware_version: '1.0.0',
    created_at: new Date(),
  }),
  // ... other methods
};
```

**Common UUID Patterns for Tests:**

- Machine IDs: `550e8400-e29b-41d4-a716-446655440000`
- Bean Batch IDs: `550e8400-e29b-41d4-a716-446655440001`
- Shot IDs: `550e8400-e29b-41d4-a716-446655440002`
- User IDs: `550e8400-e29b-41d4-a716-446655440003`

## 🚨 Complete Entity Coverage in Unit Test Mocks

### **Rule: Mock All Entities the Service Depends On**

**Problem**: Unit tests fail when only some entities are mocked, causing cascading failures as the service tries to access unmocked dependencies.

**❌ WRONG - Incomplete mocking (only mocks Machine):**

```typescript
getRepository: jest.fn().mockImplementation(entity => {
  if (entity === Machine) {
    return {
      /* Machine mock */
    };
  }
  // ❌ Missing BeanBatch mock - causes test failure
  return {
    /* default mock */
  };
});
```

**✅ CORRECT - Complete entity coverage:**

```typescript
getRepository: jest.fn().mockImplementation(entity => {
  if (entity === Machine) {
    return createMockMachineRepo();
  }
  if (entity === BeanBatch) {
    return createMockBeanBatchRepo();
  }
  if (entity === Shot) {
    return createMockShotRepo();
  }
  // ✅ All required entities are covered
  return createMockDefaultRepo();
});
```

### **Dependency Mapping Process**

#### **Step 1: Identify All Dependencies**

```bash
# Before writing tests, map all dependencies:
grep -r "getRepository\|findOne\|find" src/services/YourService.ts

# Or analyze the service constructor and methods
class ShotService {
  constructor(
    private shotRepository: Repository<Shot>,        // ✅ Mock needed
    private machineRepository: Repository<Machine>,    // ✅ Mock needed
    private beanBatchRepository: Repository<BeanBatch>, // ✅ Mock needed
  ) {}
}
```

#### **Step 2: Create Complete Mock Setup**

```typescript
// ✅ COMPLETE MOCKING PATTERN
const createMockDataSource = () => ({
  getRepository: jest.fn().mockImplementation(entity => {
    // ✅ Entity-specific mocks with complete method coverage
    if (entity === Machine) {
      return {
        findOne: jest.fn().mockImplementation(options => {
          if (options.where.id === TEST_DATA.MACHINE_ID) {
            return Promise.resolve({
              id: TEST_DATA.MACHINE_ID,
              model: 'Test Machine',
              firmware_version: '1.0.0',
              created_at: new Date(),
            });
          }
          return Promise.resolve(null);
        }),
        find: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        restore: jest.fn(),
        // ✅ Don't forget queryRunner for transaction methods
        manager: {
          connection: {
            createQueryRunner: jest.fn().mockReturnValue({
              connect: jest.fn().mockResolvedValue(undefined),
              startTransaction: jest.fn().mockResolvedValue(undefined),
              commitTransaction: jest.fn().mockResolvedValue(undefined),
              rollbackTransaction: jest.fn().mockResolvedValue(undefined),
              release: jest.fn().mockResolvedValue(undefined),
            }),
          },
        },
      };
    }

    // ✅ Repeat for all other entities
    if (entity === BeanBatch) return createMockBeanBatchRepo();
    if (entity === Shot) return createMockShotRepo();

    // ✅ Default fallback for unknown entities
    return createMockDefaultRepo();
  }),
});
```

#### **Step 3: Use Consistent Test Data**

```typescript
// ✅ CONSISTENT TEST DATA CONSTANTS
const TEST_DATA = {
  MACHINE_ID: '550e8400-e29b-41d4-a716-446655440000',
  BEAN_BATCH_ID: '550e8400-e29b-41d4-a716-446655440001',
  SHOT_ID: '550e8400-e29b-41d4-a716-446655440002',
};

// ✅ Ensure test data matches mock responses
const result = service.createShot({
  machineId: TEST_DATA.MACHINE_ID, // ✅ Matches mock
  beanBatchId: TEST_DATA.BEAN_BATCH_ID, // ✅ Matches mock
  shot_type: 'normale' as const,
});
```

### **Mock Coverage Checklist**

#### **For Each Service Unit Test:**

- [ ] **All Repository Entities**: Every entity in constructor is mocked
- [ ] **Complete Method Coverage**: All repository methods (findOne, save, remove, etc.)
- [ ] **QueryRunner Support**: All transaction methods (connect, startTransaction, etc.)
- [ ] **Valid UUID Format**: All IDs use proper UUID format
- [ ] **Data Consistency**: Test data matches mock responses
- [ ] **Default Fallback**: Handle unknown entities gracefully

#### **Common Missing Mocks:**

```typescript
// ❌ FORGOTTEN - Transaction support
manager: {
  connection: {
    createQueryRunner: jest.fn(), // ❌ Returns undefined
  },
},

// ❌ FORGOTTEN - Complete method set
findOne: jest.fn(),
// ❌ Missing: save, remove, create, update, delete, restore

// ❌ FORGOTTEN - Entity coverage
if (entity === Machine) return mockMachineRepo;
// ❌ Missing: BeanBatch, Shot, other entities
```

### **Incremental Testing Strategy**

#### **Test One Dependency at a Time:**

```typescript
// ✅ Test machine validation first
it('should validate machine exists', async () => {
  const mockMachineRepo = createMockMachineRepo();
  // Only test machine lookup logic
});

// ✅ Then test bean batch validation
it('should validate bean batch exists', async () => {
  const mockBeanBatchRepo = createMockBeanBatchRepo();
  // Only test bean batch lookup logic
});

// ✅ Finally test complete flow
it('should create shot successfully', async () => {
  const mockDataSource = createMockDataSource();
  // Test complete flow with all mocks
});
```

### **Benefits of Complete Coverage:**

1. **Prevents Cascading Failures**: One missing mock won't cause multiple test failures
2. **Improves Debugging**: Clear separation of concerns in test failures
3. **Ensures Comprehensive Testing**: All service paths are properly tested
4. **Maintainability**: Easy to identify and fix missing dependencies
5. **Consistency**: Standardized pattern across all unit tests

## 🚨 Critical Unit Test Edit Strategies

### **Rule: Use Unique Context for Targeted Edits**

**Problem**: When editing test files with repeated patterns, ambiguous string matching causes edits to fail or apply to wrong locations.


**✅ CORRECT - Use unique context:**

```typescript
// ✅ Target unique identifier that only appears once
edit('if (entity === Shot) {\n  return {\n    findOne: jest.fn()...', 'complete Shot mock');

// ✅ Use broader range with unique context
edit(
  "if (entity === Shot) {\n  return {\n    findOne: jest.fn().mockImplementation(options => {\n      if (options.where.id === '550e8400-e29b-41d4-a716-4466554402') {\n        return Promise.resolve({\n          id: '550e8400-e29b-41d4-a716-4466554402',\n          shot_type: 'normale',\n          created_at: new Date(),\n        });\n      }\n      return Promise.resolve(null);\n    }) as jest.MockedFunction<Repository<Shot>['findOne']>,\n    find: jest.fn(),\n    save: jest.fn(),\n    remove: jest.fn(),\n    create: jest.fn(),\n    update: jest.fn(),\n    delete: jest.fn(),\n    restore: jest.fn(),",
  'enhanced Shot mock with missing methods'
);
```

### **Rule: Import Required Types Before Using Them**

**Problem**: Adding type annotations without importing required types causes TypeScript compilation errors.

**❌ WRONG - Missing import:**

```typescript
// This will fail: Cannot find name 'Repository'
}) as jest.MockedFunction<Repository<Shot>['findOne']>,
```

**✅ CORRECT - Import first:**

```typescript
import { Repository } from 'typeorm'; // ✅ Add this import

// Now this works
}) as jest.MockedFunction<Repository<Shot>['findOne']>,
```

### **Rule: Analyze Consecutive Failures Before Retrying**

**Problem**: Repeating the same failed approach without analysis leads to multiple consecutive failures.

**✅ CORRECT - Failure Analysis Process:**

#### **Step 1: Document Each Failure**

```typescript
// Failure 1: "restore: jest.fn()," appears 4 times - ambiguous
// Failure 2: Same ambiguous approach repeated
// Failure 3: "delete: jest.fn(),\n  restore: jest.fn()," still appears 4 times
```

#### **Step 2: Identify Root Cause**

```typescript
// Root cause: String patterns appear multiple times in file
// Solution: Find truly unique context like "if (entity === Shot)"
```

#### **Step 3: Verify Uniqueness Before Editing**

```bash
# Verify the target string is unique
grep -n "if (entity === Shot)" src/__tests__/unit/services/ShotService.structure.unit.test.ts
# Should return exactly 1 match
```

#### **Step 4: Use Broader Context Range**

```typescript
// ✅ Target the entire entity block for uniqueness
edit('if (entity === Shot) {\n  return {\n    findOne: jest.fn()...', 'complete replacement');
```

### **Rule: Complete Method Coverage for Repository Mocks**

**Problem**: Missing repository methods cause "is not a function" errors when services call them.

**❌ WRONG - Incomplete method coverage:**

```typescript
const mockShotRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  // ❌ Missing: findAndCount, softDelete, count, etc.
};
```

**✅ CORRECT - Complete method coverage:**

```typescript
const mockShotRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  restore: jest.fn(),
  // ✅ Add all methods the service uses
  findAndCount: jest.fn().mockResolvedValue([[], 0]),
  softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
  count: jest.fn().mockResolvedValue(0),
};
```

### **Rule: QueryRunner Manager Method Coverage**

**Problem**: Services call `queryRunner.manager.save()` and `queryRunner.manager.delete()` but mocks only have `save`.

**❌ WRONG - Missing delete method:**

```typescript
manager: {
  save: jest.fn().mockResolvedValue({ /* ... */ }),
  // ❌ Missing delete method
}
```

**✅ CORRECT - Complete manager methods:**

```typescript
manager: {
  save: jest.fn().mockResolvedValue({
    id: '550e8400-e29b-41d4-a716-4466554402',
    shot_type: 'normale',
    created_at: new Date(),
  }),
  delete: jest.fn().mockResolvedValue({ affected: 1 }), // ✅ Add delete
}
```

### **Edit Strategy Checklist**

#### **Before Editing:**

- [ ] **Search for Target String**: Verify uniqueness with `grep`
- [ ] **Check Import Dependencies**: Ensure all types are imported
- [ ] **Analyze Previous Failures**: Document what went wrong
- [ ] **Identify Unique Context**: Find patterns that appear only once

#### **During Editing:**

- [ ] **Use Broader Context**: Target larger unique blocks
- [ ] **Include Unique Identifiers**: Use entity names, specific IDs, etc.
- [ ] **Verify Method Coverage**: Check all required methods are present
- [ ] **Add Missing Imports**: Include TypeORM types as needed

#### **After Editing:**

- [ ] **Test Compilation**: Run `npm run build` to check for TypeScript errors
- [ ] **Run Targeted Tests**: Test specific file with `--testPathPatterns`
- [ ] **Verify No Regressions**: Ensure other tests still pass

**Usage:**

```bash
# Run unit tests only
npm run test:unit

# Run unit tests with coverage
npm run test:unit:coverage

# Run unit tests in watch mode
npm run test:unit:watch
```

# Integration Tests

- An integration test should test how multiple components work together with real external dependencies
- Any test that requires a database connection MUST be classified as an integration test
- An integration test MUST
  - use real database setup
  - test component interactions
  - verify database constraints

**File Naming Convention:**

- `*.integration.test.ts` in `src/__tests__/integration/` directory

**Criteria:**

- Uses `testDataSource` or any real `DataSource`
- Creates/modifies/deletes actual database records
- Tests database transactions
- Tests repository/service layer with real database
- Tests database constraints and relationships
- Uses TypeORM entities with real persistence

**Usage:**

```bash
# Run integration tests only
npm run test:integration

# Run integration tests with coverage
npm run test:integration:coverage

# Run integration tests in watch mode
npm run test:integration:watch
```

# Critical Integration Test Rules

## 🚨 Test Isolation & Data Synchronization

### **Rule: Prevent Shared Database State Between Test Files**

**Problem**: Multiple integration test files sharing the same database cause data conflicts and test failures.

**❌ WRONG - Multiple test files with shared initialization:**

```typescript
// File 1: ShotService.basic.integration.test.ts
beforeAll(async () => {
  await initializeTestDataSource(); // Creates schema + data
});

// File 2: ShotService.integration.test.ts
beforeAll(async () => {
  await initializeTestDataSource(); // Tries to create schema again!
});
```

**✅ CORRECT - Shared initialization with proper isolation:**

```typescript
// setup.integration.ts
export const initializeTestDataSource = async (): Promise<DataSource> => {
  try {
    // If already initialized, just clean the data
    if (testDataSource && testDataSource.isInitialized) {
      console.log('🔄 Database already initialized, cleaning data...');
      await cleanTestData();
      return testDataSource;
    }

    // Initialize only once
    console.log('🔌 Initializing test database connection...');
    testDataSource = createCustomPostgresDataSource();
    await testDataSource.initialize();
    await cleanTestData();
    return testDataSource;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Global setup - runs once per test suite
beforeAll(async () => {
  if (!isInitialized) {
    await initializeTestDataSource();
    isInitialized = true;
  }
});

// Clean data between tests - NOT schema recreation
beforeEach(async () => {
  if (isInitialized && testDataSource && testDataSource.isInitialized) {
    try {
      await cleanTestData(); // Only clean data, don't recreate schema
    } catch (cleanupError) {
      console.warn('⚠️  Database cleanup failed:', cleanupError);
    }
  }
});
```

### **Rule: Use Data Cleanup, Not Schema Recreation**

**Problem**: Using `testDataSource.synchronize(true)` in `beforeEach` causes PostgreSQL type conflicts.

**❌ WRONG - Schema recreation in beforeEach:**

```typescript
beforeEach(async () => {
  // This causes PostgreSQL type conflicts!
  await testDataSource.synchronize(true);
});
```

**✅ CORRECT - Data cleanup only:**

```typescript
const cleanTestData = async () => {
  const tables = [
    'shots',
    'shot_preparation',
    'shot_extraction',
    'shot_environment',
    'shot_feedback',
    'bean_batches',
    'machines',
    'bean',
  ];

  for (const table of tables) {
    try {
      await testDataSource.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
      console.log(`🧹 Cleaned table: ${table}`);
    } catch (error) {
      console.warn(`⚠️  Could not clean table ${table}:`, error);
    }
  }
};

beforeEach(async () => {
  await cleanTestData(); // Safe data cleanup only
});
```

### **Rule: Sequential Test Execution for Database Tests**

**Problem**: Parallel database tests cause race conditions and deadlocks.

**✅ CORRECT Jest Configuration:**

```javascript
// jest.config.js
projects: [
  {
    displayName: 'integration',
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/src/__tests__/integration/**/*.test.ts'],
    setupFiles: ['<rootDir>/src/__tests__/env-setup.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.integration.ts'],
    runInBand: true, // ✅ Run tests sequentially to avoid database conflicts
  },
],
```

### **Rule: One Database Schema per Test Session**

**Problem**: Multiple schema initializations cause PostgreSQL type conflicts.

**✅ CORRECT - Single initialization pattern:**

```typescript
// setup.integration.ts
let testDataSource: DataSource;
let isInitialized = false;

export const initializeTestDataSource = async (): Promise<DataSource> => {
  // Initialize only once per test session
  if (testDataSource && testDataSource.isInitialized) {
    await cleanTestData();
    return testDataSource;
  }

  // Create schema only once
  testDataSource = createCustomPostgresDataSource();
  await testDataSource.initialize();
  await cleanTestData();
  return testDataSource;
};
```

### **Rule: Separate Jest Projects for Multiple Integration Test Files**

**Problem**: Multiple integration test files sharing the same setup file cause database conflicts and test isolation issues.

**❌ WRONG - Single project for all integration tests:**

```javascript
// jest.config.js
projects: [
  {
    displayName: 'integration',
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/src/__tests__/integration/**/*.test.ts'], // ❌ All files share setup
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.integration.ts'],
    runInBand: true,
  },
],
```

**✅ CORRECT - Separate projects with isolated setups:**

```javascript
// jest.config.js
projects: [
  {
    displayName: 'integration-basic',
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/src/__tests__/integration/services/ShotService.basic.integration.test.ts'],
    setupFiles: ['<rootDir>/src/__tests__/env-setup.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.integration.basic.ts'], // ✅ Separate setup
    runInBand: true,
  },
  {
    displayName: 'integration-main',
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/src/__tests__/integration/services/ShotService.integration.test.ts'],
    setupFiles: ['<rootDir>/src/__tests__/env-setup.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.integration.main.ts'], // ✅ Separate setup
    runInBand: true,
  },
],
```

**✅ CORRECT - Separate setup files with different databases:**

```typescript
// setup.integration.basic.ts
const createCustomPostgresDataSource = () =>
  new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    username: process.env.DB_USERNAME || 'postgres_user',
    password: process.env.DB_PASSWORD || 'postgres_password',
    database: process.env.DB_NAME || 'espresso_ml_test_basic', // ✅ Different database
    entities: [
      /* ... */
    ],
    synchronize: true,
    logging: false,
    dropSchema: true,
    ssl: false,
  });

// setup.integration.main.ts
const createCustomPostgresDataSource = () =>
  new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    username: process.env.DB_USERNAME || 'postgres_user',
    password: process.env.DB_PASSWORD || 'postgres_password',
    database: process.env.DB_NAME || 'espresso_ml_test_main', // ✅ Different database
    entities: [
      /* ... */
    ],
    synchronize: true,
    logging: false,
    dropSchema: true,
    ssl: false,
  });
```

**✅ CORRECT - Update test file imports:**

```typescript
// ShotService.basic.integration.test.ts
import {
  initializeTestDataSource,
  getTestDataSource,
  createTestMachine,
  createTestBean,
  createTestBeanBatch,
} from '../../setup.integration.basic'; // ✅ Import from basic setup

// ShotService.integration.test.ts
import {
  initializeTestDataSource,
  getTestDataSource,
  createTestMachine,
  createTestBean,
  createTestBeanBatch,
} from '../../setup.integration.main'; // ✅ Import from main setup
```

## 🐛 Common Integration Test Pitfalls

### **1. PostgreSQL Type Conflicts**

```bash
# Error: duplicate key value violates unique constraint "pg_type_typname_nsp_index"
```

**Solution**: Initialize schema once, clean data between tests.

### **2. Test Data Leaking Between Tests**

```bash
# Expected length: 2, Received length: 4
```

**Solution**: Use `TRUNCATE TABLE` with `CASCADE` in `beforeEach`.

### **3. Database Connection Pool Exhaustion**

```bash
# Error: too many connections
```

**Solution**: Use `runInBand: true` and proper cleanup in `afterAll`.

### **4. Concurrent Schema Creation**

```bash
# Error: relation "bean" does not exist
```

**Solution**: Shared initialization with proper state checking.

### **5. Multiple Integration Test Files Conflicts**

```bash
# Expected length: 2, Received length: 0
# Test Suites: 1 failed, 1 passed, 2 total
```

**Solution**: Create separate Jest projects with isolated setup files and databases.

## 📋 Integration Test Checklist

- [ ] **Single Schema Initialization**: Schema created once per test session
- [ ] **Data Cleanup Between Tests**: Use `TRUNCATE` not `DROP/CREATE`
- [ ] **Sequential Execution**: `runInBand: true` in Jest config
- [ ] **Proper Table Names**: Verify exact table names in cleanup
- [ ] **Connection Management**: Proper `afterAll` cleanup
- [ ] **Error Handling**: Graceful handling of cleanup failures
- [ ] **Environment Variables**: Proper `NODE_ENV=test` setup
- [ ] **Separate Jest Projects**: Each integration test file in its own project
- [ ] **Isolated Setup Files**: Separate setup files for each test project
- [ ] **Different Database Names**: Use unique database names per project
- [ ] **Correct Import Paths**: Update test files to import from correct setup

# All Tests

```bash
# Run all tests (unit + integration)
npm run test

# Run all tests with coverage
npm run test:coverage

# Run all tests in watch mode
npm run test:watch
```

---

## 🚨 **CRITICAL: Jest Matcher Syntax Rules**

### **Rule: Verify Jest Matcher Syntax Before Committing**

**Problem**: Incorrect Jest matcher syntax causes test failures and requires manual fixes.

**Common Syntax Errors:**

#### **❌ WRONG - Extra Closing Parenthesis**
```typescript
// ❌ WRONG - Extra closing parenthesis
expect(methodString).toMatch(/options\s*=\s*\{\}/)); // ← Extra )

// ❌ WRONG - Missing closing parenthesis  
expect(methodString).toMatch(/options\s*=\s*\{\}/; // ← Missing )

// ❌ WRONG - Mixed string/regex syntax
expect(methodString).toMatch('/options\s*=\s*\{\}/'); // ← String instead of regex
```

#### **✅ CORRECT - Proper Jest Matcher Syntax**
```typescript
// ✅ CORRECT - Regex literal (no quotes, no extra parens)
expect(methodString).toMatch(/options\s*=\s*\{\}/);

// ✅ CORRECT - String literal
expect(methodString).toContain('options = {}');

// ✅ CORRECT - Multiple matchers (each properly closed)
expect(methodString).toContain('options');
expect(methodString).toContain('__awaiter');
expect(methodString).toMatch(/options\s*=\s*\{\}/);
```

### **Jest Matcher Syntax Checklist**

#### **Before Committing Test Changes:**

```bash
# ✅ CHECKLIST: Verify these syntax patterns:
- [ ] All expect() calls have proper closing parenthesis: expect(...).matcher(...)
- [ ] Regex literals use /pattern/ syntax, not '/pattern/' string
- [ ] String matchers use 'string' or "string", not '/string/'
- [ ] No extra closing parentheses: ) not ))
- [ ] No missing closing parentheses: ) not ;
- [ ] Proper semicolon at end of line: ...);
```

#### **Common Jest Matcher Patterns:**

```typescript
// ✅ String matchers
expect(text).toContain('substring');
expect(text).toEqual('exact string');

// ✅ Regex matchers  
expect(text).toMatch(/pattern/);
expect(text).toMatch(/pattern\s*with\s*spaces/);

// ✅ Number matchers
expect(number).toBeGreaterThan(5);
expect(number).toBeLessThanOrEqual(10);

// ✅ Boolean matchers
expect(boolean).toBe(true);
expect(boolean).toBeFalsy();
```

### **Debugging Syntax Errors:**

When tests fail with syntax errors:

1. **Check the exact error message** - Usually points to line/column
2. **Count opening/closing parentheses** - Must match
3. **Verify regex vs string syntax** - No quotes around regex literals
4. **Run single test file** - Isolate the syntax error
5. **Use IDE syntax highlighting** - Catches obvious issues

### **Prevention Strategy:**

```bash
# Before committing test changes:
npm run test:unit -- --testPathPatterns="specific-test-file.ts"

# If syntax errors appear:
# 1. Fix the syntax error
# 2. Re-run the single test
# 3. Only commit when syntax is clean
```

This prevents syntax errors from reaching CI and requiring manual fixes.
