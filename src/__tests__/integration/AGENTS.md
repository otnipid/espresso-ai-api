# Integration Testing Guide

## 🎯 Core Principles

- **Real Dependencies**: Use actual database and external services
- **Component Interaction**: Test how multiple components work together
- **Database Constraints**: Verify real database behavior
- **Sequential Execution**: Avoid race conditions
- **Vitest Integration**: Modern test runner with improved performance

## 🚨 Critical Rules

### **Rule: Documenting Tests**

All test functions must include comments documenting the implementation of the test case and the expected outcome, including:

- Description of the behavior being tested
- Expected results from the tests
- Any required setup or teardown steps
- Input parameters for the test
- A list of all dependencies or external services used

### **Rule: Test Data Isolation Pattern**

**Problem**: Tests sharing data or relying on data from other tests causes flaky failures and maintenance issues.

**Solution**: Each test must follow the pattern: Create → Test → Cleanup

```typescript
describe('Service Tests', () => {
  beforeEach(async () => {
    // Step 1: Create test data for this test only
    const testData = await createTestShotData();
  });

  it('should test specific behavior', async () => {
    // Step 2: Run the test with fresh data
    const result = await service.method(testData);
    expect(result).toBeDefined();
  });

  // Step 3: Global afterEach handles cleanup automatically
});
```

### **Rule: No Transaction Isolation Bypassing**

**Problem**: Direct repository access in test helpers creates different transaction contexts, causing entity visibility issues.

**Solution**: Always test through the service layer, never bypass validation or transactions.

```typescript
// ❌ AVOID - Direct repository access
export const createTestShot = async (service: ShotService) => {
  const shotRepository = getTestDataSource().getRepository(Shot);
  return await shotRepository.save(shotData); // Bypasses service logic
};

// ✅ CORRECT - Test through service layer
export const createTestShot = async (service: ShotService) => {
  const testData = await createTestShotData();
  const shotData = {
    userId: testData.user.id,
    machineId: testData.machine.id,
    // ... other fields
  };
  return await service.createShot(shotData); // Tests actual service logic
};
```

### **Rule: Each Test Creates Its Own Data**

**Problem**: Global variables or shared test data cause conflicts when tests run in different orders.

**Solution**: Each `describe` block manages its own test data in `beforeEach`.

```typescript
describe('getShots', () => {
  let freshTestData: any;

  beforeEach(async () => {
    // Create fresh data for this describe block
    freshTestData = await createTestShotData();

    // Create shots for testing
    await shotService.createShot({
      userId: freshTestData.user.id,
      machineId: freshTestData.machine.id,
      // ... use freshTestData, not global variables
    });
  });
});
```

### **Rule: Prevent Shared Database State**

**Problem**: Multiple test files sharing database cause conflicts.

**Solution**: Single schema initialization with data cleanup.

```typescript
// ✅ CORRECT - Single initialization
let testDataSource: DataSource;
let isInitialized = false;

export const initializeTestDataSource = async (): Promise<DataSource> => {
  if (testDataSource && testDataSource.isInitialized) {
    await cleanTestData();
    return testDataSource;
  }
  // Initialize only once
  testDataSource = createCustomPostgresDataSource();
  await testDataSource.initialize();
  await cleanTestData();
  return testDataSource;
};
```

### **Rule: Use Data Cleanup, Not Schema Recreation**

**Problem**: `synchronize(true)` in `beforeEach` causes PostgreSQL conflicts.

**Solution**: Use `TRUNCATE TABLE` for data cleanup.

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
    'users',
    'grinders',
  ];

  for (const table of tables) {
    await testDataSource.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
  }
};

// Global cleanup after each test
afterEach(async () => {
  await cleanTestData();
});
```

### **Rule: Sequential Test Execution with Vitest**

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    poolOptions: {
      threads: {
        singleThread: true, // ✅ Sequential execution
      },
    },
    hookTimeout: 60000, // 60 seconds for database operations
    testTimeout: 45000, // 45 seconds per test
  },
});
```

