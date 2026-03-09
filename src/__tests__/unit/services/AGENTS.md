# Service Unit Testing Guide

## 🎯 Service Testing Principles

- **Business Logic Focus**: Test core business rules and data transformations
- **Database Independence**: Mock all repository and external dependencies
- **Data Validation**: Test input validation and business rule enforcement
- **Error Handling**: Verify proper error responses and edge cases
- **Transaction Management**: Test database transaction behavior

## 🚨 Critical Rules for Services

### **Rule: Mock All Database Interactions**

Services depend on repositories - these must be completely mocked:

```typescript
// ✅ CORRECT - Complete repository mocking
const mockShotRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  restore: jest.fn(),
  findAndCount: jest.fn(),
  softDelete: jest.fn(),
  count: jest.fn(),
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
    save: jest.fn(),
    delete: jest.fn(),
  },
};

// ❌ WRONG - Incomplete mocking
const mockShotRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  // Missing many methods...
};
```

### **Rule: Test Business Logic, Not Database Operations**

```typescript
// ✅ GOOD - Test business behavior
it('should calculate extraction ratio correctly', async () => {
  const shotData = {
    dose: 18.5,
    extraction_time: 25,
    shot_type: 'espresso',
  };
  
  const result = await shotService.validateExtractionRatio(shotData);
  
  expect(result.isValid).toBe(true);
  expect(result.ratio).toBeCloseTo(1.35, 2);
});

// ❌ BAD - Test database calls
it('should call repository.save with correct data', async () => {
  await shotService.createShot(shotData);
  expect(mockShotRepository.save).toHaveBeenCalledWith(shotData);
});
```

### **Rule: Test Data Transformations and Validations**

```typescript
// ✅ GOOD - Test business rule enforcement
it('should validate espresso extraction time range', async () => {
  const espressoShot = {
    shot_type: 'espresso',
    extraction_time: 60, // Too long for espresso
  };
  
  const result = await shotService.validateBusinessRules(espressoShot);
  
  expect(result.isValid).toBe(false);
  expect(result.errors).toContainEqual({
    field: 'extraction_time',
    message: 'Espresso extraction time must be between 20-40 seconds',
  });
});
```

## 🛠️ Service Test Setup

### **Standard Service Mock Setup**

```typescript
import { ShotService } from '../../../src/services/ShotService';
import { DataSource } from 'typeorm';

describe('ShotService', () => {
  let shotService: ShotService;
  let mockDataSource: any;
  let mockShotRepository: any;
  let mockMachineRepository: any;
  let mockBeanBatchRepository: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock repositories
    mockShotRepository = createMockShotRepository();
    mockMachineRepository = createMockMachineRepository();
    mockBeanBatchRepository = createMockBeanBatchRepository();

    // Setup mock data source
    mockDataSource = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity.name === 'Shot') return mockShotRepository;
        if (entity.name === 'Machine') return mockMachineRepository;
        if (entity.name === 'BeanBatch') return mockBeanBatchRepository;
        return null;
      }),
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

    // Initialize service with mocked dependencies
    shotService = new ShotService(mockDataSource);
  });
});
```

### **Test Data Builders**

```typescript
// Reusable test data builders
const createTestShot = (overrides?: Partial<Shot>) => ({
  id: '550e8400-e29b-41d4-a716-446655440002',
  shot_type: 'espresso',
  dose: 18.5,
  extraction_time: 25,
  pulled_at: new Date('2024-01-15T10:30:00Z'),
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const createTestMachine = (overrides?: Partial<Machine>) => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  model: 'La Marzocco Linea Mini',
  manufacturer: 'La Marzocco',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const createTestBeanBatch = (overrides?: Partial<BeanBatch>) => ({
  id: '550e8400-e29b-41d4-a716-446655440001',
  bean_id: 'test-bean-1',
  roast_date: new Date('2024-01-10'),
  origin: 'Ethiopia',
  process: 'Washed',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});
```

## 🎯 Service Method Testing Patterns

### **CREATE Operations Testing**

