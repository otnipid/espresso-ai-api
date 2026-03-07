---
trigger: always_on
---

# Unit Tests & Integration Tests Guide

## 📋 Quick Reference

| Test Type | When to Use | File Pattern | Key Characteristics |
|-----------|-------------|--------------|-------------------|
| **Unit** | Test business logic in isolation | `*.unit.test.ts` | Mocked dependencies, fast, no DB |
| **Integration** | Test component interactions | `*.integration.test.ts` | Real DB, external dependencies |

---

# Unit Tests

## Core Principles

- **Isolation**: Test individual functions/classes with all external dependencies mocked
- **Speed**: Deterministic and fast execution
- **Focus**: Test single responsibility, not implementation details
- **No Mocking Unit Under Test**: Cannot mock ShotService when testing ShotService

## 🚨 Critical Rules

### **Rule: Read Each File for Unit Under Test Before Writing Tests**

**Problem**: Writing tests without understanding actual dependencies leads to incorrect mocks.

**Solution**: Always analyze the target file first.

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

Test the **API response** and **database interactions**, not internal implementation flow:

```typescript
// Test: response (what users see)
expect(mockResponse.status).toHaveBeenCalledWith(404);

// Test: validation was attempted (what actually happened)
expect(mockBeanBatchRepo.findOne).toHaveBeenCalledWith({
  where: { id: '550e8400-e29b-41d4-a716-446655440001' }
});
```

### **Rule: Use Valid UUID Format for Test Data**

```typescript
// ❌ WRONG
machineId: 'test-machine-id' // Invalid UUID

// ✅ CORRECT
machineId: '550e8400-e29b-41d4-a716-446655440000' // Valid UUID
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
      message: 'Error fetching resource'
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
      field: null
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

---

# Integration Tests

## Core Principles

- **Real Dependencies**: Use actual database and external services
- **Component Interaction**: Test how multiple components work together
- **Database Constraints**: Verify real database behavior
- **Sequential Execution**: Avoid race conditions

## 🚨 Critical Rules

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
  const tables = ['shots', 'shot_preparation', 'shot_extraction', 'shot_environment', 'shot_feedback', 'bean_batches', 'machines', 'bean'];
  
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

| Issue | Cause | Solution |
|-------|--------|----------|
| **PostgreSQL Type Conflicts** | Multiple schema creation | Initialize once, cleanup data |
| **Test Data Leaking** | Insufficient cleanup | Use `TRUNCATE TABLE` with `CASCADE` |
| **Connection Pool Exhaustion** | Parallel tests | Use `runInBand: true` |
| **Schema Creation Conflicts** | Concurrent initialization | Shared initialization with state checking |
| **Multiple File Conflicts** | Shared setup files | Separate Jest projects |

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

---

# Jest Matcher Syntax Rules

## 🚨 Critical Syntax Rules

### **Common Syntax Errors**

```typescript
// ❌ WRONG - Extra closing parenthesis
expect(methodString).toMatch(/options\s*=\s*\{\}/)); // ← Extra )

