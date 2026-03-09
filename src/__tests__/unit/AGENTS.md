# Unit Testing Guide

## 🎯 Core Principles

- **Isolation**: Test individual functions/classes with all external dependencies mocked
- **Speed**: Deterministic and fast execution
- **Focus**: Test single responsibility, not implementation details
- **No Mocking Unit Under Test**: Cannot mock ShotService when testing ShotService

## 🚨 Critical Rules

### **Rule: Documenting Tests**

All test functions must include comments documenting the implementation of the test case and the expected outcome, including:

- Description of the behavior being tested
- Expected results from the tests
- Any required setup or teardown steps
- Input parameters for the test
- A list of all dependencies or external services used
- A list of mocked dependencies

### **Rule: Read Each File for Unit Under Test Before Writing Tests**

**Problem**: Writing tests without understanding actual dependencies leads to incorrect mocks.

**Solution**: Always analyze target file first.

```bash
# Before writing tests, map dependencies:
grep -r "getRepository\|findOne\|find" src/services/YourService.ts
```

### **🚨 Critical Rule: Test Behavior, Not Implementation**

**Problem**: Verifying mock calls tightly couples tests to implementation.

**Solution**: Test externally visible behavior/outcomes.

```typescript
// ✅ GOOD - Test behavior
it('should create machine successfully', async () => {
  const result = await machineService.create(validData);
  expect(result.id).toBeDefined();
  expect(result.model).toBe(validData.model);
});

// ❌ BAD - Test implementation
it('should call repository.save', async () => {
  await machineService.create(validData);
  expect(mockRepository.save).toHaveBeenCalledWith(data);
});
```

**When Implementation Testing IS Acceptable:**

- Void methods where side effect is the observable behavior
- External system coordination (logging, notifications)
- Security-critical parameter validation

### **Rule: Test What Users Care About**

Test **API response** and **database interactions**, not internal implementation flow:

```typescript
// Test: response (what users see)
expect(mockResponse.status).toHaveBeenCalledWith(404);

// Test: validation was attempted (what actually happened)
expect(mockBeanBatchRepo.findOne).toHaveBeenCalledWith({
  where: { id: '550e8400-e29b-41d4-a716-446655440001' },
});
```

### **Rule: Use Valid UUID Format for Test Data**

```typescript
// ❌ WRONG
machineId: 'test-machine-id'; // Invalid UUID

// ✅ CORRECT
machineId: '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
```

**Common Test UUIDs:**

- Machine IDs: `550e8400-e29b-41d4-a716-446655440000`
- Bean Batch IDs: `550e8400-e29b-41d4-a716-446655440001`
- Shot IDs: `550e8400-e29b-41d4-a716-446655440002`

### **🚨 Critical Rule: Improve Branch Coverage by Testing Error Handling**

**Problem**: High branch coverage requires testing all conditional branches, especially try/catch blocks and error handling paths that are often missed.

**Solution**: Systematically identify and test uncovered error handling branches.

```bash
# 1. Check coverage to find uncovered lines
npm run test:unit:coverage | grep -A 2 -B 2 "filename.ts"

# 2. Examine uncovered lines in source code
# Look for patterns like:
try {
  // success path (usually covered)
} catch (error) {
  console.error('Error message:', error);  // ← Often uncovered
  response.status(500).json({ message: 'Error message' });
}

if (condition) {
  // branch 1 (usually covered)
} else {
  // branch 2 (often uncovered)
}
```

**Branch Coverage Testing Pattern:**

```typescript
// ✅ GOOD - Test error handling branches
describe('controller method', () => {
  it('should handle database errors', async () => {
    // Arrange
    const error = new Error('Database connection failed');
    mockRepository.findOne.mockRejectedValue(error);

    // Act
    await controller.method(mockRequest, mockResponse);

    // Assert - Test error response
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Error fetching resource',
    });
  });

  it('should handle conditional null branch', async () => {
    // Arrange
    mockRequest.body = { field: null }; // Test null assignment
    const existingEntity = { id: '1', field: 'existing-value' };
    mockRepository.findOne.mockResolvedValue(existingEntity);

    // Act
    await controller.update(mockRequest, mockResponse);

    // Assert - Verify null was assigned
    expect(mockRepository.save).toHaveBeenCalledWith({
      ...existingEntity,
      field: null,
    });
  });
});
```

