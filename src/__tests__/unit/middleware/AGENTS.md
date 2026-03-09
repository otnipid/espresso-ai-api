# Middleware Unit Testing Guide

## 🎯 Express Middleware Testing Principles

- **Sequential Execution**: Test middleware chains in proper order
- **Request/Response Flow**: Verify HTTP request/response handling
- **Error Propagation**: Test error handling and next() calls
- **Validation Logic**: Focus on input validation and business rules
- **Database Independence**: Mock all repository calls

## 🚨 Critical Rules for Middleware

### **Rule: Test Middleware Chains, Not Individual Functions**

Express middleware arrays execute functions sequentially:

```typescript
export const validateCreateShot = [
  validate(CreateShotSchema, 'body'), // 1st: Schema validation
  validateMachineExists, // 2nd: Database validation
  validateBeanBatchExists, // 3rd: Database validation
  validateShotBusinessRules, // 4th: Business rules
];
```

### **Rule: Apply General Testing Principles to Middleware**

For middleware testing, apply **general unit testing rules**:

- **Test Behavior, Not Implementation** - Focus on response outcomes, not `next()` calls
- **Test What Users Care About** - Verify API responses and database interactions
- **Use Valid UUID Format** - Ensure proper test data format

```typescript
// ✅ CORRECT - Apply general principles to middleware
expect(mockResponse.status).toHaveBeenCalledWith(404);
expect(mockBeanBatchRepo.findOne).toHaveBeenCalledWith({
  where: { id: '550e8400-e29b-41d4-a716-446655440001' },
});

// ❌ WRONG - Testing implementation details
expect(mockNext).not.toHaveBeenCalled();
expect(mockNext).toHaveBeenCalledTimes(2);
```

## 🛠️ Middleware Testing Helper

### **runMiddleware Helper Pattern**

```typescript
const runMiddleware = async (
  middleware: any[],
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

### **Why Index-Based Loop?**

- **Debugging Support**: Enables position tracking (`middleware-${i}`)
- **Future Troubleshooting**: Easy to add logging for failing middleware
- **Maintainability**: Clear indication of execution position

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

    // Verify right validation was attempted
    expect(mockBeanBatchRepo.findOne).toHaveBeenCalledWith({
      where: { id: '550e8400-e29b-41d4-a716-446655440001' },
    });
  });
});
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
    const zodError = new ZodError([
      /* ... */
    ]);

    errorHandler(zodError, mockRequest, mockResponse, mockNext);

    // Test behavior: response status and content
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Validation Error',
      message: 'Invalid input data provided',
      code: 'VALIDATION_FAILED',
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
      responseOnCalls: mockResponse.on.mock.calls,
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
    const invalidData = {
      /* invalid shot data */
    };

    await runMiddleware(validateCreateShot, mockRequest, mockResponse, mockNext);

    // Test behavior: validation error response
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Validation Error',
      message: expect.stringContaining('Invalid input'),
    });
  });
});
```

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

| Issue                       | Debug Strategy                                     |
| --------------------------- | -------------------------------------------------- |
| **Wrong middleware called** | Log middleware names and execution order           |
| **Mock not being called**   | Log mock setup and verify repository calls         |
| **Response not sent**       | Log status calls and check middleware return paths |
| **Unexpected next() calls** | Log each middleware's decision logic               |

## 🎯 Specific Middleware Testing Patterns

### **Schema Validation Middleware**

```typescript
describe('validateSchema middleware', () => {
  it('should pass valid data', async () => {
    const validData = {
      machine_id: '550e8400-e29b-41d4-a716-446655440000',
      bean_batch_id: '550e8400-e29b-41d4-a716-446655440001',
      shot_type: 'espresso',
    };

    mockRequest.body = validData;

    await validateSchema(CreateShotSchema, 'body')(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should reject invalid data', async () => {
    const invalidData = {
      machine_id: 'invalid-uuid',
      shot_type: 'invalid-type',
    };

    mockRequest.body = invalidData;

    await validateSchema(CreateShotSchema, 'body')(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Validation Error',
      message: expect.stringContaining('Invalid'),
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
```

### **Entity Existence Validation Middleware**

```typescript
describe('validateMachineExists', () => {
  it('should pass when machine exists', async () => {
    mockRequest.body = { machine_id: '550e8400-e29b-41d4-a716-446655440000' };
    mockMachineRepo.findOne.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440000',
      model: 'Test Machine',
    });

    await validateMachineExists(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockMachineRepo.findOne).toHaveBeenCalledWith({
      where: { id: '550e8400-e29b-41d4-a716-446655440000' },
    });
  });

  it('should fail when machine does not exist', async () => {
    mockRequest.body = { machine_id: 'non-existent-machine' };
    mockMachineRepo.findOne.mockResolvedValue(null);

    await validateMachineExists(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Validation failed',
      message: 'Machine not found',
      field: 'machineId',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
```