// ❌ WRONG - Missing closing parenthesis  
expect(methodString).toMatch(/options\s*=\s*\{\}/; // ← Missing )

// ❌ WRONG - String instead of regex
expect(methodString).toMatch('/options\s*=\s*\{\}/'); // ← Quotes around regex
```

```typescript
// ✅ CORRECT - Proper syntax
expect(methodString).toMatch(/options\s*=\s*\{\}/); // Regex literal
expect(methodString).toContain('options = {}'); // String literal
```

### **Syntax Checklist**

Before committing test changes:
- [ ] All `expect()` calls have proper closing parenthesis
- [ ] Regex literals use `/pattern/`, not `'/pattern/'`
- [ ] String matchers use `'string'` or `"string"`
- [ ] No extra closing parentheses
- [ ] No missing closing parentheses
- [ ] Proper semicolon at end of line

### **Common Matcher Patterns**

```typescript
// String matchers
expect(text).toContain('substring');
expect(text).toEqual('exact string');

// Regex matchers  
expect(text).toMatch(/pattern/);
expect(text).toMatch(/pattern\s*with\s*spaces/);

// Number matchers
expect(number).toBeGreaterThan(5);
expect(number).toBeLessThanOrEqual(10);

// Boolean matchers
expect(boolean).toBe(true);
expect(boolean).toBeFalsy();
```

---

# Usage Commands

## Unit Tests
```bash
npm run test:unit                    # Run all unit tests
npm run test:unit:coverage          # Run with coverage
npm run test:unit:watch             # Watch mode
```

## Integration Tests  
```bash
npm run test:integration            # Run all integration tests
npm run test:integration:coverage    # Run with coverage
npm run test:integration:watch       # Watch mode
```

## All Tests
```bash
npm run test                         # Run all tests (unit + integration)
npm run test:coverage               # Run all tests with coverage
npm run test:watch                  # Run all tests in watch mode
```
---
# General Debugging Guide

## 🔍 Debugging Unit Tests

### **Step-by-Step Debugging Strategy**

When any unit tests fail, add debug statements to trace execution:

```typescript
// 1. Add debug to test setup
console.log('🧪 TEST START:', test.name);
console.log('📋 TEST DATA:', mockRequest.body);
console.log('🔧 MOCKS SET:', {
  machineRepo: 'machine-1',
  beanBatchRepo: null
});

// 2. Add debug to service method calls
console.log('🔧 SERVICE CALL:', methodName, inputData);

// 3. Add debug to repository interactions
console.log('🗄️ REPO CALL:', 'findOne', { where: { id: 'test-id' } });

// 4. Add debug to assertions
console.log('📊 ASSERTION RESULTS:', {
  actual: actualValue,
  expected: expectedValue
});
```

### **Common Debugging Patterns**

| Issue | Debug Strategy |
|-------|----------------|
| **Service method not called** | Log service method calls and input parameters |
| **Repository not called** | Log repository setup and verify mock calls |
| **Mock returning wrong data** | Log mock return values and verify setup |
| **Unexpected async behavior** | Add await logging and check Promise states |
| **Type errors** | Log actual vs expected types and error messages |
| **Test setup issues** | Log beforeEach/afterEach execution order |
| **Undefined functions** | Check setup files for module mocks |
| **Module import issues** | Verify exports vs imports and mock configurations |

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
    const testData = { /* test data */ };
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

**Solution**: Use `jest.unmock()` when the unit under test is already being mocked in the setup file to access real implementation for behavior testing.

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
      property: 'test-value'
    };
    
    mockRepository.findOne.mockResolvedValue(mockEntity);

    // Act: Execute the method under test
    const result = await service.method(testData);

    // Assert: Test behavior, not implementation
    expect(result).toBeDefined();
    expect(result.property).toBe(expectedValue);
    
    // Verify: Check that right interactions occurred
    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'test-id' }
    });
    
    console.log('✅ TEST COMPLETE: All assertions passed');
  });
});
```

---

# Middleware Testing Guide

## 🎯 Express Middleware Array Pattern

### **Understanding Middleware Chains**

Express middleware arrays execute functions sequentially:
```typescript
export const validateCreateShot = [
  validate(CreateShotSchema, 'body'),      // 1st: Schema validation
  validateMachineExists,                   // 2nd: Database validation
  validateBeanBatchExists,                 // 3rd: Database validation
  validateShotBusinessRules,              // 4th: Business rules
];
```

### **Rule: Apply General Testing Principles to Middleware**

For middleware testing, apply the **general unit testing rules**:

- **Test Behavior, Not Implementation** - Focus on response outcomes, not `next()` calls
- **Test What Users Care About** - Verify API responses and database interactions
- **Use Valid UUID Format** - Ensure proper test data format

```typescript
// ✅ CORRECT - Apply general principles to middleware
expect(mockResponse.status).toHaveBeenCalledWith(404);
expect(mockBeanBatchRepo.findOne).toHaveBeenCalledWith({
  where: { id: '550e8400-e29b-41d4-a716-446655440001' }
});

// ❌ WRONG - Testing implementation details
expect(mockNext).not.toHaveBeenCalled();
expect(mockNext).toHaveBeenCalledTimes(2);
```



## 🛠️ Middleware Testing Helper

### **runMiddleware Helper Pattern**

```typescript
const runMiddleware = async (middleware: any[], req: Request, res: Response, next: NextFunction) => {
  // Using index-based for-loop rather than iterator to assist with any future debugging
  for (let i = 0; i < middleware.length; i++) {
    const fn = middleware[i];
    await fn(req, res, next);
    
    // Check if an error response was sent by looking at status call history
    if ((res.status as any).mock.calls.length > 0) {
      // Stop if any response was sent (success or error)
      return;
    }
  }
};
```

## 🔍 Middleware-Specific Debugging Examples

### **Mock Detection in Middleware Testing**

When middleware functions are `undefined`, check for module mocks:

```typescript
// ❌ PROBLEM - Middleware function undefined
import { performanceMonitor } from '../middleware/errorHandler';
console.log(typeof performanceMonitor); // undefined

// ✅ SOLUTION - Check setup files for mocks
// In setup.unit.ts:
jest.mock('../middleware/errorHandler', () => ({
  performanceMonitor: jest.fn(), // This causes undefined exports
}));

// ✅ SOLUTION - Unmock for behavior testing
jest.unmock('../middleware/errorHandler');
import { performanceMonitor } from '../middleware/errorHandler';
```

### **Behavior Testing for Error Handler Middleware**

```typescript
// ✅ GOOD - Test actual error handling behavior
describe('errorHandler', () => {
  beforeEach(() => {
    jest.unmock('../middleware/errorHandler'); // Access real implementation
  });

  it('should handle Zod validation errors', () => {
    const zodError = new ZodError([/* ... */]);
    
    errorHandler(zodError, mockRequest, mockResponse, mockNext);
    
    // Test behavior: response status and content
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Validation Error',
      message: 'Invalid input data provided',
      code: 'VALIDATION_FAILED'
    });
  });
});
```

### **Debug Logging for Middleware Execution**

```typescript
// ✅ GOOD - Middleware execution tracing
describe('performanceMonitor', () => {
  it('should monitor request performance', () => {
    console.log('🧪 TEST START: performance monitor');
    console.log('📋 TEST DATA:', { request: mockRequest });
    
    performanceMonitor(mockRequest, mockResponse, mockNext);
    
    console.log('🔧 MOCK CALLS:', {
      nextCalls: mockNext.mock.calls,
      responseOnCalls: mockResponse.on.mock.calls
    });
    
    // Assert behavior: next() called, event listener attached
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });
});
```

### **Testing Middleware Chain Behavior**

```typescript
// ✅ GOOD - Test middleware chain outcomes
describe('validateCreateShot middleware chain', () => {
  it('should stop chain on validation failure', async () => {
    const invalidData = { /* invalid shot data */ };
    
    await runMiddleware(validateCreateShot, mockRequest, mockResponse, mockNext);
    
    // Test behavior: validation error response
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Validation Error',
      message: expect.stringContaining('Invalid input')
    });
  });
});
```

### **Why Index-Based Loop?**

- **Debugging Support**: Enables position tracking (`middleware-${i}`)
- **Future Troubleshooting**: Easy to add logging for failing middleware
- **Maintainability**: Clear indication of execution position

## 🔍 Debugging Middleware Tests

### **Step-by-Step Debugging Strategy**

When middleware tests fail, add debug statements to trace execution:

```typescript
// 1. Add debug to runMiddleware
console.log(`📍 MIDDLEWARE ${i + 1}/${middleware.length}: ${fnName}`);

// 2. Add debug to individual middleware functions
console.log('🔍 VALIDATEMACHINE: Looking for machineId:', machineId);

// 3. Add debug to test setup
console.log('🔧 MOCKS SET:', { machineRepo: 'machine-1' });
```

### **Common Debugging Patterns**

| Issue | Debug Strategy |
|-------|----------------|
| **Wrong middleware called** | Log middleware names and execution order |
| **Mock not being called** | Log mock setup and verify repository calls |
| **Response not sent** | Log status calls and check middleware return paths |
| **Unexpected next() calls** | Log each middleware's decision logic |

## 🎯 Middleware Test Structure

### **Test Data Setup**

```typescript
describe('validateCreateShot', () => {
  beforeEach(() => {
    // Reset all mocks to ensure clean state
    mockMachineRepo.findOne.mockClear();
    mockBeanBatchRepo.findOne.mockClear();
    mockShotRepo.findOne.mockClear();
    mockResponse.status.mockClear();
    mockResponse.json.mockClear();
    mockNext.mockClear();
  });

  it('should fail validation when bean batch not found', async () => {
    // Arrange: Set up test data and mocks
    mockRequest.body = {
      machineId: '550e8400-e29b-41d4-a716-446655440000',
      beanBatchId: '550e8400-e29b-41d4-a716-446655440001',
      shot_type: 'normale',
    };

    mockMachineRepo.findOne.mockResolvedValue({ id: 'machine-1' });
    mockBeanBatchRepo.findOne.mockResolvedValue(null);

    // Act: Run middleware chain
    await runMiddleware(
      shotValidation.validateCreateShot,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert: Test behavior, not implementation
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Validation failed',
      message: 'Bean batch not found',
      field: 'beanBatchId',
    });
    
    // Verify the right validation was attempted
    expect(mockBeanBatchRepo.findOne).toHaveBeenCalledWith({
      where: { id: '550e8400-e29b-41d4-a716-446655440001' }
    });
  });
});
```

## 🚨 Common Middleware Testing Pitfalls

### **Issue: Mock State Contamination**

**Problem**: Mocks persist between tests causing unexpected behavior.

**Solution**: Comprehensive mock reset in `beforeEach`.

```typescript
beforeEach(() => {
  mockMachineRepo.findOne.mockClear();
  mockBeanBatchRepo.findOne.mockClear();
  mockShotRepo.findOne.mockClear();
  mockResponse.status.mockClear();
  mockResponse.json.mockClear();
  mockNext.mockClear();
});
```

### **Issue: Wrong Test Expectations**

**Problem**: Expecting `next()` not to be called when earlier middleware should call it.

**Solution**: Understand middleware execution flow and test appropriate behavior.

```typescript
// Wrong: Assumes no next() calls
expect(mockNext).not.toHaveBeenCalled();

// Correct: Tests the actual response
expect(mockResponse.status).toHaveBeenCalledWith(404);
```

### **Issue: Testing Implementation Details**

**Problem**: Testing how many times `next()` was called.

**Solution**: Test the final outcome and database interactions.

```typescript
// Brittle: Tests internal flow
expect(mockNext).toHaveBeenCalledTimes(2);

// Robust: Tests external behavior
expect(mockResponse.status).toHaveBeenCalledWith(404);
expect(mockBeanBatchRepo.findOne).toHaveBeenCalled();
```


---

*This guide consolidates all unit and integration test rules, removing redundancies and organizing content for maximum clarity and maintainability.*
