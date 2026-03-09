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
  ];

  for (const table of tables) {
    await testDataSource.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
  }
};

beforeEach(async () => {
  await cleanTestData(); // Safe data cleanup only
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

## 🐛 Common Pitfalls & Solutions

| Issue                          | Cause                     | Solution                                  |
| ------------------------------ | ------------------------- | ----------------------------------------- |
| **PostgreSQL Type Conflicts**  | Multiple schema creation  | Initialize once, cleanup data             |
| **Test Data Leaking**          | Insufficient cleanup      | Use `TRUNCATE TABLE` with `CASCADE`       |
| **Connection Pool Exhaustion** | Parallel tests            | Use `runInBand: true`                     |
| **Schema Creation Conflicts**  | Concurrent initialization | Shared initialization with state checking |
| **Multiple File Conflicts**    | Shared setup files        | Separate Jest projects                    |

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

  beforeEach(async () => {
    // Clean data before each test
    await cleanTestData();
  });

  describe('createShot', () => {
    it('should create a shot with all related entities', async () => {
      // Arrange: Create test data in database
      const machine = await testDataSource.getRepository(Machine).save({
        id: '550e8400-e29b-41d4-a716-446655440000',
        model: 'La Marzocco Linea Mini',
        manufacturer: 'La Marzocco',
      });

      const beanBatch = await testDataSource.getRepository(BeanBatch).save({
        id: '550e8400-e29b-41d4-a716-446655440001',
        bean_id: 'test-bean-1',
        roast_date: new Date('2024-01-15'),
        origin: 'Ethiopia',
      });

      const shotData = {
        machine_id: machine.id,
        bean_batch_id: beanBatch.id,
        shot_type: 'espresso',
        pulled_at: new Date(),
      };

      // Act: Call service method
      const result = await service.createShot(shotData);

      // Assert: Verify result and database state
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.machine_id).toBe(machine.id);
      expect(result.bean_batch_id).toBe(beanBatch.id);

      // Verify database relationships
      const savedShot = await testDataSource.getRepository(Shot).findOne({
        where: { id: result.id },
        relations: ['machine', 'beanBatch', 'preparation', 'extraction'],
      });

      expect(savedShot).toBeDefined();
      expect(savedShot.machine.id).toBe(machine.id);
      expect(savedShot.beanBatch.id).toBe(beanBatch.id);
    });
  });
});
```

### **Transaction Testing Pattern**

```typescript
describe('Transaction Management', () => {
  it('should rollback on creation failure', async () => {
    // Arrange: Create partial valid data
    const machine = await testDataSource.getRepository(Machine).save({
      id: '550e8400-e29b-41d4-a716-446655440000',
      model: 'Test Machine',
    });

    const invalidShotData = {
      machine_id: machine.id,
      bean_batch_id: 'non-existent-batch', // This should fail
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
    const actualCount = await testDataSource
      .getRepository(table)
      .count();
    
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
DB_DATABASE=espresso_ml_test
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
      - "5432:5432"
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
      machine_id: 'non-existent-machine',
      bean_batch_id: 'non-existent-batch',
      shot_type: 'espresso',
      pulled_at: new Date(),
    };

    // Act & Assert
    await expect(service.createShot(invalidShotData))
      .rejects.toThrow('Foreign key constraint violation');
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