### **Business Rules Validation Middleware**

```typescript
describe('validateShotBusinessRules', () => {
  it('should pass valid business rules', async () => {
    const validShot = {
      shot_type: 'espresso',
      dose: 18.5,
      extraction_time: 25,
      pulled_at: new Date(),
    };

    mockRequest.validated = { body: validShot };

    await validateShotBusinessRules(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should reject invalid extraction ratio', async () => {
    const invalidShot = {
      shot_type: 'espresso',
      dose: 18.5,
      extraction_time: 60, // Too long for espresso
      pulled_at: new Date(),
    };

    mockRequest.validated = { body: invalidShot };

    await validateShotBusinessRules(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Business rule violation',
      message: expect.stringContaining('extraction ratio'),
      field: 'extraction_time',
    });
  });

  it('should reject old shot dates', async () => {
    const oldShot = {
      shot_type: 'espresso',
      dose: 18.5,
      pulled_at: new Date('2020-01-01'), // More than 1 year old
    };

    mockRequest.validated = { body: oldShot };

    await validateShotBusinessRules(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Business rule violation',
      message: 'Shot date cannot be more than 1 year old',
      field: 'pulled_at',
      minimumAllowedDate: expect.any(String),
    });
  });
});
```

### **Error Handler Middleware**

```typescript
describe('errorHandler', () => {
  it('should handle validation errors', async () => {
    const validationError = new ValidationError('Invalid data', {
      field: 'email',
      value: 'invalid-email',
    });

    errorHandler(validationError, mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Validation Error',
      message: 'Invalid input data provided',
      code: 'VALIDATION_FAILED',
      details: { field: 'email' },
    });
  });

  it('should handle database errors', async () => {
    const dbError = new DatabaseError('Connection failed', new Error('Postgres error'));

    errorHandler(dbError, mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Database Error',
      message: 'A database error occurred',
      code: 'DATABASE_ERROR',
    });
  });

  it('should handle generic errors', async () => {
    const genericError = new Error('Something went wrong');

    errorHandler(genericError, mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
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

// Correct: Tests actual response
expect(mockResponse.status).toHaveBeenCalledWith(404);
```

### **Issue: Testing Implementation Details**

**Problem**: Testing how many times `next()` was called.

**Solution**: Test final outcome and database interactions.

```typescript
// Brittle: Tests internal flow
expect(mockNext).toHaveBeenCalledTimes(2);

// Robust: Tests external behavior
expect(mockResponse.status).toHaveBeenCalledWith(404);
expect(mockBeanBatchRepo.findOne).toHaveBeenCalled();
```

## 📋 Middleware Test Checklist

### **Before Writing Tests:**

- [ ] Identify middleware chain structure
- [ ] Map all repository dependencies
- [ ] Setup comprehensive mocks
- [ ] Plan validation scenarios
- [ ] Understand error handling flow

### **For Each Test:**

- [ ] Arrange: Set up request data and mocks
- [ ] Act: Run middleware or chain
- [ ] Assert status codes
- [ ] Assert response body
- [ ] Verify database interactions
- [ ] Test both success and failure paths

### **Test Coverage Requirements:**

- [ ] Schema validation (valid/invalid data)
- [ ] Entity existence checks (found/not found)
- [ ] Business rule validation (boundary values)
- [ ] Error handling (try/catch blocks)
- [ ] Middleware chain behavior (early termination)
- [ ] Error handler responses (different error types)

## 🔧 Common Middleware Testing Issues

### **Issue: Async Middleware Handling**

```typescript
// ❌ WRONG - Missing await
it('should handle async validation', () => {
  validateAsync(mockRequest, mockResponse, mockNext);
  expect(mockResponse.status).toHaveBeenCalledWith(400);
});

// ✅ CORRECT - Proper async handling
it('should handle async validation', async () => {
  await validateAsync(mockRequest, mockResponse, mockNext);
  expect(mockResponse.status).toHaveBeenCalledWith(400);
});
```

### **Issue: Request Body vs Validated Body**

```typescript
// ❌ WRONG - Using wrong request property
mockRequest.body = { field: 'value' };
await validateBusinessRules(mockRequest, mockResponse, mockNext);

// ✅ CORRECT - Using validated body
mockRequest.validated = { body: { field: 'value' } };
await validateBusinessRules(mockRequest, mockResponse, mockNext);
```

### **Issue: Middleware Chain Testing**

```typescript
// ❌ WRONG - Testing individual middleware
await validateMachineExists(mockRequest, mockResponse, mockNext);

// ✅ CORRECT - Testing full chain
await runMiddleware(validateCreateShot, mockRequest, mockResponse, mockNext);
```