## 🔧 Integration Test Debugging Rules

### **Rule: Fix One Test at a Time**

**Process**:

1. Run individual failing tests to isolate issues
2. Identify root cause before implementing fixes
3. Verify fix with individual test before running full suite
4. Never use bandaid solutions like random suffixes

### **Rule: Identify Root Cause First**

**Common Root Causes**:

- Transaction isolation issues
- Missing test data setup
- Incorrect variable scope
- Service layer bypass
- Global state conflicts
- Missing repository mocks (for hybrid tests)
- Incomplete DTO definitions

**Debugging Strategy**:

- Run `npm run test:integration -- --reporter=verbose --testNamePattern="specific test"`
- Check if test passes individually
- Examine test data creation and cleanup
- Verify service method is actually being tested
- Check for missing required properties in DTOs

### **Rule: No Bandaid Solutions**

**Problem**: Random suffixes, global workarounds, and service bypass create maintenance nightmares.

**Solution**: Fix the root cause, even if it requires more refactoring.

```typescript
// ❌ AVOID - Random suffixes as bandaid
const randomSuffix = Math.random().toString(36).substring(7);
const user = await createUser({ email: `test-${randomSuffix}@example.com` });

// ✅ CORRECT - Proper test isolation
beforeEach(async () => {
  await cleanTestData(); // Start with clean slate
  const testData = await createTestShotData(); // Create fresh data
});
```

### **Rule: Entity Primary Key Verification**

**Problem**: Tests fail when accessing primary keys with wrong property names.

**Solution**: Always verify entity primary column names before writing tests.

```typescript
// ❌ WRONG - Assuming standard 'id' property
expect(result.id).toBeDefined();

// ✅ CORRECT - Check actual entity primary column
@PrimaryColumn({ name: 'shot_id' })
shot_id!: string;

expect(result.shot_id).toBeDefined();
```

### **Rule: Valid UUID Format in Tests**

**Problem**: Invalid UUIDs cause database validation errors instead of business logic errors.

**Solution**: Use valid UUID format for all UUID parameters in tests.

```typescript
// ❌ WRONG - Invalid UUID format
const invalidId = 'non-existent-id';

// ✅ CORRECT - Valid UUID format
const invalidId = '550e8400-e29b-41d4-a716-446655440001';
```

### **Rule: Service Return Type Verification**

**Problem**: Tests expect numbers but service returns formatted strings.

**Solution**: Verify actual service return types before writing assertions.

```typescript
// ❌ WRONG - Assuming number return type
expect(result.dose_grams).toBe(18.5);

// ✅ CORRECT - Matching actual string return type
expect(result.dose_grams).toBe('18.50');
```

### **Rule: Entity Relationship Understanding**

**Problem**: Tests fail when violating entity relationship constraints.

**Solution**: Understand entity relationships (1:1, 1:M, M:M) before creating test data.

```typescript
// ❌ WRONG - Multiple preparations for same shot (1:1 relationship)
await shotPreparationService.createShotPreparation({ shot_id: shot.id });
await shotPreparationService.createShotPreparation({ shot_id: shot.id }); // Overwrites first

// ✅ CORRECT - Separate shots for separate preparations
await shotPreparationService.createShotPreparation({ shot_id: shot1.id });
await shotPreparationService.createShotPreparation({ shot_id: shot2.id });
```

### **Rule: Test Actual Service Behavior**

**Problem**: Tests expect null returns but service throws errors for not found cases.

**Solution**: Test actual service behavior, not expected behavior.

```typescript
// ❌ WRONG - Expecting null when service throws error
const result = await service.getById('invalid-id');
expect(result).toBeNull();

// ✅ CORRECT - Expecting error when service throws error
await expect(service.getById('invalid-id')).rejects.toThrow('not found');
```

### **Rule: Unique Test Data Creation**

**Problem**: Tests share data or use conflicting entity relationships.

**Solution**: Create unique, isolated test data for each test scenario.

