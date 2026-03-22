# Integration Testing Guide

## 🎯 Core Principles

- **Real Dependencies**: Use actual database and external services
- **Component Interaction**: Test how multiple components work together
- **Database Constraints**: Verify real database behavior
- **Sequential Execution**: Avoid race conditions

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

### **Rule: Sequential Test Execution**

```javascript
// jest.config.js
projects: [
  {
    displayName: 'integration',
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/src/__tests__/integration/**/*.test.ts'],
    runInBand: true, // ✅ Sequential execution
  },
],
```

### **Rule: Separate Jest Projects for Multiple Files**

**Problem**: Multiple integration test files sharing setup cause conflicts.

**Solution**: Separate projects with isolated databases.

```javascript
projects: [
  {
    displayName: 'integration-basic',
    testMatch: ['<rootDir>/src/__tests__/integration/services/ShotService.basic.integration.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.integration.basic.ts'],
    runInBand: true,
  },
  {
    displayName: 'integration-main',
    testMatch: ['<rootDir>/src/__tests__/integration/services/ShotService.integration.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.integration.main.ts'],
    runInBand: true,
  },
],
```

## � Integration Test Debugging Rules

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

**Debugging Strategy**:
- Run `npm run test:integration -- --testNamePattern="specific test"`
- Check if test passes individually
- Examine test data creation and cleanup
- Verify service method is actually being tested

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

## �🐛 Common Pitfalls & Solutions

| Issue                          | Cause                     | Solution                                  |
| ------------------------------ | ------------------------- | ----------------------------------------- |
| **PostgreSQL Type Conflicts**  | Multiple schema creation  | Initialize once, cleanup data             |
| **Test Data Leaking**          | Insufficient cleanup      | Use `TRUNCATE TABLE` with `CASCADE`       |
| **Connection Pool Exhaustion** | Parallel tests            | Use `runInBand: true`                     |
| **Schema Creation Conflicts**  | Concurrent initialization | Shared initialization with state checking |
| **Multiple File Conflicts**    | Shared setup files        | Separate Jest projects                    |
| **Transaction Isolation**     | Direct repository access   | Test through service layer only           |
| **Entity Not Found Errors**    | Wrong transaction context  | Create data in same context as service     |
| **Variable Scope Issues**      | Global test variables     | Each describe block manages its own data   |

## 📋 Integration Test Checklist

- [ ] Single schema initialization per session
- [ ] Data cleanup between tests (TRUNCATE, not DROP/CREATE)
- [ ] Sequential execution (`runInBand: true`)
- [ ] Proper table names in cleanup
- [ ] Connection management in `afterAll`
- [ ] Error handling for cleanup failures
- [ ] Separate Jest projects for multiple files
- [ ] Isolated setup files per project
- [ ] Different database names per project
- [ ] Correct import paths for setup files
- [ ] Each test creates its own data
- [ ] No global variables shared between tests
- [ ] Tests go through service layer only
- [ ] No transaction isolation bypassing
- [ ] Root cause fixes, not bandaid solutions

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
npm run test:integration            # Run all integration tests
npm run test:integration:coverage    # Run with coverage
npm run test:integration:watch       # Watch mode
npm run test:integration -- --testNamePattern="specific test"  # Run single test
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
```

### **Docker Setup for Integration Tests**

```yaml
# docker-compose.test.yml
version: '3.8'
services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_DB: espresso_ml
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data_test:/var/lib/postgresql/data

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
    testDataSource = createCustomPostgresDataSource();
    await testDataSource.initialize();
  }
  return testDataSource;
};

export const getTestDataSource = () => testDataSource;
```

## Best Practices

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