**Common Uncovered Branch Types:**

- **Database errors** in catch blocks (`mockRejectedValue`)
- **Validation failures** (missing required fields, invalid formats)
- **Conditional assignments** (parseInt conversions, null assignments)
- **Business rule violations** (ratio validations, date ranges)
- **Entity existence checks** (not found scenarios)

**Branch Coverage Checklist:**

- [ ] Test all try/catch blocks with `mockRejectedValue`
- [ ] Test conditional branches with both true/false inputs
- [ ] Test parseInt conversions with invalid inputs
- [ ] Test null/undefined assignments explicitly
- [ ] Test business rule validations with boundary values
- [ ] Test "not found" scenarios with `mockResolvedValue(null)`
- [ ] Verify error response format and status codes

## 🛠️ Mock Setup Patterns

### **Complete Repository Mock**

```typescript
const mockMachineRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  restore: jest.fn(),
  findAndCount: jest.fn().mockResolvedValue([[], 0]),
  softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
  count: jest.fn().mockResolvedValue(0),
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
```

### **Test Data Constants**

```typescript
const TEST_DATA = {
  MACHINE_ID: '550e8400-e29b-41d4-a716-446655440000',
  BEAN_BATCH_ID: '550e8400-e29b-41d4-a716-446655440001',
  SHOT_ID: '550e8400-e29b-41d4-a716-446655440002',
};
```

### **Rule: Complete Entity Coverage in Mocks**

**Problem**: Missing entity mocks cause cascading failures.

```typescript
// ✅ COMPLETE MOCKING
const createMockDataSource = () => ({
  getRepository: jest.fn().mockImplementation(entity => {
    if (entity === Machine) return createMockMachineRepo();
    if (entity === BeanBatch) return createMockBeanBatchRepo();
    if (entity === Shot) return createMockShotRepo();
    return createMockDefaultRepo();
  }),
});
```

**Mock Coverage Checklist:**

- [ ] All repository entities mocked
- [ ] Complete method coverage (findOne, save, remove, create, update, delete, restore)
- [ ] QueryRunner support for transactions
- [ ] Valid UUID format for all IDs
- [ ] Default fallback for unknown entities

## 🔧 Edit Strategies

### **Rule: Use Unique Context for Edits**

```typescript
// ❌ WRONG - Ambiguous patterns
edit('restore: jest.fn(),', 'restore: jest.fn(),\n  findAndCount: jest.fn()');

// ✅ CORRECT - Unique context
edit('if (entity === Shot) {\n  return {\n    findOne: jest.fn()...', 'complete replacement');
```

### **Rule: Import Required Types**

```typescript
import { Repository } from 'typeorm'; // ✅ Required for type annotations
```

### **Edit Strategy Checklist**

- [ ] Search for target string to verify uniqueness
- [ ] Check import dependencies
- [ ] Analyze previous failures
- [ ] Use broader context for uniqueness
- [ ] Test compilation after changes

## 🎯 General Unit Test Structure

### **Test Data Setup**

```typescript
describe('Any Unit Test Suite', () => {
  beforeEach(() => {
    // Reset all mocks to ensure clean state
    mockRepository.findOne.mockClear();
    mockRepository.save.mockClear();
    mockResponse.status.mockClear();
    mockResponse.json.mockClear();
    mockNext.mockClear();

    console.log('🔄 MOCKS RESET: All mocks cleared');
  });

  it('should test specific behavior', async () => {
    // Arrange: Set up test data and mocks
    const testData = {
      id: 'test-id',
      property: 'test-value',
    };

    mockRepository.findOne.mockResolvedValue(mockEntity);

    // Act: Execute method under test
    const result = await service.method(testData);

    // Assert: Test behavior, not implementation
    expect(result).toBeDefined();
    expect(result.property).toBe(expectedValue);

    // Verify: Check that right interactions occurred
    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'test-id' },
    });

    console.log('✅ TEST COMPLETE: All assertions passed');
  });
});
```