```typescript
// ❌ WRONG - Shared test data
let sharedShot: Shot;

beforeEach(async () => {
  sharedShot = await createShot();
});

// ✅ CORRECT - Fresh test data per test
describe('Service Method', () => {
  it('should handle scenario 1', async () => {
    const shot1 = await createShot();
    // Test with shot1
  });

  it('should handle scenario 2', async () => {
    const shot2 = await createShot();
    // Test with shot2
  });
});
```

### **Rule: Database Column Type Verification**

**Problem**: Tests fail when providing data types that don't match database column types.

**Solution**: Always verify database column types before creating test data.

```typescript
// ❌ WRONG - Decimal value for integer column
@Column({ name: 'roast_degree', type: 'integer' })
roastDegree!: number;

const testData = { roastDegree: 85.5 }; // Database error!

// ✅ CORRECT - Integer value for integer column
const testData = { roastDegree: 85 };
```

### **Rule: Service Data Transformation Understanding**

**Problem**: Tests expect original input types but services transform data.

**Solution**: Understand how services transform input data before writing assertions.

```typescript
// ❌ WRONG - Expecting original decimal input
const result = await service.create({ roastDegree: 85.5 });
expect(result.roastDegree).toBe(85.5); // Service converted to integer!

// ✅ CORRECT - Expecting transformed output
const result = await service.create({ roastDegree: 85.5 });
expect(result.roastDegree).toBe(85); // Service converts decimal to integer
```

### **Rule: Date Return Type Verification**

**Problem**: Services may return date strings instead of Date objects.

**Solution**: Verify actual service return types for date fields.

```typescript
// ❌ WRONG - Expecting Date object
const result = await service.getById(id);
expect(result.roastDate).toBeInstanceOf(Date);

// ✅ CORRECT - Expecting date string
const result = await service.getById(id);
expect(result.roastDate).toBe('2024-01-15'); // Service returns string
```

### **Rule: Foreign Key Dependency Creation**

**Problem**: Tests fail when foreign key validation fails for non-existent entities.

**Solution**: Create dependent entities before testing foreign key relationships.

```typescript
// ❌ WRONG - Non-existent foreign key
const batchData = { beanId: 'non-existent-bean-id' };
await service.create(batchData); // Foreign key violation!

// ✅ CORRECT - Create dependent entity first
const bean = await beanService.create(beanData);
const batchData = { beanId: bean.id };
await service.create(batchData); // Success!
```

### **Rule: Date Format Validation Compliance**

**Problem**: Services validate date string formats strictly.

**Solution**: Use proper date formats in test data.

```typescript
// ❌ WRONG - Invalid date format
const testData = { roastDate: 'invalid-date' };
await service.create(testData); // Date validation error!

// ✅ CORRECT - Valid date format
const testData = { roastDate: '2024-01-15' };
await service.create(testData); // Success!
```

### **Rule: Complete Repository Mocking for Hybrid Tests**

**Problem**: Integration tests that partially mock repositories cause inconsistent behavior.

**Solution**: Either fully mock (unit tests) or use real database (integration tests), never mix.

```typescript
// ❌ AVOID - Hybrid approach
const mockRepo = {
  findOne: jest.fn(), // Mocked
  save: realRepository.save, // Real - causes issues
};

// ✅ CORRECT - Pure integration
const realRepo = testDataSource.getRepository(Shot); // All real

// ✅ CORRECT - Pure unit
const mockRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  // All mocked
};
```

## 🐛 Common Pitfalls & Solutions