```typescript
describe('createShot', () => {
  it('should create shot with all related entities', async () => {
    // Arrange
    const machine = createTestMachine();
    const beanBatch = createTestBeanBatch();
    const shotData = {
      machine_id: machine.id,
      bean_batch_id: beanBatch.id,
      shot_type: 'espresso',
      dose: 18.5,
      extraction_time: 25,
      pulled_at: new Date(),
    };

    mockMachineRepository.findOne.mockResolvedValue(machine);
    mockBeanBatchRepository.findOne.mockResolvedValue(beanBatch);
    mockShotRepository.save.mockResolvedValue(createTestShot(shotData));

    // Act
    const result = await shotService.createShot(shotData);

    // Assert
    expect(mockMachineRepository.findOne).toHaveBeenCalledWith({
      where: { id: machine.id },
    });
    expect(mockBeanBatchRepository.findOne).toHaveBeenCalledWith({
      where: { id: beanBatch.id },
    });
    expect(result).toBeDefined();
    expect(result.shot_type).toBe(shotData.shot_type);
    expect(mockShotRepository.save).toHaveBeenCalled();
  });

  it('should throw error when machine not found', async () => {
    // Arrange
    const shotData = {
      machine_id: 'non-existent-machine',
      bean_batch_id: '550e8400-e29b-41d4-a716-446655440001',
      shot_type: 'espresso',
    };

    mockMachineRepository.findOne.mockResolvedValue(null);

    // Act & Assert
    await expect(shotService.createShot(shotData)).rejects.toThrow('Machine not found');
    expect(mockShotRepository.save).not.toHaveBeenCalled();
  });

  it('should validate business rules before creation', async () => {
    // Arrange
    const invalidShotData = {
      machine_id: '550e8400-e29b-41d4-a716-446655440000',
      bean_batch_id: '550e8400-e29b-41d4-a716-446655440001',
      shot_type: 'espresso',
      dose: 18.5,
      extraction_time: 60, // Invalid for espresso
      pulled_at: new Date(),
    };

    mockMachineRepository.findOne.mockResolvedValue(createTestMachine());
    mockBeanBatchRepository.findOne.mockResolvedValue(createTestBeanBatch());

    // Act & Assert
    await expect(shotService.createShot(invalidShotData)).rejects.toThrow(
      'Espresso extraction time must be between 20-40 seconds'
    );
  });
});
```

### **READ Operations Testing**

```typescript
describe('getShotById', () => {
  it('should return shot with all relations', async () => {
    // Arrange
    const shotId = '550e8400-e29b-41d4-a716-446655440002';
    const expectedShot = createTestShot({
      id: shotId,
      machine: createTestMachine(),
      beanBatch: createTestBeanBatch(),
    });

    mockShotRepository.findOne.mockResolvedValue(expectedShot);

    // Act
    const result = await shotService.getShotById(shotId);

    // Assert
    expect(mockShotRepository.findOne).toHaveBeenCalledWith({
      where: { id: shotId },
      relations: ['machine', 'beanBatch', 'preparation', 'extraction'],
    });
    expect(result).toEqual(expectedShot);
  });

  it('should return null when shot not found', async () => {
    // Arrange
    const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
    mockShotRepository.findOne.mockResolvedValue(null);

    // Act
    const result = await shotService.getShotById(nonExistentId);

    // Assert
    expect(result).toBeNull();
    expect(mockShotRepository.findOne).toHaveBeenCalledWith({
      where: { id: nonExistentId },
      relations: ['machine', 'beanBatch', 'preparation', 'extraction'],
    });
  });

  it('should handle database errors', async () => {
    // Arrange
    const shotId = '550e8400-e29b-41d4-a716-446655440002';
    const dbError = new Error('Database connection failed');
    mockShotRepository.findOne.mockRejectedValue(dbError);

    // Act & Assert
    await expect(shotService.getShotById(shotId)).rejects.toThrow(dbError);
  });
});
```

### **UPDATE Operations Testing**

```typescript
describe('updateShot', () => {
  it('should update shot and related entities', async () => {
    // Arrange
    const shotId = '550e8400-e29b-41d4-a716-446655440002';
    const existingShot = createTestShot({ id: shotId });
    const updateData = {
      shot_type: 'ristretto',
      dose: 16.0,
    };

    mockShotRepository.findOne.mockResolvedValue(existingShot);
    mockShotRepository.save.mockResolvedValue({
      ...existingShot,
      ...updateData,
    });

    // Act
    const result = await shotService.updateShot(shotId, updateData);

    // Assert
    expect(mockShotRepository.findOne).toHaveBeenCalledWith({
      where: { id: shotId },
    });
    expect(mockShotRepository.save).toHaveBeenCalledWith({
      ...existingShot,
      ...updateData,
    });
    expect(result.shot_type).toBe(updateData.shot_type);
    expect(result.dose).toBe(updateData.dose);
  });

  it('should throw error when updating non-existent shot', async () => {
    // Arrange
    const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
    const updateData = { shot_type: 'ristretto' };
    mockShotRepository.findOne.mockResolvedValue(null);

    // Act & Assert
    await expect(shotService.updateShot(nonExistentId, updateData)).rejects.toThrow('Shot not found');
  });
});
```

### **DELETE Operations Testing**