## 🔍 Debugging Unit Tests

### **Step-by-Step Debugging Strategy**

When any unit tests fail, add debug statements to trace execution:

```typescript
// 1. Add debug to test setup
console.log('🧪 TEST START:', test.name);
console.log('📋 TEST DATA:', mockRequest.body);
console.log('🔧 MOCKS SET:', {
  machineRepo: 'machine-1',
  beanBatchRepo: null,
});

// 2. Add debug to service method calls
console.log('🔧 SERVICE CALL:', methodName, inputData);

// 3. Add debug to repository interactions
console.log('🗄️ REPO CALL:', 'findOne', { where: { id: 'test-id' } });

// 4. Add debug to assertions
console.log('📊 ASSERTION RESULTS:', {
  actual: actualValue,
  expected: expectedValue,
});
```

### **Common Debugging Patterns**

| Issue                         | Debug Strategy                                    |
| ----------------------------- | ------------------------------------------------- |
| **Service method not called** | Log service method calls and input parameters     |
| **Repository not called**     | Log repository setup and verify mock calls        |
| **Mock returning wrong data** | Log mock return values and verify setup           |
| **Unexpected async behavior** | Add await logging and check Promise states        |
| **Type errors**               | Log actual vs expected types and error messages   |
| **Test setup issues**         | Log beforeEach/afterEach execution order          |
| **Undefined functions**       | Check setup files for module mocks                |
| **Module import issues**      | Verify exports vs imports and mock configurations |

### **Universal Debugging Template**

```typescript
describe('Service/Controller/Entity Tests', () => {
  beforeEach(() => {
    console.log('🔄 SETUP START: Resetting all mocks');
    // Reset mocks...
    console.log('✅ SETUP COMPLETE');
  });

  it('should handle specific scenario', async () => {
    console.log('🧪 TEST START:', 'should handle specific scenario');

    // Arrange
    const testData = {
      /* test data */
    };
    console.log('📋 TEST DATA:', testData);

    // Act
    console.log('⚡ ACTION START: Calling method');
    const result = await service.method(testData);
    console.log('⚡ ACTION RESULT:', result);

    // Assert
    console.log('🔍 ASSERTION START');
    expect(result.property).toBe(expectedValue);
    console.log('✅ TEST COMPLETE');
  });
});
```

## 🚨 Debugging Mock and Import Issues

### **Problem**: Functions that should exist are `undefined` in tests.

**Root Cause**: Module is being mocked in setup files, preventing access to real implementation.

**Debug Strategy**:

```typescript
// 1. Check what's actually imported
import * as module from './target-module';
console.log('Available exports:', Object.keys(module));
console.log('Function type:', typeof module.targetFunction);

// 2. Check setup files for mocks
// In setup.unit.ts:
jest.mock('./target-module', () => ({
  targetFunction: jest.fn(), // This causes undefined exports
}));

// 3. Unmock for behavior testing
jest.unmock('./target-module');
import { targetFunction } from './target-module';
```

### **Problem**: Mocked implementations don't test actual behavior.

**Solution**: Use `jest.unmock()` when unit under test is already being mocked in setup file to access real implementation for behavior testing.

```typescript
// ✅ GOOD - Test actual behavior
describe('Real Implementation Tests', () => {
  beforeEach(() => {
    jest.unmock('../middleware/errorHandler');
  });

  it('should handle real errors', () => {
    // Tests actual implementation behavior
  });
});
```

## Usage Commands

```bash
npm run test:unit                    # Run all unit tests
npm run test:unit:coverage          # Run with coverage
npm run test:unit:watch             # Watch mode
```