| Issue                               | Cause                       | Solution                                   |
| ----------------------------------- | --------------------------- | ------------------------------------------ |
| **PostgreSQL Type Conflicts**       | Multiple schema creation    | Initialize once, cleanup data              |
| **Test Data Leaking**               | Insufficient cleanup        | Use `TRUNCATE TABLE` with `CASCADE`        |
| **Connection Pool Exhaustion**      | Parallel tests              | Use `singleThread: true` in Vitest         |
| **Schema Creation Conflicts**       | Concurrent initialization   | Shared initialization with state checking  |
| **Multiple File Conflicts**         | Shared setup files          | Separate Vitest workspace projects         |
| **Transaction Isolation**           | Direct repository access    | Test through service layer only            |
| **Entity Not Found Errors**         | Wrong transaction context   | Create data in same context as service     |
| **Variable Scope Issues**           | Global test variables       | Each describe block manages its own data   |
| **Missing DTO Properties**          | Incomplete test data        | Include all required fields (userId, etc.) |
| **Vitest Worker Crashes**           | Memory limits exceeded      | Configure pool options and timeouts        |
| **Entity Primary Key Errors**       | Wrong property names        | Verify entity `@PrimaryColumn` names       |
| **UUID Validation Failures**        | Invalid UUID format         | Use valid UUID format in all test data     |
| **Service Return Type Mismatches**  | Assumed types               | Verify actual service return types         |
| **Entity Relationship Violations**  | Ignoring constraints        | Understand 1:1, 1:M, M:M relationships     |
| **Error Handling Mismatches**       | Expected vs actual behavior | Test actual service error handling         |
| **Test Data Conflicts**             | Shared or conflicting data  | Create unique data per test scenario       |
| **Database Column Type Mismatches** | Wrong data types            | Verify database column types before tests  |
| **Service Data Transformations**    | Unexpected conversions      | Understand service data transformations    |
| **Date Return Type Issues**         | Date objects vs strings     | Verify actual date return types            |
| **Foreign Key Violations**          | Missing dependent entities  | Create dependent entities first            |
| **Date Format Validation Errors**   | Invalid date formats        | Use proper date format strings             |

## 📋 Integration Test Checklist

- [ ] Single schema initialization per session
- [ ] Data cleanup between tests (TRUNCATE, not DROP/CREATE)
- [ ] Sequential execution (`singleThread: true`)
- [ ] Proper table names in cleanup
- [ ] Connection management in `afterAll`
- [ ] Error handling for cleanup failures
- [ ] Separate Vitest workspace projects for multiple files
- [ ] Isolated setup files per project
- [ ] Different database names per project
- [ ] Correct import paths for setup files
- [ ] Each test creates its own data
- [ ] No global variables shared between tests
- [ ] Tests go through service layer only
- [ ] No transaction isolation bypassing
- [ ] Root cause fixes, not bandaid solutions
- [ ] Complete DTO property inclusion
- [ ] Vitest timeout configurations
- [ ] Memory limit configurations
- [ ] **Entity primary key verification** before writing tests
- [ ] **Valid UUID format** for all UUID parameters
- [ ] **Service return type verification** before assertions
- [ ] **Entity relationship understanding** before test data creation
- [ ] **Actual service behavior testing** vs expected behavior
- [ ] **Unique test data creation** per test scenario
- [ ] **Database column type verification** before creating test data
- [ ] **Service data transformation understanding** before writing assertions
- [ ] **Date return type verification** for date field assertions
- [ ] **Foreign key dependency creation** before testing relationships
- [ ] **Date format validation compliance** for date field test data

## Test Structure

### **Integration Test Template**

```typescript
describe('Service Integration Tests', () => {
  let testDataSource: DataSource;
  let service: ShotService;

  beforeAll(async () => {
    // Initialize database connection once
    testDataSource = await initializeTestDataSource();
    service = new ShotService(testDataSource);
  });

  afterAll(async () => {
    // Clean up database connection
    if (testDataSource && testDataSource.isInitialized) {
      await testDataSource.destroy();
    }
  });

  describe('createShot', () => {
    let testData: any;

    beforeEach(async () => {
      // Create fresh test data for each test
      testData = await createTestShotData();
    });

    it('should create a shot with all related entities', async () => {
      // Arrange: Use fresh test data
      const shotData = {
        userId: testData.user.id,
        machineId: testData.machine.id,
        beanBatchId: testData.beanBatch.id,
        grinderId: testData.grinder.id,
        shot_type: 'espresso',
        pulled_at: new Date(),
      };

      // Act: Call service method
      const result = await service.createShot(shotData);

      // Assert: Verify result and database state
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.machine.id).toBe(testData.machine.id);
      expect(result.beanBatch.id).toBe(testData.beanBatch.id);
    });
  });
});
```