```typescript
describe('deleteShot', () => {
  it('should soft delete shot and return true', async () => {
    // Arrange
    const shotId = '550e8400-e29b-41d4-a716-446655440002';
    const existingShot = createTestShot({ id: shotId });
    mockShotRepository.findOne.mockResolvedValue(existingShot);
    mockShotRepository.softDelete.mockResolvedValue({ affected: 1 });

    // Act
    const result = await shotService.deleteShot(shotId);

    // Assert
    expect(mockShotRepository.findOne).toHaveBeenCalledWith({
      where: { id: shotId },
    });
    expect(mockShotRepository.softDelete).toHaveBeenCalledWith(shotId);
    expect(result).toBe(true);
  });

  it('should return false when deleting non-existent shot', async () => {
    // Arrange
    const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
    mockShotRepository.findOne.mockResolvedValue(null);

    // Act
    const result = await shotService.deleteShot(nonExistentId);

    // Assert
    expect(result).toBe(false);
    expect(mockShotRepository.softDelete).not.toHaveBeenCalled();
  });
});
```

### **PAGINATION TESTING**

```typescript
describe('getShots', () => {
  it('should return paginated shots with default values', async () => {
    // Arrange
    const mockShots = [
      createTestShot(),
      createTestShot({ id: '550e8400-e29b-41d4-a716-446655440003' }),
    ];
    const mockCount = 15;

    mockShotRepository.findAndCount.mockResolvedValue([mockShots, mockCount]);

    // Act
    const result = await shotService.getShots({});

    // Assert
    expect(mockShotRepository.findAndCount).toHaveBeenCalledWith({
      relations: ['machine', 'beanBatch'],
      order: { pulled_at: 'DESC' },
      skip: 0,
      take: 10,
    });
    expect(result.data).toEqual(mockShots);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 10,
      total: mockCount,
      totalPages: Math.ceil(mockCount / 10),
    });
  });

  it('should handle custom pagination parameters', async () => {
    // Arrange
    const paginationParams = { page: 2, limit: 5 };
    const mockShots = [createTestShot()];
    mockShotRepository.findAndCount.mockResolvedValue([mockShots, 15]);

    // Act
    const result = await shotService.getShots(paginationParams);

    // Assert
    expect(mockShotRepository.findAndCount).toHaveBeenCalledWith({
      relations: ['machine', 'beanBatch'],
      order: { pulled_at: 'DESC' },
      skip: 5, // (page - 1) * limit
      take: 5,
    });
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.limit).toBe(5);
  });

  it('should handle filtering by machine ID', async () => {
    // Arrange
    const filters = { machine_id: '550e8400-e29b-41d4-a716-446655440000' };
    mockShotRepository.findAndCount.mockResolvedValue([[], 0]);

    // Act
    await shotService.getShots(filters);

    // Assert
    expect(mockShotRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { machine: { id: filters.machine_id } },
      })
    );
  });
});
```

## 🔍 Transaction Testing Patterns

### **Transaction Rollback Testing**

```typescript
describe('transaction management', () => {
  it('should rollback on creation failure', async () => {
    // Arrange
    const machine = createTestMachine();
    const invalidShotData = {
      machine_id: machine.id,
      bean_batch_id: 'non-existent-batch', // This will fail
      shot_type: 'espresso',
    };

    mockMachineRepository.findOne.mockResolvedValue(machine);
    mockBeanBatchRepository.findOne.mockResolvedValue(null);
    
    const mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
    };
    mockDataSource.manager.connection.createQueryRunner.mockReturnValue(mockQueryRunner);

    // Act
    await expect(shotService.createShot(invalidShotData)).rejects.toThrow('Bean batch not found');

    // Assert
    expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });

  it('should commit on successful creation', async () => {
    // Arrange
    const validShotData = {
      machine_id: '550e8400-e29b-41d4-a716-446655440000',
      bean_batch_id: '550e8400-e29b-41d4-a716-446655440001',
      shot_type: 'espresso',
    };

    mockMachineRepository.findOne.mockResolvedValue(createTestMachine());
    mockBeanBatchRepository.findOne.mockResolvedValue(createTestBeanBatch());
    mockShotRepository.save.mockResolvedValue(createTestShot(validShotData));
    
    const mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
    };
    mockDataSource.manager.connection.createQueryRunner.mockReturnValue(mockQueryRunner);

    // Act
    await shotService.createShot(validShotData);

    // Assert
    expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });
});
```

## 🔍 Business Logic Testing

### **Validation Rules Testing**

