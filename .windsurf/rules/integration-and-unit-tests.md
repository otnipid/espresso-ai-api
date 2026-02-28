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
    'shots', 'shot_preparation', 'shot_extraction', 
    'shot_environment', 'shot_feedback', 
    'bean_batches', 'machines', 'bean'
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
const createCustomPostgresDataSource = () => new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  username: process.env.DB_USERNAME || 'postgres_user',
  password: process.env.DB_PASSWORD || 'postgres_password',
  database: process.env.DB_NAME || 'espresso_ml_test_basic', // ✅ Different database
  entities: [/* ... */],
  synchronize: true,
  logging: false,
  dropSchema: true,
  ssl: false,
});

// setup.integration.main.ts
const createCustomPostgresDataSource = () => new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  username: process.env.DB_USERNAME || 'postgres_user',
  password: process.env.DB_PASSWORD || 'postgres_password',
  database: process.env.DB_NAME || 'espresso_ml_test_main', // ✅ Different database
  entities: [/* ... */],
  synchronize: true,
  logging: false,
  dropSchema: true,
  ssl: false,
});
```

**✅ CORRECT - Update test file imports:**
```typescript
// ShotService.basic.integration.test.ts
import { initializeTestDataSource, getTestDataSource, createTestMachine, createTestBean, createTestBeanBatch } from '../../setup.integration.basic'; // ✅ Import from basic setup

// ShotService.integration.test.ts
import { initializeTestDataSource, getTestDataSource, createTestMachine, createTestBean, createTestBeanBatch } from '../../setup.integration.main'; // ✅ Import from main setup
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