### **Transaction Testing Pattern**

```typescript
describe('Transaction Management', () => {
  it('should rollback on creation failure', async () => {
    // Arrange: Create partial valid data
    const testData = await createTestShotData();

    const invalidShotData = {
      userId: testData.user.id,
      machineId: testData.machine.id,
      beanBatchId: 'non-existent-batch', // This should fail
      grinderId: testData.grinder.id,
      shot_type: 'espresso',
      pulled_at: new Date(),
    };

    // Act & Assert: Should fail and rollback
    await expect(service.createShot(invalidShotData)).rejects.toThrow();

    // Verify no partial data was saved
    const shotsCount = await testDataSource.getRepository(Shot).count();
    const preparationsCount = await testDataSource.getRepository(ShotPreparation).count();

    expect(shotsCount).toBe(0);
    expect(preparationsCount).toBe(0);
  });
});
```

## 🔍 Debugging Integration Tests

### **Database Connection Issues**

```typescript
// Add connection debugging
const initializeTestDataSource = async (): Promise<DataSource> => {
  try {
    console.log('🔌 Initializing test database connection...');
    testDataSource = createCustomPostgresDataSource();
    await testDataSource.initialize();
    console.log('✅ Database connection established');
    return testDataSource;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};
```

### **Data Cleanup Debugging**

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
    'users',
    'grinders',
  ];

  for (const table of tables) {
    try {
      await testDataSource.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
      console.log(`✅ Cleaned table: ${table}`);
    } catch (error) {
      console.error(`❌ Failed to clean table ${table}:`, error);
      throw error;
    }
  }
};
```

### **Test Data Verification**

```typescript
// Helper to verify test data state
const verifyDatabaseState = async (expectedCounts: Record<string, number>) => {
  for (const [table, expectedCount] of Object.entries(expectedCounts)) {
    const actualCount = await testDataSource.getRepository(table).count();

    expect(actualCount).toBe(expectedCount);
    console.log(`✅ Table ${table}: ${actualCount}/${expectedCount} records`);
  }
};

// Usage in tests
await verifyDatabaseState({
  Shot: 1,
  ShotPreparation: 1,
  ShotExtraction: 1,
});
```

## Usage Commands

```bash
npm run test:integration                    # Run all integration tests
npm run test:integration:coverage          # Run with coverage
npm run test:integration:watch             # Watch mode
npm run test:integration -- --reporter=verbose --testNamePattern="specific test"  # Run single test
npm run test:integration -- --run          # Force run (bypass cache)
npm run test:integration -- --no-coverage  # Run without coverage for faster execution
```

## Vitest Configuration

### **Main Vitest Configuration**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    poolOptions: {
      threads: {
        singleThread: true, // Sequential execution for database tests
        isolate: false, // Share memory pool for efficiency
      },
    },
    hookTimeout: 60000, // 60 seconds for database setup/teardown
    testTimeout: 45000, // 45 seconds per individual test
    include: ['src/__tests__/integration/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'src/__tests__/', 'src/scripts/', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

### **Workspace Configuration for Multiple Test Files**

```typescript
// vitest.workspace.ts
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    extends: './vitest.config.ts',
    test: {
      name: 'integration-basic',
      include: ['src/__tests__/integration/services/ShotService.basic.integration.test.ts'],
      setupFiles: ['src/__tests__/setup.integration.basic.ts'],
      outputFile: {
        coverage: 'coverage-integration-basic',
      },
    },
  },
  {
    extends: './vitest.config.ts',
    test: {
      name: 'integration-main',
      include: ['src/__tests__/integration/services/ShotService.integration.test.ts'],
      setupFiles: ['src/__tests__/setup.integration.main.ts'],
      outputFile: {
        coverage: 'coverage-integration-main',
      },
    },
  },
]);
```

## Environment Setup

### **Database Configuration**

Integration tests require PostgreSQL database configuration:

```bash
# Environment variables
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=espresso_ml
DB_DATABASE_TEST=espresso_ml_test
```

### **Docker Setup for Integration Tests**

```yaml
# docker-compose.test.yml
version: '3.8'
services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_DB: espresso_ml_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data_test:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data_test:
```

### **Test Database Initialization**

```typescript
// setup.integration.ts
import { DataSource } from 'typeorm';
import { createCustomPostgresDataSource } from '../../data-source';