```typescript
describe('business rules validation', () => {
  describe('extraction ratio validation', () => {
    it('should validate espresso extraction ratio', () => {
      const espressoShot = {
        shot_type: 'espresso',
        dose: 18.5,
        extraction_time: 25,
      };

      const result = shotService.validateExtractionRatio(espressoShot);

      expect(result.isValid).toBe(true);
      expect(result.ratio).toBeCloseTo(1.35, 2);
    });

    it('should reject invalid espresso extraction ratio', () => {
      const espressoShot = {
        shot_type: 'espresso',
        dose: 18.5,
        extraction_time: 60, // Too long
      };

      const result = shotService.validateExtractionRatio(espressoShot);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'extraction_time',
        message: 'Espresso extraction time must be between 20-40 seconds',
      });
    });

    it('should validate ristretto extraction ratio', () => {
      const ristrettoShot = {
        shot_type: 'ristretto',
        dose: 16.0,
        extraction_time: 20,
      };

      const result = shotService.validateExtractionRatio(ristrettoShot);

      expect(result.isValid).toBe(true);
      expect(result.ratio).toBeCloseTo(1.25, 2);
    });
  });

  describe('date validation', () => {
    it('should accept recent dates', () => {
      const recentShot = {
        pulled_at: new Date(),
      };

      const result = shotService.validateShotDate(recentShot);

      expect(result.isValid).toBe(true);
    });

    it('should reject dates older than 1 year', () => {
      const oldShot = {
        pulled_at: new Date('2022-01-01'), // More than 1 year ago
      };

      const result = shotService.validateShotDate(oldShot);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'pulled_at',
        message: 'Shot date cannot be more than 1 year old',
      });
    });

    it('should reject future dates', () => {
      const futureShot = {
        pulled_at: new Date(Date.now() + 86400000), // Tomorrow
      };

      const result = shotService.validateShotDate(futureShot);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'pulled_at',
        message: 'Shot date cannot be in the future',
      });
    });
  });
});
```

## 🚨 Common Service Testing Pitfalls

### **Issue: Incomplete Repository Mocking**

```typescript
// ❌ WRONG - Missing transaction support
const mockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  // Missing QueryRunner support
};

// ✅ CORRECT - Complete repository mock with transactions
const mockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
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
```

### **Issue: Testing Implementation Details**

```typescript
// ❌ WRONG - Testing database query structure
it('should call repository with correct query', async () => {
  await shotService.getShotById('test-id');
  expect(mockShotRepository.findOne).toHaveBeenCalledWith({
    where: { id: 'test-id' },
    relations: ['machine', 'beanBatch'],
  });
});

// ✅ CORRECT - Testing business behavior
it('should return shot with related data', async () => {
  const result = await shotService.getShotById('test-id');
  expect(result).toBeDefined();
  expect(result.machine).toBeDefined();
  expect(result.beanBatch).toBeDefined();
});
```

### **Issue: Missing Error Scenarios**

```typescript
// ❌ WRONG - Only testing success path
describe('getShotById', () => {
  it('should return shot when found', async () => {
    // Only success test...
  });
});

// ✅ CORRECT - Testing all scenarios
describe('getShotById', () => {
  it('should return shot when found', async () => {
    // Success test...
  });

  it('should return null when not found', async () => {
    // Not found test...
  });

  it('should handle database errors', async () => {
    // Error test...
  });
});
```

## 📋 Service Test Checklist

### **Before Writing Tests:**

- [ ] Identify all repository dependencies
- [ ] Map business rules and validations
- [ ] Plan transaction scenarios
- [ ] Setup comprehensive repository mocks
- [ ] Create test data builders

### **For Each Test:**

- [ ] Arrange: Set up data and mocks
- [ ] Act: Call service method
- [ ] Assert business logic results
- [ ] Verify repository interactions
- [ ] Test error scenarios
- [ ] Check transaction behavior

### **Test Coverage Requirements:**

- [ ] CRUD operations (Create, Read, Update, Delete)
- [ ] Business rule validations
- [ ] Data transformations
- [ ] Pagination and filtering
- [ ] Transaction management
- [ ] Error handling and edge cases
- [ ] Database constraint violations

## 🔧 Service Testing Best Practices

### **Test Data Management**

```typescript
// Use factory functions for consistent test data
const createShotWithDefaults = (overrides: Partial<Shot> = {}) => {
  return createTestShot({
    shot_type: 'espresso',
    dose: 18.5,
    extraction_time: 25,
    pulled_at: new Date(),
    ...overrides,
  });
};

// Use in tests
it('should handle custom shot data', async () => {
  const customShot = createShotWithDefaults({
    shot_type: 'ristretto',
    dose: 16.0,
  });
  // Test with customShot...
});
```

### **Error Testing Patterns**

```typescript
// Test error scenarios systematically
const errorScenarios = [
  {
    name: 'invalid shot type',
    data: { shot_type: 'invalid' },
    expectedError: 'Invalid shot type',
  },
  {
    name: 'missing required field',
    data: { dose: 18.5 }, // Missing shot_type
    expectedError: 'Shot type is required',
  },
  {
    name: 'invalid UUID',
    data: { machine_id: 'invalid-uuid' },
    expectedError: 'Invalid machine ID format',
  },
];

errorScenarios.forEach(({ name, data, expectedError }) => {
  it(`should reject ${name}`, async () => {
    await expect(shotService.createShot(data)).rejects.toThrow(expectedError);
  });
});
```