let testDataSource: DataSource;

export const initializeTestDataSource = async (): Promise<DataSource> => {
  if (!testDataSource) {
    console.log('🔌 Initializing test database connection...');
    testDataSource = createCustomPostgresDataSource();
    await testDataSource.initialize();
    console.log('✅ Database connection established');

    // Run migrations if needed
    await testDataSource.runMigrations();
    console.log('✅ Database migrations completed');
  }
  return testDataSource;
};

export const getTestDataSource = () => testDataSource;

export const cleanupTestDataSource = async () => {
  if (testDataSource && testDataSource.isInitialized) {
    await testDataSource.destroy();
    testDataSource = null;
    console.log('✅ Database connection closed');
  }
};
```

## Migration from Jest to Vitest

### **Key Differences**

| Feature                  | Jest                 | Vitest                                             |
| ------------------------ | -------------------- | -------------------------------------------------- |
| **Configuration**        | `jest.config.js`     | `vitest.config.ts`                                 |
| **Sequential Execution** | `runInBand: true`    | `poolOptions: { threads: { singleThread: true } }` |
| **Timeouts**             | `testTimeout: 30000` | `testTimeout: 45000, hookTimeout: 60000`           |
| **Coverage**             | Jest built-in        | V8 provider (faster)                               |
| **Workspace**            | `projects` array     | `workspace` function                               |
| **Watch Mode**           | `--watch`            | `--watch` (same)                                   |
| **Reporter**             | Default Jest         | More configurable options                          |

### **Migration Steps**

1. **Install Vitest**:

   ```bash
   npm install -D vitest @vitest/coverage-v8
   ```

2. **Create Vitest Config**:

   ```bash
   # Create vitest.config.ts based on jest.config.js
   cp jest.config.js vitest.config.ts.bak
   ```

3. **Update Package.json**:

   ```json
   {
     "scripts": {
       "test:integration": "vitest run --config vitest.config.ts",
       "test:integration:watch": "vitest --config vitest.config.ts",
       "test:integration:coverage": "vitest run --coverage --config vitest.config.ts"
     }
   }
   ```

4. **Update Setup Files**:
   - Change `setupFilesAfterEnv` to `setupFiles`
   - Update Jest-specific APIs to Vitest equivalents

### **Lessons Learned from Unit Test Debugging**

#### **Critical Issues Resolved**

1. **Missing DTO Properties**
   - **Problem**: Tests failing with "User with ID undefined not found"
   - **Solution**: Always include all required properties in test data
   - **Example**: `userId`, `grinderId` in `CreateShotData`

2. **Repository Mock Completeness**
   - **Problem**: Partial mocks causing inconsistent behavior
   - **Solution**: Either fully mock (unit) or use real database (integration)
   - **Never mix approaches**

3. **Query Runner Mocking**
   - **Problem**: Missing `findOne` method in query runner manager
   - **Solution**: Mock all required methods: `save`, `findOne`, etc.

4. **Test Data Structure Updates**
   - **Problem**: Deprecated properties like `notes` still in tests
   - **Solution**: Update test data to match current entity definitions

#### **Best Practices Applied**

```typescript
// ✅ Complete test data with all required fields
const validShotData: CreateShotData = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  machineId: '550e8400-e29b-41d4-a716-446655440000',
  beanBatchId: '550e8400-e29b-41d4-a716-446655440001',
  grinderId: '550e8400-e29b-41d4-a716-446655440002',
  shot_type: 'normale',
  success: true,
};

// ✅ Complete repository mocking
const mockUserRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  restore: jest.fn(),
};

// ✅ Complete query runner mocking
const mockQueryRunner = {
  connect: jest.fn().mockResolvedValue(undefined),
  startTransaction: jest.fn().mockResolvedValue(undefined),
  commitTransaction: jest.fn().mockResolvedValue(undefined),
  rollbackTransaction: jest.fn().mockResolvedValue(undefined),
  release: jest.fn().mockResolvedValue(undefined),
  manager: {
    save: jest.fn().mockResolvedValue(mockShot),
    findOne: jest.fn().mockResolvedValue(mockShot),
  },
};
```

#### **Debugging Strategy**

1. **Run Individual Tests First**:

   ```bash
   npm run test:integration -- --reporter=verbose --testNamePattern="specific test"
   ```

2. **Check for Missing Properties**:
   - Verify all DTO required fields are included
   - Check entity property names match current definitions

3. **Validate Mock Completeness**:
   - Ensure all repository methods are mocked
   - Check query runner manager has required methods

4. **Test Transaction Behavior**:
   - Verify rollback expectations match actual service logic
   - Test error handling paths explicitly

## Performance Optimization

### **Vitest Performance Benefits**

- **Faster Startup**: No need to parse entire codebase
- **Better Caching**: Intelligent file watching and caching
- **Modern V8 Integration**: Faster coverage collection
- **Memory Efficiency**: Better worker pool management

### **Configuration for Performance**

```typescript
// vitest.config.ts - Performance optimized
export default defineConfig({
  test: {
    poolOptions: {
      threads: {
        singleThread: true, // Required for database tests
        maxThreads: 1,
        minThreads: 1,
      },
    },
    // Increase timeouts for database operations
    hookTimeout: 60000,
    testTimeout: 45000,
    // Optimized coverage
    coverage: {
      provider: 'v8', // Faster than istanbul
      reporter: ['text', 'json'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

### **Test Data Management**

```typescript
// Create reusable test data builders
const createTestMachine = (overrides?: Partial<Machine>) => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  model: 'Test Machine',
  manufacturer: 'Test Manufacturer',
  ...overrides,
});

const createTestBeanBatch = (overrides?: Partial<BeanBatch>) => ({
  id: '550e8400-e29b-41d4-a716-446655440001',
  bean_id: 'test-bean-1',
  roast_date: new Date('2024-01-15'),
  origin: 'Test Origin',
  ...overrides,
});
```

### **Error Handling Tests**

```typescript
describe('Error Handling', () => {
  it('should handle foreign key constraint violations', async () => {
    // Arrange: Create invalid reference
    const invalidShotData = {
      userId: 'non-existent-user',
      machineId: 'non-existent-machine',
      beanBatchId: 'non-existent-batch',
      grinderId: 'non-existent-grinder',
      shot_type: 'espresso',
      pulled_at: new Date(),
    };

    // Act & Assert
    await expect(service.createShot(invalidShotData)).rejects.toThrow(
      'User with ID non-existent-user not found'
    );
  });
});
```

### **Performance Testing**

```typescript
describe('Performance', () => {
  it('should handle large datasets efficiently', async () => {
    // Arrange: Create large dataset
    const shots = Array.from({ length: 1000 }, (_, i) => ({
      id: `shot-${i}`,
      shot_type: 'espresso',
      pulled_at: new Date(),
    }));

    await testDataSource.getRepository(Shot).save(shots);

    // Act: Measure performance
    const startTime = Date.now();
    const result = await service.getShots({ page: 1, limit: 100 });
    const endTime = Date.now();

    // Assert
    expect(endTime - startTime).toBeLessThan(1000); // < 1 second
    expect(result.data.length).toBe(100);
  });
});
```
